export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET requests allowed' });
  }

  try {
    const accessToken = process.env.WHOOP_ACCESS_TOKEN;
    
    if (!accessToken) {
      return res.status(500).json({ error: 'Whoop access token not configured' });
    }

    console.log('🔍 Fetching ALL historical strain data...');

    // Function to fetch all strain data with pagination and rate limiting
    const fetchAllStrainData = async () => {
      let allRecords = [];
      let nextToken = null;
      let pageCount = 0;
      const maxPages = 50; // Reduced to avoid rate limits

      do {
        pageCount++;
        console.log(`📄 Fetching strain page ${pageCount}...`);

        // Add delay between requests to avoid rate limits
        if (pageCount > 1) {
          await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
        }

        // Build URL with optional next_token - use workout endpoint for strain data
        let url = 'https://api.prod.whoop.com/developer/v1/activity/workout';
        if (nextToken) {
          url += `?nextToken=${encodeURIComponent(nextToken)}`;
        }

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'MyWhoopApp/1.0'
          }
        });

        if (!response.ok) {
          console.error(`❌ Strain API failed on page ${pageCount}:`, response.status, response.statusText);
          
          // If it's an authentication error, return it immediately
          if (response.status === 401) {
            return res.status(401).json({ 
              error: 'Authentication failed - token expired or invalid',
              needsAuth: true,
              whoopStatus: response.status
            });
          }
          
          break;
        }

        const data = await response.json();
        console.log(`✅ Strain page ${pageCount}: ${data.records?.length || 0} records`);

        if (data.records && data.records.length > 0) {
          allRecords = allRecords.concat(data.records);
        }

        nextToken = data.next_token;
        console.log(`🔍 Next token: ${nextToken ? 'EXISTS' : 'NONE'}`);

        // Safety check
        if (pageCount >= maxPages) {
          console.log(`⚠️ Reached maximum page limit (${maxPages}), stopping`);
          break;
        }

      } while (nextToken);

      console.log(`🎉 Total strain records fetched: ${allRecords.length} across ${pageCount} pages`);
      return allRecords;
    };

    // Fetch all strain records
    const allStrainRecords = await fetchAllStrainData();

    // Get user profile data
    const profileResponse = await fetch('https://api.prod.whoop.com/developer/v1/user/profile/basic', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'MyWhoopApp/1.0'
      }
    });

    let profileData = null;
    if (profileResponse.ok) {
      profileData = await profileResponse.json();
    }

    // Return the comprehensive strain data
    const strainData = {
      records: allStrainRecords,
      total_count: allStrainRecords.length,
      date_range: allStrainRecords.length > 0 ? {
        earliest: new Date(allStrainRecords[allStrainRecords.length - 1].start || allStrainRecords[allStrainRecords.length - 1].created_at).toISOString().split('T')[0],
        latest: new Date(allStrainRecords[0].start || allStrainRecords[0].created_at).toISOString().split('T')[0]
      } : null
    };

    console.log('📊 Final strain data summary:');
    console.log(`Strain records: ${strainData.total_count}`);
    console.log(`Date range: ${strainData.date_range?.earliest} to ${strainData.date_range?.latest}`);

    res.status(200).json({
      profile: profileData,
      strain: strainData,
      fetchedAt: new Date().toISOString(),
      pagination_info: {
        total_records: allStrainRecords.length,
        pages_fetched: Math.ceil(allStrainRecords.length / 10)
      }
    });

  } catch (error) {
    console.error('🚨 Strain API error:', error);
    
    // Check if it's an auth-related error
    if (error.message?.includes('401') || error.message?.includes('unauthorized') || error.message?.includes('authentication')) {
      return res.status(401).json({ 
        error: 'Authentication failed - please re-login to Whoop',
        needsAuth: true,
        details: error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch strain data',
      details: error.message,
      stack: error.stack
    });
  }
}

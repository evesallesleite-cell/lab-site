export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET requests allowed' });
  }

  try {
    const accessToken = process.env.WHOOP_ACCESS_TOKEN;
    
    if (!accessToken) {
      return res.status(500).json({ error: 'Whoop access token not configured' });
    }

    console.log('🔍 Fetching ALL historical sleep data...');

    // Function to fetch all sleep data with pagination and rate limiting
    const fetchAllSleepData = async () => {
      let allRecords = [];
      let nextToken = null;
      let pageCount = 0;
      const maxPages = 50; // Reduced to avoid rate limits

      do {
        pageCount++;
        console.log(`📄 Fetching page ${pageCount}...`);

        // Add delay between requests to avoid rate limits
        if (pageCount > 1) {
          await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
        }

        // Build URL with optional next_token
        let url = 'https://api.prod.whoop.com/developer/v1/activity/sleep';
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
          console.error(`❌ Sleep API failed on page ${pageCount}:`, response.status, response.statusText);
          
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
        console.log(`✅ Page ${pageCount}: ${data.records?.length || 0} records`);

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

      console.log(`🎉 Total records fetched: ${allRecords.length} across ${pageCount} pages`);
      return allRecords;
    };

    // Fetch all sleep records
    const allSleepRecords = await fetchAllSleepData();

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

    // Return the comprehensive sleep data
    const sleepData = {
      records: allSleepRecords,
      total_count: allSleepRecords.length,
      date_range: allSleepRecords.length > 0 ? {
        earliest: new Date(allSleepRecords[allSleepRecords.length - 1].start).toISOString().split('T')[0],
        latest: new Date(allSleepRecords[0].start).toISOString().split('T')[0]
      } : null
    };

    console.log('📊 Final data summary:');
    console.log(`Sleep records: ${sleepData.total_count}`);
    console.log(`Date range: ${sleepData.date_range?.earliest} to ${sleepData.date_range?.latest}`);

    res.status(200).json({
      profile: profileData,
      sleep: sleepData,
      fetchedAt: new Date().toISOString(),
      pagination_info: {
        total_records: allSleepRecords.length,
        pages_fetched: Math.ceil(allSleepRecords.length / 10)
      }
    });

  } catch (error) {
    console.error('🚨 Whoop API error:', error);
    
    // Check if it's an auth-related error
    if (error.message?.includes('401') || error.message?.includes('unauthorized') || error.message?.includes('authentication')) {
      return res.status(401).json({ 
        error: 'Authentication failed - please re-login to Whoop',
        needsAuth: true,
        details: error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch Whoop data',
      details: error.message,
      stack: error.stack
    });
  }
}

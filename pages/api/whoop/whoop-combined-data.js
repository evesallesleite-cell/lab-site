export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET requests allowed' });
  }

  try {
    const accessToken = process.env.WHOOP_ACCESS_TOKEN;
    
    if (!accessToken) {
      return res.status(500).json({ error: 'Whoop access token not configured' });
    }

    console.log('🔄 Fetching ALL Whoop data (Sleep, Strain, Recovery)...');

    // Shared fetch function with rate limiting and pagination
    const fetchWithRateLimit = async (url, pageLimit = 100) => {
      let allRecords = [];
      let nextToken = null;
      let pageCount = 0;
      const maxRetries = 3;

      do {
        pageCount++;
        console.log(`📄 Fetching ${url.split('/').pop()} page ${pageCount}...`);

        // Add delay between requests - longer delays for larger page numbers
        if (pageCount > 1) {
          const delay = pageCount > 50 ? 1500 : pageCount > 25 ? 1000 : 750;
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        let apiUrl = url;
        if (nextToken) {
          apiUrl += `?nextToken=${encodeURIComponent(nextToken)}`;
        }

        let retryCount = 0;
        let success = false;
        let data = null;

        // Retry logic for failed requests
        while (!success && retryCount < maxRetries) {
          try {
            const response = await fetch(apiUrl, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'MyWhoopApp/1.0'
              }
            });

            if (!response.ok) {
              if (response.status === 401) {
                throw new Error('Authentication failed - token expired or invalid');
              }
              if (response.status === 429) {
                console.log(`⏳ Rate limited on page ${pageCount}, waiting ${2000 + (retryCount * 1000)}ms...`);
                await new Promise(resolve => setTimeout(resolve, 2000 + (retryCount * 1000)));
                retryCount++;
                continue;
              }
              console.error(`❌ ${url} failed on page ${pageCount}:`, response.status, response.statusText);
              break;
            }

            data = await response.json();
            success = true;
          } catch (error) {
            retryCount++;
            if (retryCount >= maxRetries) {
              throw error;
            }
            console.log(`🔄 Retry ${retryCount}/${maxRetries} for page ${pageCount}...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }

        if (!success || !data) {
          break;
        }

        console.log(`✅ ${url.split('/').pop()} page ${pageCount}: ${data.records?.length || 0} records`);

        if (data.records && data.records.length > 0) {
          allRecords = allRecords.concat(data.records);
        }

        nextToken = data.next_token;
        
        if (pageCount >= pageLimit) {
          console.log(`⚠️ Reached page limit of ${pageLimit} for ${url}`);
          if (nextToken) {
            console.log(`📊 Note: More data available - increase page limit or implement continuation`);
          }
          break;
        }

      } while (nextToken && pageCount < pageLimit);

      return allRecords;
    };

    // Fetch profile first
    const profileResponse = await fetch('https://api.prod.whoop.com/developer/v1/user/profile/basic', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'MyWhoopApp/1.0'
      }
    });

    const profileData = profileResponse.ok ? await profileResponse.json() : null;

    // Fetch all data sequentially to avoid rate limits
    console.log('📊 Fetching Sleep data...');
    const sleepRecords = await fetchWithRateLimit('https://api.prod.whoop.com/developer/v1/activity/sleep', 100);
    
    // Wait before next request
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('💪 Fetching Strain data...');
    const strainRecords = await fetchWithRateLimit('https://api.prod.whoop.com/developer/v1/activity/workout', 100);
    
    // Wait before next request
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔋 Fetching Recovery data...');
    const recoveryRecords = await fetchWithRateLimit('https://api.prod.whoop.com/developer/v1/recovery', 100);

    // Structure the response
    const responseData = {
      profile: profileData,
      sleep: {
        records: sleepRecords,
        total_count: sleepRecords.length,
        date_range: sleepRecords.length > 0 ? {
          earliest: sleepRecords[sleepRecords.length - 1]?.start,
          latest: sleepRecords[0]?.start
        } : null
      },
      strain: {
        records: strainRecords,
        total_count: strainRecords.length,
        date_range: strainRecords.length > 0 ? {
          earliest: strainRecords[strainRecords.length - 1]?.start,
          latest: strainRecords[0]?.start
        } : null
      },
      recovery: {
        records: recoveryRecords,
        total_count: recoveryRecords.length,
        date_range: recoveryRecords.length > 0 ? {
          earliest: recoveryRecords[recoveryRecords.length - 1]?.start || recoveryRecords[recoveryRecords.length - 1]?.created_at,
          latest: recoveryRecords[0]?.start || recoveryRecords[0]?.created_at
        } : null
      },
      fetchedAt: new Date().toISOString(),
      summary: {
        total_sleep_records: sleepRecords.length,
        total_strain_records: strainRecords.length,
        total_recovery_records: recoveryRecords.length
      }
    };

    console.log('🎉 Complete data fetch summary:');
    console.log(`Sleep: ${sleepRecords.length} records`);
    console.log(`Strain: ${strainRecords.length} records`);
    console.log(`Recovery: ${recoveryRecords.length} records`);

    res.status(200).json(responseData);

  } catch (error) {
    console.error('🚨 Combined API error:', error);
    
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

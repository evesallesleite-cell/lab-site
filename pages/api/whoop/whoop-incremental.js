import WhoopIncrementalStore from '../../../lib/whoop-incremental-store-fixed.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get access token from multiple sources
    let accessToken = req.cookies.access_token || 
                     req.headers.authorization?.replace('Bearer ', '') ||
                     process.env.WHOOP_ACCESS_TOKEN;
    
    if (!accessToken) {
      return res.status(401).json({ error: 'No access token found. Please authenticate with Whoop first.' });
    }

    const store = new WhoopIncrementalStore();
    const { type, forceRefresh } = req.query;

    // If no type specified, get all data types
    if (!type) {
      console.log('🔄 Fetching incremental data for all types...');
      
      const results = {};
      
      for (const dataType of ['sleep', 'strain', 'recovery']) {
        try {
          if (forceRefresh === 'true') {
            console.log(`🔄 Force refreshing ${dataType}...`);
            results[dataType] = await store.forceFullRefresh(dataType, accessToken);
          } else {
            console.log(`🔄 Incremental update for ${dataType}...`);
            results[dataType] = await store.fetchIncrementalData(dataType, accessToken);
          }
          
          // Add delay between types to prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`❌ Error fetching ${dataType}:`, error);
          // If fetch fails, return existing data
          results[dataType] = store.getAllData(dataType);
          results[dataType].error = error.message;
        }
      }

      // Add summary information
      const summary = store.getDataSummary();
      
      return res.status(200).json({
        success: true,
        data: results,
        summary,
        timestamp: new Date().toISOString(),
        forceRefresh: forceRefresh === 'true'
      });
    }

    // Single type request
    if (!['sleep', 'strain', 'recovery'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be sleep, strain, or recovery' });
    }

    let result;
    if (forceRefresh === 'true') {
      console.log(`🔄 Force refreshing ${type}...`);
      result = await store.forceFullRefresh(type, accessToken);
    } else {
      console.log(`🔄 Incremental update for ${type}...`);
      result = await store.fetchIncrementalData(type, accessToken);
    }

    const summary = store.getDataSummary();

    return res.status(200).json({
      success: true,
      type,
      data: result,
      summary: summary[type],
      timestamp: new Date().toISOString(),
      forceRefresh: forceRefresh === 'true'
    });

  } catch (error) {
    console.error('❌ Incremental data fetch error:', error);
    return res.status(500).json({
      error: 'Failed to fetch incremental data',
      details: error.message
    });
  }
}

import PersonalHealthDataAggregator from '../../../lib/personal-health-aggregator.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const aggregator = new PersonalHealthDataAggregator();
      
      // Check if we should refresh the data
      const refresh = req.query.refresh === 'true';
      
      let unifiedData;
      if (refresh) {
        // Generate fresh unified data
        unifiedData = await aggregator.saveUnifiedData();
      } else {
        // Try to load existing data, generate if not found
        unifiedData = aggregator.loadUnifiedData();
        if (!unifiedData) {
          unifiedData = await aggregator.saveUnifiedData();
        }
      }
      
      res.status(200).json({
        success: true,
        data: unifiedData,
        message: refresh ? 'Data refreshed successfully' : 'Data loaded successfully'
      });
    } catch (error) {
      console.error('Error in unified data API:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
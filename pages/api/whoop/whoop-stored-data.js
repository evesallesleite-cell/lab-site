import WhoopIncrementalStore from '../../../lib/whoop-incremental-store-fixed.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const store = new WhoopIncrementalStore();
    const { type } = req.query;

    // If no type specified, get all stored data
    if (!type) {
      const results = {};
      
      ['sleep', 'strain', 'recovery'].forEach(dataType => {
        results[dataType] = store.getAllData(dataType);
      });

      const summary = store.getDataSummary();
      
      return res.status(200).json({
        success: true,
        data: results,
        summary,
        timestamp: new Date().toISOString(),
        source: 'stored_files'
      });
    }

    // Single type request
    if (!['sleep', 'strain', 'recovery'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be sleep, strain, or recovery' });
    }

    const result = store.getAllData(type);
    const summary = store.getDataSummary();

    return res.status(200).json({
      success: true,
      type,
      data: result,
      summary: summary[type],
      timestamp: new Date().toISOString(),
      source: 'stored_files'
    });

  } catch (error) {
    console.error('❌ Error reading stored data:', error);
    return res.status(500).json({
      error: 'Failed to read stored data',
      details: error.message
    });
  }
}

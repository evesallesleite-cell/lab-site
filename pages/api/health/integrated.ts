import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchHealthData, getHealthInsights } from '../../lib/clawdbot-integration';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const [healthData, insights] = await Promise.all([
      fetchHealthData(),
      getHealthInsights(),
    ]);

    res.status(200).json({
      source: 'clawdbot',
      timestamp: new Date().toISOString(),
      health: healthData,
      insights,
    });
  } catch (error) {
    console.error('Error in integrated health API:', error);
    res.status(500).json({ error: 'Failed to fetch integrated health data' });
  }
}

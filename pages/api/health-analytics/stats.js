// API endpoint to get basic stats about the health data
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    
    // Load all health data
    const strainData = JSON.parse(fs.readFileSync(path.join(dataDir, 'strain-data.json'), 'utf8'));
    const sleepData = JSON.parse(fs.readFileSync(path.join(dataDir, 'sleep-data.json'), 'utf8'));
    const recoveryData = JSON.parse(fs.readFileSync(path.join(dataDir, 'recovery-data.json'), 'utf8'));
    
    // Try to load supplement data if it exists
    let supplementData = [];
    try {
      const supplementPath = path.join(dataDir, 'supplement-data.json');
      if (fs.existsSync(supplementPath)) {
        supplementData = JSON.parse(fs.readFileSync(supplementPath, 'utf8'));
      }
    } catch (error) {
      console.log('No supplement data found');
    }

    // Calculate stats
    const stats = {
      sleep_sessions: sleepData.length,
      workout_sessions: strainData.filter(s => s.workouts && s.workouts.length > 0).length,
      recovery_sessions: recoveryData.length,
      supplement_entries: supplementData.length,
      total_strain_sessions: strainData.length,
      date_range: {
        earliest: getEarliestDate([strainData, sleepData, recoveryData]),
        latest: getLatestDate([strainData, sleepData, recoveryData])
      }
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error loading health stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

function getEarliestDate(datasets) {
  let earliest = null;
  
  datasets.forEach(dataset => {
    dataset.forEach(item => {
      const date = new Date(item.days || item.created_at || item.updated_at || item.start);
      if (!earliest || date < earliest) {
        earliest = date;
      }
    });
  });
  
  return earliest ? earliest.toISOString().split('T')[0] : null;
}

function getLatestDate(datasets) {
  let latest = null;
  
  datasets.forEach(dataset => {
    dataset.forEach(item => {
      const date = new Date(item.days || item.created_at || item.updated_at || item.start);
      if (!latest || date > latest) {
        latest = date;
      }
    });
  });
  
  return latest ? latest.toISOString().split('T')[0] : null;
}
// API endpoint to get available metrics from the health data
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    
    // Load sample data to determine available metrics
    const strainData = JSON.parse(fs.readFileSync(path.join(dataDir, 'strain-data.json'), 'utf8'));
    const sleepData = JSON.parse(fs.readFileSync(path.join(dataDir, 'sleep-data.json'), 'utf8'));
    const recoveryData = JSON.parse(fs.readFileSync(path.join(dataDir, 'recovery-data.json'), 'utf8'));

    const metrics = new Set();

    // Extract metrics from strain data
    if (strainData.length > 0) {
      const sample = strainData[0];
      if (sample.strain) metrics.add('strain');
      if (sample.kilojoules) metrics.add('kilojoules');
      if (sample.average_heart_rate) metrics.add('average_heart_rate');
      if (sample.max_heart_rate) metrics.add('max_heart_rate');
      
      // Check for workout-specific metrics
      if (sample.workouts && sample.workouts.length > 0) {
        const workout = sample.workouts[0];
        if (workout.strain) metrics.add('workout_strain');
        if (workout.average_heart_rate) metrics.add('workout_avg_hr');
        if (workout.max_heart_rate) metrics.add('workout_max_hr');
      }
    }

    // Extract metrics from sleep data
    if (sleepData.length > 0) {
      const sample = sleepData[0];
      if (sample.efficiency_percentage) metrics.add('sleep_efficiency');
      if (sample.respiratory_rate) metrics.add('respiratory_rate');
      if (sample.sleep_performance_percentage) metrics.add('sleep_performance');
      if (sample.restorative_sleep_percentage) metrics.add('restorative_sleep');
      if (sample.sleep_consistency_percentage) metrics.add('sleep_consistency');
      
      // Sleep stages
      if (sample.stage_summary) {
        if (sample.stage_summary.total_in_bed_time_milli) metrics.add('time_in_bed');
        if (sample.stage_summary.total_awake_time_milli) metrics.add('awake_time');
        if (sample.stage_summary.total_no_data_time_milli) metrics.add('no_data_time');
        if (sample.stage_summary.total_light_sleep_time_milli) metrics.add('light_sleep');
        if (sample.stage_summary.total_deep_sleep_time_milli) metrics.add('deep_sleep');
        if (sample.stage_summary.total_rem_sleep_time_milli) metrics.add('rem_sleep');
      }
    }

    // Extract metrics from recovery data
    if (recoveryData.length > 0) {
      const sample = recoveryData[0];
      if (sample.recovery_score) metrics.add('recovery_score');
      if (sample.resting_heart_rate) metrics.add('resting_heart_rate');
      if (sample.hrv_rmssd_milli) metrics.add('hrv');
      if (sample.spo2_percentage) metrics.add('spo2');
      if (sample.skin_temp_celsius) metrics.add('skin_temp');
    }

    res.json({
      success: true,
      metrics: Array.from(metrics).sort()
    });

  } catch (error) {
    console.error('Error loading metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
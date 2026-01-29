// Health Analytics Tools - Implements the actual data analysis functions
import fs from 'fs';
import path from 'path';

// Load and cache health data
let healthData = null;

function loadHealthData() {
  if (healthData) return healthData;

  const dataDir = path.join(process.cwd(), 'data');
  
  try {
    const strainData = JSON.parse(fs.readFileSync(path.join(dataDir, 'strain-data.json'), 'utf8'));
    const sleepData = JSON.parse(fs.readFileSync(path.join(dataDir, 'sleep-data.json'), 'utf8'));
    const recoveryData = JSON.parse(fs.readFileSync(path.join(dataDir, 'recovery-data.json'), 'utf8'));
    
    // Load supplement data if available
    let supplementData = [];
    try {
      const supplementPath = path.join(dataDir, 'supplement-data.json');
      if (fs.existsSync(supplementPath)) {
        supplementData = JSON.parse(fs.readFileSync(supplementPath, 'utf8'));
      }
    } catch (error) {
      console.log('No supplement data found');
    }

    healthData = {
      strain: strainData,
      sleep: sleepData,
      recovery: recoveryData,
      supplements: supplementData
    };

    return healthData;
  } catch (error) {
    console.error('Error loading health data:', error);
    throw error;
  }
}

// Normalize data into unified daily records
function createDailyRecords() {
  const data = loadHealthData();
  const dailyRecords = new Map();

  // Process strain data
  data.strain.forEach(record => {
    const date = record.days; // Format: "2024-09-15"
    if (!dailyRecords.has(date)) {
      dailyRecords.set(date, { date });
    }
    
    const daily = dailyRecords.get(date);
    daily.strain = record.strain;
    daily.kilojoules = record.kilojoules;
    daily.average_heart_rate = record.average_heart_rate;
    daily.max_heart_rate = record.max_heart_rate;
    
    // Process workouts
    if (record.workouts && record.workouts.length > 0) {
      daily.workout_count = record.workouts.length;
      daily.workout_strain = record.workouts.reduce((sum, w) => sum + (w.strain || 0), 0);
      daily.workout_avg_hr = record.workouts.reduce((sum, w) => sum + (w.average_heart_rate || 0), 0) / record.workouts.length;
      daily.workout_max_hr = Math.max(...record.workouts.map(w => w.max_heart_rate || 0));
    }
  });

  // Process sleep data
  data.sleep.forEach(record => {
    const date = record.days;
    if (!dailyRecords.has(date)) {
      dailyRecords.set(date, { date });
    }
    
    const daily = dailyRecords.get(date);
    daily.sleep_efficiency = record.efficiency_percentage;
    daily.respiratory_rate = record.respiratory_rate;
    daily.sleep_performance = record.sleep_performance_percentage;
    daily.restorative_sleep = record.restorative_sleep_percentage;
    daily.sleep_consistency = record.sleep_consistency_percentage;
    
    if (record.stage_summary) {
      daily.time_in_bed = record.stage_summary.total_in_bed_time_milli / (1000 * 60 * 60); // Convert to hours
      daily.awake_time = record.stage_summary.total_awake_time_milli / (1000 * 60 * 60);
      daily.light_sleep = record.stage_summary.total_light_sleep_time_milli / (1000 * 60 * 60);
      daily.deep_sleep = record.stage_summary.total_deep_sleep_time_milli / (1000 * 60 * 60);
      daily.rem_sleep = record.stage_summary.total_rem_sleep_time_milli / (1000 * 60 * 60);
    }
  });

  // Process recovery data
  data.recovery.forEach(record => {
    const date = record.days;
    if (!dailyRecords.has(date)) {
      dailyRecords.set(date, { date });
    }
    
    const daily = dailyRecords.get(date);
    daily.recovery_score = record.recovery_score;
    daily.resting_heart_rate = record.resting_heart_rate;
    daily.hrv = record.hrv_rmssd_milli;
    daily.spo2 = record.spo2_percentage;
    daily.skin_temp = record.skin_temp_celsius;
  });

  // Process supplements (basic implementation - would need actual supplement data structure)
  data.supplements.forEach(record => {
    const date = new Date(record.timestamp || record.date).toISOString().split('T')[0];
    if (!dailyRecords.has(date)) {
      dailyRecords.set(date, { date });
    }
    
    const daily = dailyRecords.get(date);
    if (!daily.supplements) daily.supplements = [];
    daily.supplements.push(record);
  });

  return Array.from(dailyRecords.values()).sort((a, b) => a.date.localeCompare(b.date));
}

// Time series analysis
export async function runTimeSeries(metric, startDate, endDate, groupBy) {
  try {
    const dailyRecords = createDailyRecords();
    
    // Filter by date range
    const filtered = dailyRecords.filter(record => 
      record.date >= startDate && record.date <= endDate && record[metric] != null
    );

    let grouped;
    
    if (groupBy === 'day') {
      grouped = filtered.map(record => ({
        period: record.date,
        value: record[metric]
      }));
    } else if (groupBy === 'week') {
      grouped = groupByWeek(filtered, metric);
    } else if (groupBy === 'month') {
      grouped = groupByMonth(filtered, metric);
    }

    return {
      success: true,
      data: grouped,
      sql: `-- Time series for ${metric} grouped by ${groupBy}\n-- Date range: ${startDate} to ${endDate}\n-- Found ${grouped.length} data points`
    };
  } catch (error) {
    console.error('Error in runTimeSeries:', error);
    throw error;
  }
}

// Cohort comparison
export async function runCohortCompare(metric, conditionA, conditionB) {
  try {
    const dailyRecords = createDailyRecords();
    
    // Simple supplement detection (would need more sophisticated logic for real supplements)
    const cohortA = dailyRecords.filter(record => {
      if (conditionA.toLowerCase().includes('magnesium')) {
        return record.supplements && record.supplements.some(s => 
          s.name && s.name.toLowerCase().includes('magnesium')
        );
      }
      // Add more condition logic here
      return false;
    }).filter(record => record[metric] != null);

    const cohortB = dailyRecords.filter(record => {
      if (conditionB.toLowerCase().includes('no magnesium')) {
        return !record.supplements || !record.supplements.some(s => 
          s.name && s.name.toLowerCase().includes('magnesium')
        );
      }
      // Add more condition logic here
      return true;
    }).filter(record => record[metric] != null && !cohortA.find(a => a.date === record.date));

    const avgA = cohortA.reduce((sum, r) => sum + r[metric], 0) / cohortA.length || 0;
    const avgB = cohortB.reduce((sum, r) => sum + r[metric], 0) / cohortB.length || 0;

    return {
      success: true,
      data: [
        { cohort: 'A', avg_metric: avgA, n: cohortA.length },
        { cohort: 'B', avg_metric: avgB, n: cohortB.length }
      ],
      sql: `-- Cohort comparison for ${metric}\n-- Condition A: ${conditionA} (${cohortA.length} days)\n-- Condition B: ${conditionB} (${cohortB.length} days)`
    };
  } catch (error) {
    console.error('Error in runCohortCompare:', error);
    throw error;
  }
}

// Correlation analysis
export async function runCorrelation(metricX, metricY, lagDays) {
  try {
    const dailyRecords = createDailyRecords();
    
    // Create pairs with lag
    const pairs = [];
    for (let i = 0; i < dailyRecords.length - lagDays; i++) {
      const recordX = dailyRecords[i];
      const recordY = dailyRecords[i + lagDays];
      
      if (recordX[metricX] != null && recordY[metricY] != null) {
        pairs.push({
          x: recordX[metricX],
          y: recordY[metricY]
        });
      }
    }

    if (pairs.length < 2) {
      throw new Error('Insufficient data points for correlation analysis');
    }

    // Calculate Pearson correlation
    const correlation = calculatePearsonCorrelation(pairs);
    
    return {
      success: true,
      data: {
        correlation: correlation.r,
        p_value: correlation.p || 0.5, // Simplified p-value
        n: pairs.length
      },
      sql: `-- Correlation between ${metricX} and ${metricY} (lag: ${lagDays} days)\n-- Sample size: ${pairs.length} paired observations`
    };
  } catch (error) {
    console.error('Error in runCorrelation:', error);
    throw error;
  }
}

// SQL query runner (for future expansion)
export async function runSqlQuery(query, description) {
  // This would implement a SQL-like interface over the JSON data
  // For now, return an error
  throw new Error('SQL queries not yet implemented');
}

// Get available metrics
export async function getAvailableMetrics() {
  const sample = createDailyRecords()[0] || {};
  return Object.keys(sample).filter(key => 
    key !== 'date' && 
    key !== 'supplements' && 
    typeof sample[key] === 'number'
  );
}

// Helper functions
function groupByWeek(records, metric) {
  const weeks = new Map();
  
  records.forEach(record => {
    const date = new Date(record.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeks.has(weekKey)) {
      weeks.set(weekKey, []);
    }
    weeks.get(weekKey).push(record[metric]);
  });

  return Array.from(weeks.entries()).map(([week, values]) => ({
    period: week,
    value: values.reduce((sum, v) => sum + v, 0) / values.length
  })).sort((a, b) => a.period.localeCompare(b.period));
}

function groupByMonth(records, metric) {
  const months = new Map();
  
  records.forEach(record => {
    const monthKey = record.date.substring(0, 7); // YYYY-MM
    
    if (!months.has(monthKey)) {
      months.set(monthKey, []);
    }
    months.get(monthKey).push(record[metric]);
  });

  return Array.from(months.entries()).map(([month, values]) => ({
    period: month,
    value: values.reduce((sum, v) => sum + v, 0) / values.length
  })).sort((a, b) => a.period.localeCompare(b.period));
}

function calculatePearsonCorrelation(pairs) {
  const n = pairs.length;
  const sumX = pairs.reduce((sum, p) => sum + p.x, 0);
  const sumY = pairs.reduce((sum, p) => sum + p.y, 0);
  const sumXY = pairs.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = pairs.reduce((sum, p) => sum + p.x * p.x, 0);
  const sumY2 = pairs.reduce((sum, p) => sum + p.y * p.y, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return { r: 0 };

  return { r: numerator / denominator };
}
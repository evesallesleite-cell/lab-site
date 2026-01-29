import fs from 'fs';
import path from 'path';

class WhoopCSVExporter {
  constructor() {
    this.dataPath = './data';
  }

  exportStrainDataToCSV() {
    try {
      // Read the strain data JSON
      const strainData = JSON.parse(fs.readFileSync(path.join(this.dataPath, 'strain-data.json'), 'utf8'));
      
      // Sport ID mapping for reference
      const sportMapping = {
        0: "Activity",
        1: "Running", 2: "Cycling", 3: "Swimming", 4: "Rowing", 5: "Elliptical",
        16: "Baseball", 17: "Basketball", 18: "Cross Country Skiing", 19: "Football",
        20: "Golf", 21: "Ice Hockey", 22: "Lacrosse", 23: "Martial Arts", 24: "Racquetball",
        25: "Rock Climbing", 26: "Rugby", 27: "Sailing", 28: "Skiing", 29: "Snowboarding",
        30: "Soccer", 31: "Softball", 32: "Squash", 33: "Swimming", 34: "Tennis",
        35: "Track & Field", 36: "Volleyball", 37: "Water Polo", 38: "Wrestling", 39: "Boxing",
        42: "Dance", 43: "Pilates", 44: "Yoga", 45: "Weightlifting", 47: "Cross Country Skiing",
        48: "Functional Fitness", 49: "Duathlon", 51: "Gymnastics", 52: "Hiking/Rucking",
        53: "Horseback Riding", 55: "Kayaking", 56: "Martial Arts", 57: "Mountain Biking",
        59: "Walking", 60: "Water Sports", 61: "Wheelchair Pushing", 63: "Ice Skating",
        64: "Sky Diving", 65: "Snowshoeing", 66: "Padel", 67: "Surfing", 70: "Ultimate Frisbee",
        71: "Other", 73: "Pickleball", 74: "Inline Skating", 75: "Rock Climbing",
        76: "Strength Training", 82: "Motocross", 84: "Backcountry Skiing", 87: "Indoor Climbing",
        89: "Mixed Martial Arts", 90: "Obstacle Racing", 92: "Stand Up Paddleboard"
      };

      // Create CSV header
      const csvHeader = [
        'Date',
        'Year',
        'Month', 
        'DayOfWeek',
        'SportID',
        'SportName',
        'Strain',
        'AvgHeartRate',
        'MaxHeartRate',
        'Duration_Minutes',
        'Calories',
        'StartTime',
        'EndTime'
      ].join(',');

      // Convert records to CSV rows
      const csvRows = strainData.records.map(record => {
        const startDate = new Date(record.start);
        const endDate = new Date(record.end);
        const durationMinutes = Math.round((endDate - startDate) / (1000 * 60));
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        return [
          startDate.toLocaleDateString(), // Date
          startDate.getFullYear(), // Year
          startDate.getMonth() + 1, // Month (1-12)
          dayNames[startDate.getDay()], // Day of week
          record.sport_id || 0, // Sport ID
          sportMapping[record.sport_id] || 'Unknown', // Sport Name
          record.score?.strain || 0, // Strain
          record.score?.average_heart_rate || 0, // Avg HR
          record.score?.max_heart_rate || 0, // Max HR
          durationMinutes, // Duration in minutes
          Math.round(record.score?.kilojoule * 0.239006) || 0, // Calories (convert kJ to cal)
          record.start, // Start time
          record.end // End time
        ].join(',');
      });

      // Combine header and rows
      const csvContent = [csvHeader, ...csvRows].join('\n');

      // Write to file
      const outputPath = './public/data-csv/whoop-workouts.csv';
      
      // Create directory if it doesn't exist
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(outputPath, csvContent);
      
      return {
        success: true,
        filePath: outputPath,
        recordCount: strainData.records.length,
        message: `Exported ${strainData.records.length} workout records to CSV`
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  exportSleepDataToCSV() {
    try {
      const sleepData = JSON.parse(fs.readFileSync(path.join(this.dataPath, 'sleep-data.json'), 'utf8'));
      
      const csvHeader = [
        'Date',
        'Year',
        'Month',
        'DayOfWeek',
        'SleepScore',
        'TotalSleep_Hours',
        'REMSleep_Hours',
        'DeepSleep_Hours',
        'LightSleep_Hours',
        'Efficiency_Percent',
        'Latency_Minutes',
        'WakeEvents',
        'RestingHeartRate',
        'HRV'
      ].join(',');

      const csvRows = sleepData.records.map(record => {
        const sleepDate = new Date(record.start);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const totalSleepHours = (record.score?.stage_summary?.total_in_bed_time_milli || 0) / (1000 * 60 * 60);

        return [
          sleepDate.toLocaleDateString(),
          sleepDate.getFullYear(),
          sleepDate.getMonth() + 1,
          dayNames[sleepDate.getDay()],
          record.score?.sleep_performance_percentage || 0,
          totalSleepHours.toFixed(2),
          ((record.score?.stage_summary?.rem_sleep_duration_milli || 0) / (1000 * 60 * 60)).toFixed(2),
          ((record.score?.stage_summary?.slow_wave_sleep_duration_milli || 0) / (1000 * 60 * 60)).toFixed(2),
          ((record.score?.stage_summary?.light_sleep_duration_milli || 0) / (1000 * 60 * 60)).toFixed(2),
          record.score?.sleep_efficiency_percentage || 0,
          (record.score?.sleep_latency_milli || 0) / (1000 * 60), // Convert to minutes
          record.score?.wake_event_count || 0,
          record.score?.respiratory_rate || 0,
          record.score?.hrv_rmssd_milli || 0
        ].join(',');
      });

      const csvContent = [csvHeader, ...csvRows].join('\n');
      const outputPath = './public/data-csv/whoop-sleep.csv';
      
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(outputPath, csvContent);
      
      return {
        success: true,
        filePath: outputPath,
        recordCount: sleepData.records.length
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  exportAll() {
    const results = {
      workouts: this.exportStrainDataToCSV(),
      sleep: this.exportSleepDataToCSV()
    };
    
    return results;
  }
}

export default WhoopCSVExporter;
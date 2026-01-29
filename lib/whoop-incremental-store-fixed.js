import fs from 'fs';
import path from 'path';

// Incremental Whoop data store that persists to files and only fetches new data
class WhoopIncrementalStore {
  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    this.ensureDataDirectory();
    
    this.files = {
      sleep: path.join(this.dataDir, 'sleep-data.json'),
      strain: path.join(this.dataDir, 'strain-data.json'),
      recovery: path.join(this.dataDir, 'recovery-data.json'),
      metadata: path.join(this.dataDir, 'metadata.json')
    };
  }

  ensureDataDirectory() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  // Read existing data from file
  readDataFile(type) {
    try {
      if (fs.existsSync(this.files[type])) {
        const data = fs.readFileSync(this.files[type], 'utf8');
        return JSON.parse(data);
      }
      return { records: [], lastUpdate: null, totalCount: 0 };
    } catch (error) {
      console.error(`Error reading ${type} data:`, error);
      return { records: [], lastUpdate: null, totalCount: 0 };
    }
  }

  // Write data to file
  writeDataFile(type, data) {
    try {
      fs.writeFileSync(this.files[type], JSON.stringify(data, null, 2));
      console.log(`✅ Saved ${data.records.length} ${type} records to file`);
    } catch (error) {
      console.error(`Error writing ${type} data:`, error);
    }
  }

  // Read metadata (last update times, etc.)
  readMetadata() {
    try {
      if (fs.existsSync(this.files.metadata)) {
        const data = fs.readFileSync(this.files.metadata, 'utf8');
        return JSON.parse(data);
      }
      return { lastFetch: {}, dateRanges: {} };
    } catch (error) {
      console.error('Error reading metadata:', error);
      return { lastFetch: {}, dateRanges: {} };
    }
  }

  // Write metadata
  writeMetadata(metadata) {
    try {
      fs.writeFileSync(this.files.metadata, JSON.stringify(metadata, null, 2));
    } catch (error) {
      console.error('Error writing metadata:', error);
    }
  }

  // Get the latest date from existing records
  getLatestRecordDate(type) {
    const data = this.readDataFile(type);
    if (!data || !data.records || data.records.length === 0) {
      console.log(`📅 No existing ${type} records found`);
      return null;
    }

    // Find the most recent record
    const dates = data.records.map(record => {
      if (type === 'sleep') return record.created_at || record.start;
      if (type === 'strain') return record.created_at || record.start;
      if (type === 'recovery') return record.created_at;
      return record.created_at;
    }).filter(Boolean);

    if (dates.length === 0) {
      console.log(`📅 No valid dates found in ${type} records`);
      return null;
    }
    
    dates.sort((a, b) => new Date(b) - new Date(a));
    const latestDate = dates[0];
    console.log(`📅 Latest ${type} record date: ${latestDate}`);
    return latestDate;
  }

  // Fetch only new data since last update
  async fetchIncrementalData(type, accessToken) {
    console.log(`🔄 Starting incremental fetch for ${type}...`);
    
    const existingData = this.readDataFile(type);
    const latestDate = this.getLatestRecordDate(type);
    const metadata = this.readMetadata();

    // Determine the endpoint and parameters
    const endpoints = {
      sleep: {
        url: 'https://api.prod.whoop.com/developer/v1/activity/sleep',
        limit: 25
      },
      strain: {
        url: 'https://api.prod.whoop.com/developer/v1/activity/workout',
        limit: 25
      },
      recovery: {
        url: 'https://api.prod.whoop.com/developer/v1/recovery',
        limit: 25
      }
    };

    let startDate = null;
    if (latestDate) {
      // Start from just after the latest record (add 1 second to avoid duplicates)
      const nextMoment = new Date(latestDate);
      nextMoment.setSeconds(nextMoment.getSeconds() + 1);
      startDate = nextMoment.toISOString();
      console.log(`📅 Existing data found. Fetching from: ${startDate}`);
    } else {
      console.log(`📅 No existing data. Fetching all historical data for ${type}`);
    }

    try {
      let allNewRecords = [];
      let nextToken = null;
      let pageCount = 0;
      const maxPages = 100;

      do {
        pageCount++;
        console.log(`📄 Fetching ${type} page ${pageCount}...`);

        // Build URL with incremental parameters
        let url = endpoints[type].url;
        let params = new URLSearchParams();
        
        // Add limit
        params.append('limit', endpoints[type].limit.toString());
        
        // Add start date if we have one (for incremental updates)
        if (startDate) {
          params.append('start', startDate);
        }
        
        // Add pagination token if we have one
        if (nextToken) {
          params.append('nextToken', nextToken);
        }
        
        // Build final URL
        url += '?' + params.toString();
        console.log(`🔗 URL: ${url}`);

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'User-Agent': 'MyWhoopApp/1.0'
          }
        });

        if (!response.ok) {
          console.error(`❌ ${type} API failed on page ${pageCount}:`, response.status, response.statusText);
          
          if (response.status === 429) {
            console.log('⏳ Rate limited, waiting 2 seconds...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          
          // Try to get error details
          let errorDetails = '';
          try {
            const errorData = await response.text();
            errorDetails = errorData;
            console.error(`📄 Error response body:`, errorDetails);
          } catch (e) {
            console.error('Could not read error response');
          }
          
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorDetails}`);
        }

        const result = await response.json();
        const records = result.records || [];
        
        console.log(`✅ Fetched ${records.length} new ${type} records`);
        allNewRecords = allNewRecords.concat(records);

        nextToken = result.next_token;

        // Add delay to prevent rate limiting
        if (nextToken && pageCount < maxPages) {
          await new Promise(resolve => setTimeout(resolve, 750));
        }

      } while (nextToken && pageCount < maxPages);

      // Merge new records with existing ones
      const mergedRecords = [...existingData.records, ...allNewRecords];
      
      // Remove duplicates based on ID
      const uniqueRecords = mergedRecords.filter((record, index, self) => {
        const idField = type === 'recovery' ? 'cycle_id' : 'id';
        return index === self.findIndex(r => r[idField] === record[idField]);
      });

      // Sort by date (newest first)
      uniqueRecords.sort((a, b) => {
        const dateA = new Date(a.created_at || a.start || a.cycle_id);
        const dateB = new Date(b.created_at || b.start || b.cycle_id);
        return dateB - dateA;
      });

      // Calculate date range
      const earliest = uniqueRecords[uniqueRecords.length - 1]?.created_at || uniqueRecords[uniqueRecords.length - 1]?.start;
      const latest = uniqueRecords[0]?.created_at || uniqueRecords[0]?.start;

      // Prepare final data structure
      const finalData = {
        records: uniqueRecords,
        lastUpdate: new Date().toISOString(),
        totalCount: uniqueRecords.length,
        date_range: {
          earliest,
          latest
        },
        newRecordsFetched: allNewRecords.length,
        incrementalUpdate: latestDate !== null
      };

      // Save to file
      this.writeDataFile(type, finalData);

      // Update metadata
      metadata.lastFetch[type] = new Date().toISOString();
      metadata.dateRanges[type] = finalData.date_range;
      this.writeMetadata(metadata);

      console.log(`🎉 ${type} incremental update complete:
        - Existing records: ${existingData.records.length}
        - New records fetched: ${allNewRecords.length}
        - Total records: ${uniqueRecords.length}
        - Date range: ${earliest} to ${latest}`);

      return finalData;

    } catch (error) {
      console.error(`❌ Error fetching incremental ${type} data:`, error);
      throw error;
    }
  }

  // Get all data for a type (from file)
  getAllData(type) {
    return this.readDataFile(type);
  }

  // Force full refresh (clear existing data and fetch all)
  async forceFullRefresh(type, accessToken) {
    console.log(`🔄 Force refresh: Clearing existing ${type} data...`);
    
    // Clear existing data
    const emptyData = { records: [], lastUpdate: null, totalCount: 0 };
    this.writeDataFile(type, emptyData);
    
    // Fetch all data
    return this.fetchIncrementalData(type, accessToken);
  }

  // Get summary of stored data
  getDataSummary() {
    const summary = {};
    const metadata = this.readMetadata();
    
    ['sleep', 'strain', 'recovery'].forEach(type => {
      const data = this.readDataFile(type);
      summary[type] = {
        recordCount: data.records.length,
        lastUpdate: data.lastUpdate,
        dateRange: data.date_range,
        hasData: data.records.length > 0
      };
    });

    return summary;
  }
}

export default WhoopIncrementalStore;

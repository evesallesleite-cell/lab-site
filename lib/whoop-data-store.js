// Centralized Whoop data store to avoid re-fetching data
class WhoopDataStore {
  constructor() {
    this.data = {
      sleep: null,
      strain: null,
      recovery: null,
      profile: null
    };
    this.loading = {
      sleep: false,
      strain: false,
      recovery: false
    };
    this.lastFetch = {
      sleep: null,
      strain: null,
      recovery: null
    };
    this.errors = {};
    this.subscribers = [];
    
    // Cache for 10 minutes to avoid rate limits
    this.CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
    
    // Load cached data from localStorage on initialization
    this.loadFromCache();
  }

  loadFromCache() {
    if (typeof window === 'undefined') return;
    
    try {
      const cachedData = localStorage.getItem('whoop-data-cache');
      const cachedTimestamps = localStorage.getItem('whoop-data-timestamps');
      
      if (cachedData && cachedTimestamps) {
        const parsedData = JSON.parse(cachedData);
        const parsedTimestamps = JSON.parse(cachedTimestamps);
        
        // Check if any cached data is still fresh
        const now = Date.now();
        
        ['sleep', 'strain', 'recovery'].forEach(type => {
          const timestamp = parsedTimestamps[type];
          if (timestamp && (now - timestamp < this.CACHE_DURATION)) {
            this.data[type] = parsedData[type];
            this.lastFetch[type] = timestamp;
            console.log(`✅ Loaded fresh ${type} data from cache`);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load cache:', error);
    }
  }

  saveToCache() {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('whoop-data-cache', JSON.stringify(this.data));
      localStorage.setItem('whoop-data-timestamps', JSON.stringify(this.lastFetch));
    } catch (error) {
      console.warn('Failed to save cache:', error);
    }
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  notify() {
    this.subscribers.forEach(callback => callback(this.data, this.loading, this.errors));
    // Save to cache whenever data changes
    this.saveToCache();
  }

  isDataFresh(type) {
    const lastFetch = this.lastFetch[type];
    if (!lastFetch) return false;
    return Date.now() - lastFetch < this.CACHE_DURATION;
  }

  // New method: Load stored data first, then optionally refresh
  async loadStoredDataFirst() {
    console.log('� Loading stored data from files...');
    
    try {
      const response = await fetch('/api/whoop-stored-data');
      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.data) {
          // Update our data store with file data
          ['sleep', 'strain', 'recovery'].forEach(type => {
            if (result.data[type] && result.data[type].records.length > 0) {
              this.data[type] = result.data[type];
              this.lastFetch[type] = Date.now();
              console.log(`✅ Loaded ${result.data[type].records.length} ${type} records from storage`);
            }
          });
          
          this.notify();
          return result.summary;
        }
      }
    } catch (error) {
      console.warn('Failed to load stored data:', error);
    }
    
    return null;
  }

  // New method: Trigger incremental update
  async fetchIncrementalUpdates(forceRefresh = false) {
    console.log(`🔄 ${forceRefresh ? 'Force refreshing' : 'Incrementally updating'} Whoop data...`);
    
    // Set loading states
    ['sleep', 'strain', 'recovery'].forEach(type => {
      this.loading[type] = true;
    });
    this.notify();

    try {
      const url = forceRefresh ? '/api/whoop-incremental?forceRefresh=true' : '/api/whoop-incremental';
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Update our data store
        ['sleep', 'strain', 'recovery'].forEach(type => {
          if (result.data[type]) {
            this.data[type] = result.data[type];
            this.lastFetch[type] = Date.now();
            this.loading[type] = false;
            
            const newRecords = result.data[type].newRecordsFetched || 0;
            console.log(`✅ ${type}: ${newRecords} new records added, ${result.data[type].totalCount} total`);
          }
        });
        
        this.notify();
        return result.summary;
      }
      
    } catch (error) {
      console.error('❌ Incremental update failed:', error);
      
      // Reset loading states
      ['sleep', 'strain', 'recovery'].forEach(type => {
        this.loading[type] = false;
        this.errors[type] = error.message;
      });
      this.notify();
      
      throw error;
    }
  }

  // Updated method: Smart data loading
  async fetchAllData() {
    console.log('🔄 Smart Whoop data loading...');
    
    // First, load any stored data immediately
    const summary = await this.loadStoredDataFirst();
    
    // Check if we have recent data for all types
    const hasRecentData = ['sleep', 'strain', 'recovery'].every(type => {
      return this.data[type] && this.data[type].records.length > 0;
    });
    
    if (hasRecentData) {
      console.log('✅ Using stored data, checking for updates in background...');
      
      // Trigger incremental update in background (don't wait)
      this.fetchIncrementalUpdates().catch(error => {
        console.warn('Background update failed:', error);
      });
      
      return;
    }
    
    // If no stored data, force a fresh fetch
    console.log('📥 No stored data found, fetching fresh data...');
    await this.fetchIncrementalUpdates(false);
  }
    
    if (sleepFresh && strainFresh && recoveryFresh) {
      console.log('✅ All data is fresh, skipping fetch');
      return;
    }

    // Set all as loading
    this.loading.sleep = true;
    this.loading.strain = true;
    this.loading.recovery = true;
    this.notify();

    try {
      console.log('📊 Fetching combined data from API...');
      const response = await fetch('/api/whoop-combined-data');
      
      if (!response.ok) {
        throw new Error(`Combined API failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update all data at once
      this.data.sleep = data.sleep;
      this.data.strain = data.strain;
      this.data.recovery = data.recovery;
      this.data.profile = data.profile;
      
      // Update timestamps
      const now = Date.now();
      this.lastFetch.sleep = now;
      this.lastFetch.strain = now;
      this.lastFetch.recovery = now;
      
      console.log('✅ All data loaded successfully:', data.summary);
      
    } catch (error) {
      console.error('❌ Combined data fetch failed:', error);
      this.errors.sleep = error.message;
      this.errors.strain = error.message;
      this.errors.recovery = error.message;
      throw error;
    } finally {
      this.loading.sleep = false;
      this.loading.strain = false;
      this.loading.recovery = false;
      this.notify();
    }
  }

  async fetchSleepData() {
    if (this.isDataFresh('sleep') || this.loading.sleep) {
      return this.data.sleep;
    }

    this.loading.sleep = true;
    this.errors.sleep = null;
    this.notify();

    try {
      console.log('📊 Fetching sleep data...');
      const response = await fetch('/api/whoop-all-data');
      
      if (!response.ok) {
        throw new Error(`Sleep API failed: ${response.status}`);
      }
      
      const data = await response.json();
      this.data.sleep = data.sleep;
      this.data.profile = data.profile;
      this.lastFetch.sleep = Date.now();
      console.log('✅ Sleep data loaded successfully');
      
    } catch (error) {
      console.error('❌ Sleep data fetch failed:', error);
      this.errors.sleep = error.message;
      throw error;
    } finally {
      this.loading.sleep = false;
      this.notify();
    }

    return this.data.sleep;
  }

  async fetchStrainData() {
    if (this.isDataFresh('strain') || this.loading.strain) {
      return this.data.strain;
    }

    this.loading.strain = true;
    this.errors.strain = null;
    this.notify();

    try {
      console.log('💪 Fetching strain data...');
      const response = await fetch('/api/strain-all-data');
      
      if (!response.ok) {
        throw new Error(`Strain API failed: ${response.status}`);
      }
      
      const data = await response.json();
      this.data.strain = data.strain;
      this.lastFetch.strain = Date.now();
      console.log('✅ Strain data loaded successfully');
      
    } catch (error) {
      console.error('❌ Strain data fetch failed:', error);
      this.errors.strain = error.message;
      throw error;
    } finally {
      this.loading.strain = false;
      this.notify();
    }

    return this.data.strain;
  }

  async fetchRecoveryData() {
    if (this.isDataFresh('recovery') || this.loading.recovery) {
      return this.data.recovery;
    }

    this.loading.recovery = true;
    this.errors.recovery = null;
    this.notify();

    try {
      console.log('🔋 Fetching recovery data...');
      const response = await fetch('/api/recovery-all-data');
      
      if (!response.ok) {
        throw new Error(`Recovery API failed: ${response.status}`);
      }
      
      const data = await response.json();
      this.data.recovery = data.recovery;
      this.lastFetch.recovery = Date.now();
      console.log('✅ Recovery data loaded successfully');
      
    } catch (error) {
      console.error('❌ Recovery data fetch failed:', error);
      this.errors.recovery = error.message;
      throw error;
    } finally {
      this.loading.recovery = false;
      this.notify();
    }

    return this.data.recovery;
  }

  getData(type) {
    return this.data[type];
  }

  isLoading(type) {
    return this.loading[type];
  }

  getError(type) {
    return this.errors[type];
  }

  clearCache() {
    this.data = {
      sleep: null,
      strain: null,
      recovery: null,
      profile: null
    };
    this.lastFetch = {
      sleep: null,
      strain: null,
      recovery: null
    };
    this.errors = {};
    this.notify();
  }
}

// Global singleton instance
let whoopDataStore = null;

export const getWhoopDataStore = () => {
  if (typeof window !== 'undefined' && !whoopDataStore) {
    whoopDataStore = new WhoopDataStore();
  }
  return whoopDataStore;
};

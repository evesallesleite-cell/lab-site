// Centralized Whoop data store with incremental updates and persistent storage
class WhoopDataStore {
  // Load stored data on initialization (no authentication required)
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
    
    // Load stored data immediately without authentication
    this.loadStoredDataFirst();
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

  // Load stored data first (no authentication required)
  async loadStoredDataFirst() {
    console.log('📁 Loading stored data from files...');
    
    try {
      // Add cache busting to ensure we get fresh data
      const timestamp = Date.now();
      const response = await fetch(`/api/whoop/whoop-stored-data?t=${timestamp}`);
      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.data) {
          // Update our data store with file data
          ['sleep', 'strain', 'recovery'].forEach(type => {
            if (result.data[type] && result.data[type].records && result.data[type].records.length > 0) {
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

  // Manual update method (requires authentication)
  async fetchIncrementalUpdates(forceRefresh = false) {
    console.log(`🔄 ${forceRefresh ? 'Force refreshing' : 'Incrementally updating'} Whoop data...`);
    
    // Check authentication first
    if (typeof window !== 'undefined') {
      const isLoggedIn = localStorage.getItem("loggedIn") === "true";
      if (!isLoggedIn) {
        console.log('❌ User not authenticated - saving return URL and redirecting to login');
        // Save current page for return after authentication
        localStorage.setItem('returnUrl', window.location.pathname);
        window.location.href = '/whoop/whoop-login';
        return;
      }
    }
    
    // Set loading states
    ['sleep', 'strain', 'recovery'].forEach(type => {
      this.loading[type] = true;
      this.errors[type] = '';
    });
    this.notify();

    try {
      const url = forceRefresh ? '/api/whoop/whoop-incremental?forceRefresh=true' : '/api/whoop/whoop-incremental';
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log('❌ Authentication failed - saving return URL and redirecting to login');
          if (typeof window !== 'undefined') {
            localStorage.setItem("loggedIn", "false");
            localStorage.setItem('returnUrl', window.location.pathname);
            window.location.href = '/whoop/whoop-login';
          }
          return;
        }
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
        
        // Reset loading states after successful update
        ['sleep', 'strain', 'recovery'].forEach(type => {
          this.loading[type] = false;
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

  // Load stored data only (no automatic API calls)
  async fetchAllData() {
    console.log('📁 Loading historical data from storage...');
    // Only reload if we don't have data or if it's been a while
    if (!this.data.sleep && !this.data.strain && !this.data.recovery) {
      return await this.loadStoredDataFirst();
    }
    return null;
  }

  // Add refresh method for manual updates
  async refreshData(forceRefresh = false) {
    return this.fetchIncrementalUpdates(forceRefresh);
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

  // Force refresh data from stored files (useful for debugging)
  async forceReloadFromFiles() {
    console.log('🔄 Force reloading all data from stored files...');
    this.clearCache();
    return await this.loadStoredDataFirst();
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

class BloodTestStore {
  constructor() {
    this.embedUrls = {};
    this.aiContent = {};
    this.progRef = null;
    this.lastUpdated = null;
    this.isLoading = false;
    
    // Load stored data immediately without authentication
    this.loadStoredDataFirst();
  }

  async loadStoredDataFirst() {
    try {
      // Load cached embed URLs and AI content from localStorage
      const storedEmbedUrls = localStorage.getItem('bloodTest_embedUrls');
      const storedProgRef = localStorage.getItem('bloodTest_progRef');
      const storedLastUpdated = localStorage.getItem('bloodTest_lastUpdated');
      
      if (storedEmbedUrls) {
        try {
          this.embedUrls = JSON.parse(storedEmbedUrls);
          console.log('Loaded cached embed URLs:', Object.keys(this.embedUrls));
        } catch (e) {
          console.warn('Failed to parse stored embed URLs:', e);
          this.embedUrls = {};
        }
      } else {
        console.log('No cached embed URLs found');
      }
      
      if (storedProgRef) {
        try {
          this.progRef = JSON.parse(storedProgRef);
        } catch (e) {
          console.warn('Failed to parse stored progRef:', e);
        }
      }
      
      if (storedLastUpdated) {
        this.lastUpdated = storedLastUpdated;
      }
    } catch (error) {
      console.error('Error loading stored blood test data:', error);
    }
  }

  async refreshData(dataType = 'both') {
    try {
      this.isLoading = true;
      
      if (dataType === 'both' || dataType === 'embeds') {
        await this.refreshEmbedUrls();
      }
      
      if (dataType === 'both' || dataType === 'ai') {
        await this.refreshAiContent();
      }
      
      // Update last updated timestamp
      this.lastUpdated = new Date().toISOString();
      localStorage.setItem('bloodTest_lastUpdated', this.lastUpdated);
      
    } catch (error) {
      console.error('Error refreshing blood test data:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async refreshEmbedUrls() {
    try {
      // Define cards for both lipids and hormones
      const LIPIDS_CARDS = {
        lipids: { id: 42, type: "question" },
        hdl: { id: 40, type: "question" },
        ldl: { id: 45, type: "question" },
        triglycerides: { id: 44, type: "question" },
        vldl: { id: 41, type: "question" }
      };

      const HORMONES_CARDS = {
        dhea: { id: 49, type: "question" },
        dhea_s: { id: 48, type: "question" },
        cortisol: { id: 46, type: "question" },
        progesterone: { id: 53, type: "question" },
        estradiol: { id: 55, type: "question" },
        lh: { id: 51, type: "question" },
        fsh: { id: 54, type: "question" }
      };

      const allCards = { ...LIPIDS_CARDS, ...HORMONES_CARDS };
      const newEmbedUrls = {};

      for (const [key, meta] of Object.entries(allCards)) {
        const r = await fetch(`/api/metabase-embed?id=${encodeURIComponent(meta.id)}&type=${encodeURIComponent(meta.type)}`);
        const text = await r.text().catch(() => "");
        if (!r.ok) throw new Error(`embed API ${meta.id} -> ${r.status} ${text}`);
        const j = text ? JSON.parse(text) : {};
        newEmbedUrls[key] = j.iframeUrl;
      }

      this.embedUrls = newEmbedUrls;
      localStorage.setItem('bloodTest_embedUrls', JSON.stringify(this.embedUrls));
      console.log('Saved embed URLs to cache:', Object.keys(this.embedUrls));

      // Also refresh progesterone reference range
      await this.refreshProgRef();

    } catch (error) {
      console.error('Error refreshing embed URLs:', error);
      throw error;
    }
  }

  async refreshProgRef() {
    try {
      const r = await fetch("/api/smart-blurb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: 53, analyte: "Progesterone", debug: true })
      });
      const j = await r.json();
      
      if (j.refRange) {
        this.progRef = j.refRange;
      } else if (j.docket && (j.docket.refLow || j.docket.refHigh)) {
        this.progRef = { low: j.docket.refLow || null, high: j.docket.refHigh || null };
      }
      
      if (this.progRef) {
        localStorage.setItem('bloodTest_progRef', JSON.stringify(this.progRef));
      }
    } catch (error) {
      console.error('Error refreshing progesterone reference:', error);
    }
  }

  async refreshAiContent() {
    try {
      // Clear existing AI content cache to force regeneration
      if (typeof window !== 'undefined') {
        // Clear all cached AI content for blood test cards
        const allCards = [42, 40, 45, 44, 41, 49, 48, 46, 53, 55, 51, 54]; // All lipids + hormones card IDs
        allCards.forEach(cardId => {
          localStorage.removeItem(`bloodTest_ai_${cardId}`);
        });
      }
      
      this.aiContent = {};
      localStorage.removeItem('bloodTest_aiContent');
      
      // The AI content will be generated fresh by the SmartBlurb components
      // when they detect no cached content exists
      
    } catch (error) {
      console.error('Error refreshing AI content:', error);
      throw error;
    }
  }

  getEmbedUrl(cardKey) {
    return this.embedUrls[cardKey] || null;
  }

  getAiContent(cardId) {
    return this.aiContent[cardId] || null;
  }

  setAiContent(cardId, content) {
    this.aiContent[cardId] = content;
    localStorage.setItem('bloodTest_aiContent', JSON.stringify(this.aiContent));
  }

  getProgRef() {
    return this.progRef;
  }

  getLastUpdated() {
    return this.lastUpdated;
  }

  isDataLoading() {
    return this.isLoading;
  }

  hasAnyData() {
    return Object.keys(this.embedUrls).length > 0;
  }

  async ensureDataLoaded() {
    if (!this.hasAnyData() && !this.isLoading) {
      console.log('No cached data found, performing initial load...');
      await this.refreshData('embeds'); // Only load embeds initially, AI will be cached separately
    }
  }
}

// Global instance
let bloodTestStore = null;

export function getBloodTestStore() {
  if (typeof window === 'undefined') return null;
  
  if (!bloodTestStore) {
    bloodTestStore = new BloodTestStore();
  }
  return bloodTestStore;
}

export default getBloodTestStore;

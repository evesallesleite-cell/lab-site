// Personal Health Data Aggregation System
// This module consolidates all your health data into a unified format for AI training

import fs from 'fs';
import path from 'path';
import { WHOOP_SPORTS, getSportName, getSportIcon, analyzeWhoopActivities } from './whoop-sport-mapping.js';

class PersonalHealthDataAggregator {
  constructor() {
    this.dataPath = path.join(process.cwd(), 'public', 'data-json');
    this.outputPath = path.join(process.cwd(), 'public', 'data-json', 'unified-health-data.json');
  }

  // Load WHOOP data (sleep, strain, recovery)
  loadWhoopData() {
    const whoopData = {
      metadata: {},
      sleep: [],
      strain: [],
      recovery: []
    };

    try {
      // Load metadata
      if (fs.existsSync(path.join(this.dataPath, 'metadata.json'))) {
        whoopData.metadata = JSON.parse(fs.readFileSync(path.join(this.dataPath, 'metadata.json'), 'utf8'));
      }

      // Load sleep data
      if (fs.existsSync(path.join(this.dataPath, 'sleep-data.json'))) {
        const sleepData = JSON.parse(fs.readFileSync(path.join(this.dataPath, 'sleep-data.json'), 'utf8'));
        whoopData.sleep = sleepData.records || [];
      }

      // Load strain data
      if (fs.existsSync(path.join(this.dataPath, 'strain-data.json'))) {
        const strainData = JSON.parse(fs.readFileSync(path.join(this.dataPath, 'strain-data.json'), 'utf8'));
        whoopData.strain = strainData.records || [];
      }

      // Load recovery data
      if (fs.existsSync(path.join(this.dataPath, 'recovery-data.json'))) {
        const recoveryData = JSON.parse(fs.readFileSync(path.join(this.dataPath, 'recovery-data.json'), 'utf8'));
        whoopData.recovery = recoveryData.records || [];
      }

      // Analyze activities from strain data
      if (whoopData.strain.length > 0) {
        const currentYear = new Date().getFullYear();
        
        // Get all available years in the dataset
        const availableYears = [...new Set(whoopData.strain.map(r => new Date(r.start).getFullYear()))].sort();
        
        // Analyze activities for all years
        const byYear = {};
        availableYears.forEach(year => {
          byYear[year] = analyzeWhoopActivities(whoopData.strain, year);
        });
        
        whoopData.activities = {
          allTime: analyzeWhoopActivities(whoopData.strain),
          currentYear: analyzeWhoopActivities(whoopData.strain, currentYear),
          byYear: byYear,
          availableYears: availableYears,
          year: currentYear
        };
      }
      
    } catch (error) {
      console.error('Error loading WHOOP data:', error);
    }

    return whoopData;
  }

  // Extract supplement data (from the supplement-stack.js file) - All 19 supplements
  getSupplementData() {
    return [
      {
        id: 1,
        name: "B6 + B9 + B12 Complex",
        category: "Vitamins",
        dosage: "1 pill (3mg B6 + 20mg B9 + 0.4mg + 1mg B12)",
        timing: "Pre-breakfast",
        frequency: "Daily",
        brand: "Control Vita",
        benefits: "Improved energy levels, better mood regulation, enhanced cognitive function, supports methylation processes",
        storage: "Pantry",
        quantity: "60 pills"
      },
      {
        id: 2,
        name: "Magnesium Dimalate",
        category: "Minerals",
        dosage: "1 pill (500mg)",
        timing: "Pre-breakfast",
        frequency: "Daily",
        brand: "Control Vita",
        benefits: "Muscle relaxation, improved sleep quality, reduced fatigue, supports ATP production, heart health",
        storage: "Pantry",
        quantity: "60 pills"
      },
      {
        id: 3,
        name: "Taurine",
        category: "Amino Acids",
        dosage: "2 pills (1000mg)",
        timing: "Pre-breakfast",
        frequency: "Daily",
        brand: "Control Vita",
        benefits: "Cardiovascular support, improved exercise performance, neuroprotection, antioxidant effects",
        storage: "Pantry",
        quantity: "120 pills"
      },
      {
        id: 4,
        name: "NAC (N-Acetyl Cysteine)",
        category: "Antioxidants",
        dosage: "2 pills (800mg)",
        timing: "Pre-breakfast",
        frequency: "Daily",
        brand: "Control Vita",
        benefits: "Liver detox support, respiratory health, glutathione production, mental health support",
        storage: "Pantry",
        quantity: "120 pills"
      },
      {
        id: 5,
        name: "NMN (Nicotinamide Mononucleotide)",
        category: "Longevity",
        dosage: "2 pills (350mg)",
        timing: "Pre-breakfast",
        frequency: "Daily",
        brand: "iHerb",
        benefits: "Enhanced cellular energy, potential longevity benefits, improved metabolism, DNA repair support",
        storage: "Fridge",
        quantity: "60 pills"
      },
      {
        id: 6,
        name: "Testofen (Fenugreek Extract)",
        category: "Hormonal Support",
        dosage: "1 pill (300mg)",
        timing: "Breakfast",
        frequency: "Daily",
        brand: "Control Vita",
        benefits: "Testosterone support, improved libido, enhanced muscle strength, better body composition",
        storage: "Pantry",
        quantity: "60 pills"
      },
      {
        id: 7,
        name: "CDP-Choline (Citicoline)",
        category: "Nootropics",
        dosage: "1 pill (300mg)",
        timing: "Breakfast",
        frequency: "Daily",
        brand: "Control Vita",
        benefits: "Enhanced focus and memory, neuroprotection, improved attention span, brain health support",
        storage: "Pantry",
        quantity: "60 pills"
      },
      {
        id: 8,
        name: "Lion's Mane Mushroom",
        category: "Nootropics",
        dosage: "2 pills (1000mg)",
        timing: "Breakfast",
        frequency: "Daily",
        brand: "Control Vita",
        benefits: "Cognitive enhancement, nerve regeneration, neuroprotection, improved memory and focus",
        storage: "Pantry",
        quantity: "120 pills"
      },
      {
        id: 9,
        name: "Omega-3 EPA + DHA",
        category: "Essential Fatty Acids",
        dosage: "3 pills (1620mg EPA + 1080mg DHA)",
        timing: "Breakfast",
        frequency: "Daily",
        brand: "Control Vita",
        benefits: "Heart health, brain function, anti-inflammatory effects, joint health, mood support",
        storage: "Fridge",
        quantity: "60 pills"
      },
      {
        id: 10,
        name: "Collagen + Pepti Strong + Orange Extract",
        category: "Protein & Recovery",
        dosage: "1 scoop (7g collagen + peptides)",
        timing: "Pre-Workout",
        frequency: "Daily",
        brand: "Control Vita",
        benefits: "Joint health, skin elasticity, muscle recovery, connective tissue support, antioxidant effects",
        storage: "Pantry",
        quantity: "300g powder"
      },
      {
        id: 11,
        name: "Tart Cherry Extract",
        category: "Recovery & Sleep",
        dosage: "2 pills (500mg)",
        timing: "Post-Workout",
        frequency: "Daily",
        brand: "Control Vita",
        benefits: "Natural melatonin, improved sleep quality, reduced inflammation, exercise recovery, antioxidant support",
        storage: "Pantry",
        quantity: "120 pills"
      },
      {
        id: 12,
        name: "Beta-Alanine",
        category: "Performance",
        dosage: "1 scoop (3g)",
        timing: "Pre-Workout",
        frequency: "Daily",
        brand: "Amazon",
        benefits: "Improved muscular endurance, reduced fatigue, enhanced high-intensity performance, increased training capacity",
        storage: "Pantry",
        quantity: "500g powder"
      },
      {
        id: 13,
        name: "Creatine Monohydrate",
        category: "Performance",
        dosage: "1 scoop (5g)",
        timing: "Pre-Workout",
        frequency: "Daily",
        brand: "Amazon",
        benefits: "Increased strength and power, improved muscle volume, enhanced recovery, cognitive benefits",
        storage: "Pantry",
        quantity: "2kg"
      },
      {
        id: 14,
        name: "Pre-Workout Complex",
        category: "Performance",
        dosage: "1 scoop (mixed stimulants + nootropics)",
        timing: "Pre-Workout",
        frequency: "Training days",
        brand: "Amazon",
        benefits: "Enhanced focus and energy, improved workout performance, increased motivation, better mind-muscle connection",
        storage: "Pantry",
        quantity: "500g powder"
      },
      {
        id: 15,
        name: "L-Citrulline Malate",
        category: "Performance",
        dosage: "1 scoop (6g)",
        timing: "Pre-Workout",
        frequency: "Daily",
        brand: "Amazon",
        benefits: "Enhanced blood flow, improved muscle pumps, reduced fatigue, better exercise performance, faster recovery",
        storage: "Pantry",
        quantity: "500g powder"
      },
      {
        id: 16,
        name: "Whey Protein (ISO100)",
        category: "Protein",
        dosage: "2 scoops (25g protein)",
        timing: "Post-Workout",
        frequency: "Daily",
        brand: "Amazon",
        benefits: "Muscle growth and recovery, high biological value protein, fast absorption, leucine rich",
        storage: "Pantry",
        quantity: "4kg"
      },
      {
        id: 17,
        name: "Vinitrox",
        category: "Performance & Recovery",
        dosage: "1 pill (500mg grape + apple extract)",
        timing: "Post-Workout",
        frequency: "Daily",
        brand: "Control Vita",
        benefits: "Enhanced nitric oxide production, improved endurance, better recovery, antioxidant support, cardiovascular health",
        storage: "Pantry",
        quantity: "60 pills"
      },
      {
        id: 18,
        name: "Glycine",
        category: "Sleep & Recovery",
        dosage: "1 scoop (3g)",
        timing: "Before bed",
        frequency: "Daily",
        brand: "Amazon",
        benefits: "Improved sleep quality, better sleep onset, enhanced recovery, collagen synthesis, nervous system calming",
        storage: "Pantry",
        quantity: "500g powder"
      },
      {
        id: 19,
        name: "PQQ CoQ10",
        category: "Longevity & Energy",
        dosage: "1 pill (10mg PQQ + 100mg CoQ10)",
        timing: "Breakfast",
        frequency: "Daily",
        brand: "Control Vita",
        benefits: "Mitochondrial support, enhanced cellular energy, neuroprotection, cardiovascular health, anti-aging effects",
        storage: "Fridge",
        quantity: "60 pills"
      }
    ];
  }

  // Load blood test data from Supabase via API
  async getBloodTestData() {
    try {
      // Use relative path for server-side, absolute for client-side
      const baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/personal/blood-data`);
      const result = await response.json();
      
      if (result.success) {
        return {
          totalAnalytes: result.data.totalAnalytes,
          totalResults: result.data.totalResults,
          lastCollectedDate: result.data.lastCollectedDate,
          recentResults: result.data.recentResults,
          summary: `${result.data.totalAnalytes} different blood markers analyzed across ${result.data.totalResults} test results`
        };
      }
    } catch (error) {
      console.error('Error fetching blood test data:', error);
    }

    return {
      totalAnalytes: 0,
      totalResults: 0,
      lastCollectedDate: null,
      recentResults: [],
      summary: "Blood test data not available"
    };
  }

  // Load LifeCode/genetic data from Supabase via API
  async getLifeCodeData() {
    try {
      // Use relative path for server-side, absolute for client-side
      const baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/personal/lifecode-data`);
      const result = await response.json();
      
      if (result.success) {
        return {
          totalCategories: result.data.totalCategories,
          totalGenes: result.data.totalGenes,
          totalResults: result.data.totalResults,
          lastCollectedDate: result.data.lastCollectedDate,
          categoryResults: result.data.categoryResults,
          summary: `${result.data.totalGenes} genetic markers analyzed across ${result.data.totalCategories} health categories`
        };
      }
    } catch (error) {
      console.error('Error fetching LifeCode data:', error);
    }

    return {
      totalCategories: 0,
      totalGenes: 0,
      totalResults: 0,
      lastCollectedDate: null,
      categoryResults: [],
      summary: "Genetic test data not available"
    };
  }

  // Aggregate all data into unified structure
  async aggregateAllData() {
    const supplements = this.getSupplementData();
    const bloodTests = await this.getBloodTestData();
    const genetics = await this.getLifeCodeData();
    
    const unifiedData = {
      profile: {
        name: "Your Personal Health Profile",
        lastUpdated: new Date().toISOString(),
        dataVersion: "1.0"
      },
      whoop: this.loadWhoopData(),
      supplements: {
        stack: supplements,
        totalSupplements: supplements.length,
        dailySupplements: supplements.filter(s => s.frequency === "Daily").length,
        categories: [...new Set(supplements.map(s => s.category))],
        timingBreakdown: this.getSupplementTimingBreakdown()
      },
      bloodTests,
      genetics,
      insights: this.generateInsights()
    };

    return unifiedData;
  }

  // Generate supplement timing breakdown
  getSupplementTimingBreakdown() {
    const supplements = this.getSupplementData();
    const breakdown = {
      "Pre-breakfast": supplements.filter(s => s.timing === "Pre-breakfast").length,
      "Breakfast": supplements.filter(s => s.timing === "Breakfast").length,
      "Pre-Workout": supplements.filter(s => s.timing?.includes("Workout")).length,
      "Before Bed": supplements.filter(s => s.timing === "Before Bed").length
    };
    return breakdown;
  }

  // Generate basic insights for AI context
  generateInsights() {
    const whoopData = this.loadWhoopData();
    const supplements = this.getSupplementData();
    
    return {
      healthFocus: [
        "Longevity and anti-aging (NMN, antioxidants)",
        "Cognitive enhancement (Lion's Mane, CDP-Choline)",
        "Athletic performance (Creatine, Protein, Pre-workout supplements)",
        "Sleep optimization (Magnesium, Tart Cherry)",
        "Cardiovascular health (Omega-3, Taurine)"
      ],
      supplementStrategy: {
        morningStack: supplements.filter(s => s.timing === "Pre-breakfast" || s.timing === "Breakfast").map(s => s.name),
        workoutSupports: supplements.filter(s => s.timing?.includes("Workout")).map(s => s.name),
        sleepSupports: supplements.filter(s => s.timing === "Before Bed").map(s => s.name)
      },
      whoopPatterns: {
        totalSleepRecords: whoopData.sleep.length,
        totalStrainRecords: whoopData.strain.length,
        totalRecoveryRecords: whoopData.recovery.length,
        dataRange: whoopData.metadata?.dateRanges || {}
      }
    };
  }

  // Save unified data to JSON file
  async saveUnifiedData() {
    try {
      const unifiedData = await this.aggregateAllData();
      fs.writeFileSync(this.outputPath, JSON.stringify(unifiedData, null, 2));
      console.log(`Unified health data saved to: ${this.outputPath}`);
      return unifiedData;
    } catch (error) {
      console.error('Error saving unified data:', error);
      throw error;
    }
  }

  // Load existing unified data
  loadUnifiedData() {
    try {
      if (fs.existsSync(this.outputPath)) {
        return JSON.parse(fs.readFileSync(this.outputPath, 'utf8'));
      }
      return null;
    } catch (error) {
      console.error('Error loading unified data:', error);
      return null;
    }
  }
}

export default PersonalHealthDataAggregator;
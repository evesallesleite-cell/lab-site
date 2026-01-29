import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const Header = dynamic(() => import("../components/header"), { ssr: false });

export default function SupplementStack() {
  const [supplements, setSupplements] = useState([]);
  const [filteredSupplements, setFilteredSupplements] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [timingFilter, setTimingFilter] = useState("all");

  // Supplement data from Ultimate Master Stack CSV
  const supplementData = [
    {
      id: 1,
      name: "B6 + B9 + B12 Complex",
      category: "Vitamins",
      dosage: "1 pill (3mg B6 + 20mg B9 + 0.4mg + 1mg B12)",
      timing: "Pre-breakfast",
      frequency: "Daily",
      description: "Essential B-vitamin complex supporting energy metabolism, nervous system function, and red blood cell formation.",
      benefits: "Improved energy levels, better mood regulation, enhanced cognitive function, supports methylation processes",
      brand: "Control Vita",
      notes: "60 pills total, store in pantry",
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
      description: "Highly bioavailable form of magnesium combined with malic acid for enhanced absorption and energy production.",
      benefits: "Muscle relaxation, improved sleep quality, reduced fatigue, supports ATP production, heart health",
      brand: "Control Vita",
      notes: "60 pills total, store in pantry",
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
      description: "Conditionally essential amino acid with antioxidant properties, crucial for cardiovascular and neurological function.",
      benefits: "Cardiovascular support, improved exercise performance, neuroprotection, antioxidant effects, bile salt formation",
      brand: "Control Vita",
      notes: "120 pills total, store in pantry",
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
      description: "Precursor to glutathione, the body's master antioxidant. Supports liver detoxification and respiratory health.",
      benefits: "Liver detox support, respiratory health, glutathione production, mental health support, addiction recovery aid",
      brand: "Control Vita",
      notes: "120 pills total, store in pantry",
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
      description: "NAD+ precursor that supports cellular energy production and may have anti-aging properties.",
      benefits: "Enhanced cellular energy, potential longevity benefits, improved metabolism, DNA repair support",
      brand: "iHerb",
      notes: "60 pills total, store in fridge for stability",
      storage: "Fridge",
      quantity: "60 pills"
    },
    {
      id: 6,
      name: "PQQ CoQ10",
      category: "Mitochondrial Support",
      dosage: "20mg",
      timing: "Morning",
      frequency: "Daily",
      description: "Powerful combination supporting mitochondrial biogenesis and cellular energy production.",
      benefits: "Mitochondrial health, enhanced energy production, neuroprotection, cardiovascular support",
      brand: "Various",
      notes: "Dosage information incomplete in original data",
      storage: "Unknown",
      quantity: "Unknown"
    },
    {
      id: 7,
      name: "Testofen (Fenugreek Extract)",
      category: "Hormonal Support",
      dosage: "1 pill (300mg)",
      timing: "Breakfast",
      frequency: "Daily",
      description: "Standardized fenugreek extract that may support healthy testosterone levels and libido.",
      benefits: "Testosterone support, improved libido, enhanced muscle strength, better body composition",
      brand: "Control Vita",
      notes: "60 pills total, store in pantry",
      storage: "Pantry",
      quantity: "60 pills"
    },
    {
      id: 8,
      name: "CDP-Choline (Citicoline)",
      category: "Nootropics",
      dosage: "1 pill (300mg)",
      timing: "Breakfast",
      frequency: "Daily",
      description: "Advanced choline compound that crosses the blood-brain barrier to support cognitive function.",
      benefits: "Enhanced focus and memory, neuroprotection, improved attention span, brain health support",
      brand: "Control Vita",
      notes: "60 pills total, store in pantry",
      storage: "Pantry",
      quantity: "60 pills"
    },
    {
      id: 9,
      name: "Lion's Mane Mushroom",
      category: "Nootropics",
      dosage: "2 pills (1000mg)",
      timing: "Breakfast",
      frequency: "Daily",
      description: "Medicinal mushroom known for supporting nerve growth factor and cognitive enhancement.",
      benefits: "Cognitive enhancement, nerve regeneration, neuroprotection, improved memory and focus",
      brand: "Control Vita",
      notes: "120 pills total, store in pantry",
      storage: "Pantry",
      quantity: "120 pills"
    },
    {
      id: 10,
      name: "Omega-3 EPA + DHA",
      category: "Essential Fatty Acids",
      dosage: "3 pills (1620mg EPA + 1080mg DHA)",
      timing: "Breakfast",
      frequency: "Daily",
      description: "High-potency fish oil providing essential omega-3 fatty acids for comprehensive health support.",
      benefits: "Heart health, brain function, anti-inflammatory effects, joint health, mood support",
      brand: "Control Vita",
      notes: "60 pills total, store in fridge to prevent oxidation",
      storage: "Fridge",
      quantity: "60 pills"
    },
    {
      id: 11,
      name: "Collagen + Pepti Strong + Orange Extract",
      category: "Structural Support",
      dosage: "1 pack (10g Collagen + 2.4g Pepti Strong + 1g Orange Extract)",
      timing: "Breakfast",
      frequency: "Daily",
      description: "Comprehensive collagen formula with peptides and citrus bioflavonoids for enhanced absorption.",
      benefits: "Skin health, joint support, muscle recovery, improved skin elasticity, connective tissue support",
      brand: "Control Vita",
      notes: "60 packs total, store in pantry",
      storage: "Pantry",
      quantity: "60 packs"
    },
    {
      id: 12,
      name: "Tart Cherry Extract",
      category: "Recovery",
      dosage: "2 pills (1000mg)",
      timing: "Before Bed",
      frequency: "Daily",
      description: "Natural source of melatonin and anthocyanins that supports sleep quality and muscle recovery.",
      benefits: "Improved sleep quality, reduced inflammation, muscle recovery, natural melatonin source",
      brand: "Control Vita",
      notes: "120 pills total, store in pantry",
      storage: "Pantry",
      quantity: "120 pills"
    },
    {
      id: 13,
      name: "Beta-Alanine",
      category: "Pre-Workout",
      dosage: "1 scoop (3g)",
      timing: "Pre-Workout",
      frequency: "Daily",
      description: "Non-essential amino acid that buffers lactic acid in muscles during high-intensity exercise.",
      benefits: "Increased muscular endurance, reduced fatigue, improved high-intensity performance",
      brand: "Control Vita",
      notes: "300g powder, store in pantry",
      storage: "Pantry",
      quantity: "300g"
    },
    {
      id: 14,
      name: "Creatine Monohydrate",
      category: "Performance",
      dosage: "1 scoop (5g)",
      timing: "Pre-Workout",
      frequency: "Daily",
      description: "Gold standard for strength and power enhancement, supports ATP regeneration in muscles.",
      benefits: "Increased strength and power, improved muscle volume, enhanced recovery, cognitive benefits",
      brand: "Amazon",
      notes: "2kg powder, store in pantry",
      storage: "Pantry",
      quantity: "2kg"
    },
    {
      id: 15,
      name: "Pre-Workout Complex",
      category: "Pre-Workout",
      dosage: "1 scoop (10g)",
      timing: "Pre-Workout",
      frequency: "Training Days",
      description: "Comprehensive pre-workout formula with stimulants, pump enhancers, and focus ingredients.",
      benefits: "Enhanced energy and focus, improved pumps, increased workout intensity, better performance",
      brand: "Amazon",
      notes: "600g powder, store in pantry, only on training days",
      storage: "Pantry",
      quantity: "600g"
    },
    {
      id: 16,
      name: "L-Citrulline Malate",
      category: "Pre-Workout",
      dosage: "2 scoops (10g)",
      timing: "Pre-Workout",
      frequency: "Training Days",
      description: "Amino acid that enhances nitric oxide production for improved blood flow and muscle pumps.",
      benefits: "Enhanced muscle pumps, improved blood flow, reduced fatigue, better endurance",
      brand: "Control Vita",
      notes: "300g powder, store in pantry, only on training days",
      storage: "Pantry",
      quantity: "300g"
    },
    {
      id: 17,
      name: "Whey Protein (ISO100)",
      category: "Protein",
      dosage: "2 scoops (25g protein)",
      timing: "Post-Workout",
      frequency: "Daily",
      description: "Hydrolyzed whey protein isolate for rapid absorption and muscle protein synthesis.",
      benefits: "Muscle growth and recovery, high biological value protein, fast absorption, leucine rich",
      brand: "Amazon",
      notes: "4kg powder, store in pantry",
      storage: "Pantry",
      quantity: "4kg"
    },
    {
      id: 18,
      name: "Vinitrox",
      category: "Performance",
      dosage: "1 pill (100mg)",
      timing: "Pre-Workout",
      frequency: "Daily",
      description: "Patented blend of grape and apple polyphenols that supports nitric oxide production and endurance.",
      benefits: "Enhanced endurance, improved VO2 max, better blood flow, antioxidant protection during exercise",
      brand: "Control Vita",
      notes: "60 pills total, store in pantry",
      storage: "Pantry",
      quantity: "60 pills"
    },
    {
      id: 19,
      name: "Glycine",
      category: "Sleep Support",
      dosage: "1 scoop (5g)",
      timing: "Before Bed",
      frequency: "Daily",
      description: "Simple amino acid that promotes relaxation and improves sleep quality by lowering core body temperature.",
      benefits: "Improved sleep quality, faster sleep onset, better sleep efficiency, relaxation support",
      brand: "Control Vita",
      notes: "300g powder, store in pantry",
      storage: "Pantry",
      quantity: "300g"
    }
  ];

  useEffect(() => {
    setSupplements(supplementData);
    setFilteredSupplements(supplementData);
  }, []);

  useEffect(() => {
    let filtered = supplements;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(supplement =>
        supplement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplement.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplement.benefits.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter(supplement => supplement.category === categoryFilter);
    }

    // Filter by timing
    if (timingFilter !== "all") {
      filtered = filtered.filter(supplement => supplement.timing === timingFilter);
    }

    setFilteredSupplements(filtered);
  }, [searchTerm, categoryFilter, timingFilter, supplements]);

  // Get unique categories and timings for filters
  const categories = [...new Set(supplements.map(s => s.category))].sort();
  const timings = [...new Set(supplements.map(s => s.timing))].sort();

  // Get statistics
  const stats = {
    totalSupplements: supplements.length,
    dailySupplements: supplements.filter(s => s.frequency === "Daily").length,
    categories: categories.length,
    preBreakfast: supplements.filter(s => s.timing === "Pre-breakfast").length,
    breakfast: supplements.filter(s => s.timing === "Breakfast").length,
    workout: supplements.filter(s => s.timing && s.timing.includes("Workout")).length,
    beforeBed: supplements.filter(s => s.timing === "Before Bed").length,
    trainingDaysOnly: supplements.filter(s => s.frequency === "Training Days").length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">💊 My Supplement Stack</h1>
          <p className="text-lg text-gray-600 mb-6">
            Daily supplement regimen overview
          </p>
          
          {/* Statistics Cards */}
          <div className="flex flex-wrap gap-3 mb-6 justify-center">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-xl text-center min-w-24">
              <div className="text-2xl font-bold">{stats.totalSupplements}</div>
              <div className="text-xs opacity-90">Total</div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-xl text-center min-w-24">
              <div className="text-2xl font-bold">{stats.dailySupplements}</div>
              <div className="text-xs opacity-90">Daily</div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3 rounded-xl text-center min-w-24">
              <div className="text-2xl font-bold">{stats.categories}</div>
              <div className="text-xs opacity-90">Categories</div>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3 rounded-xl text-center min-w-24">
              <div className="text-2xl font-bold">{stats.preBreakfast + stats.breakfast}</div>
              <div className="text-xs opacity-90">Morning</div>
            </div>
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-xl text-center min-w-24">
              <div className="text-2xl font-bold">{stats.workout}</div>
              <div className="text-xs opacity-90">Workout</div>
            </div>
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 py-3 rounded-xl text-center min-w-24">
              <div className="text-2xl font-bold">{stats.beforeBed}</div>
              <div className="text-xs opacity-90">Before Bed</div>
            </div>
          </div>

          {/* Daily Schedule Overview */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📅 Daily Timeline</h2>
            <div className="flex flex-wrap gap-3">
              <div className="bg-gradient-to-r from-orange-400 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                🌅 Pre-Breakfast ({stats.preBreakfast})
              </div>
              <div className="bg-gradient-to-r from-green-400 to-green-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                🍳 Breakfast ({stats.breakfast})
              </div>
              <div className="bg-gradient-to-r from-red-400 to-red-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                🏋️ Workout ({stats.workout})
              </div>
              <div className="bg-gradient-to-r from-indigo-400 to-indigo-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                🌙 Before Bed ({stats.beforeBed})
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <input
                  type="text"
                  placeholder="🔍 Search supplements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              
              <select
                value={timingFilter}
                onChange={(e) => setTimingFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Timings</option>
                {timings.map(timing => (
                  <option key={timing} value={timing}>{timing}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Supplements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSupplements.map((supplement) => {
            // Get timing color scheme
            const getTimingColor = (timing) => {
              if (timing === "Pre-breakfast") return "from-orange-400 to-orange-500";
              if (timing === "Breakfast") return "from-green-400 to-green-500";
              if (timing?.includes("Workout")) return "from-red-400 to-red-500";
              if (timing === "Before Bed") return "from-indigo-400 to-indigo-500";
              return "from-gray-400 to-gray-500";
            };

            const getCategoryEmoji = (category) => {
              if (category === "Vitamins") return "🟡";
              if (category === "Minerals") return "🔵";
              if (category === "Amino Acids") return "🟣";
              if (category === "Nootropics") return "🧠";
              if (category === "Performance") return "💪";
              if (category === "Antioxidants") return "🛡️";
              if (category === "Longevity") return "⭐";
              if (category === "Pre-Workout") return "🔥";
              if (category === "Protein") return "🥤";
              if (category === "Recovery") return "💤";
              if (category === "Sleep Support") return "🌙";
              return "💊";
            };

            return (
              <div key={supplement.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md hover:scale-105 transition-all duration-200">
                {/* Header with gradient timing indicator */}
                <div className={`bg-gradient-to-r ${getTimingColor(supplement.timing)} text-white p-3 rounded-lg mb-3 text-center`}>
                  <div className="text-lg font-bold">{getCategoryEmoji(supplement.category)}</div>
                  <div className="text-sm font-medium truncate">{supplement.name}</div>
                  <div className="text-xs opacity-90">{supplement.timing}</div>
                </div>

                {/* Dosage - Prominent Display */}
                <div className="bg-gray-50 rounded-lg p-3 mb-3 text-center">
                  <div className="text-xs text-gray-600 mb-1">Dosage</div>
                  <div className="font-bold text-gray-900 text-sm leading-tight">{supplement.dosage}</div>
                </div>

                {/* Key Info Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    supplement.frequency === "Daily" ? "bg-green-100 text-green-800" :
                    supplement.frequency === "Training Days" ? "bg-yellow-100 text-yellow-800" :
                    "bg-purple-100 text-purple-800"
                  }`}>
                    {supplement.frequency}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {supplement.category}
                  </span>
                </div>

                {/* Brand & Storage */}
                <div className="text-xs text-gray-500 space-y-1">
                  {supplement.brand && (
                    <div>📦 {supplement.brand}</div>
                  )}
                  {supplement.storage && (
                    <div>{supplement.storage === "Fridge" ? "❄️" : "🏠"} {supplement.storage}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* No results message */}
        {filteredSupplements.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No supplements found matching your filters.</p>
            <button
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter("all");
                setTimingFilter("all");
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
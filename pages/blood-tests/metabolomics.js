import React from "react";

export default function MetabolomicsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Metabolomics Analysis</h1>
            <p className="text-gray-600 mt-2">Comprehensive metabolite analysis and biochemical pathways</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
              🧬 Specialized Report
            </span>
          </div>
        </div>

        {/* Overview Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Metabolic Profile Overview</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Your metabolomics analysis provides a comprehensive view of small molecules in your biological system. 
                This advanced testing reveals insights into your metabolic pathways, energy production, 
                neurotransmitter balance, and overall biochemical health.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                  <h3 className="font-semibold mb-2">Metabolites Analyzed</h3>
                  <p className="text-2xl font-bold">847</p>
                  <p className="text-sm opacity-90">Unique compounds</p>
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                  <h3 className="font-semibold mb-2">Pathways Mapped</h3>
                  <p className="text-2xl font-bold">156</p>
                  <p className="text-sm opacity-90">Biochemical routes</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Findings</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Energy metabolism: Optimal</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Amino acid balance: Moderate</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Antioxidant status: Strong</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Neurotransmitters: Balanced</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Energy Metabolism */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">⚡</span>
              Energy Metabolism
            </h3>
            <div className="space-y-4">
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-gray-900">Glucose Metabolism</h4>
                <p className="text-sm text-gray-600">Efficient glucose utilization with stable insulin response</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-gray-900">Fatty Acid Oxidation</h4>
                <p className="text-sm text-gray-600">Optimal fat burning capacity and ketone production</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-semibold text-gray-900">Mitochondrial Function</h4>
                <p className="text-sm text-gray-600">Strong cellular energy production and ATP synthesis</p>
              </div>
            </div>
          </div>

          {/* Amino Acids & Proteins */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">🧱</span>
              Amino Acids & Proteins
            </h3>
            <div className="space-y-4">
              <div className="border-l-4 border-orange-500 pl-4">
                <h4 className="font-semibold text-gray-900">Essential Amino Acids</h4>
                <p className="text-sm text-gray-600">Adequate levels of all 9 essential amino acids</p>
              </div>
              <div className="border-l-4 border-red-500 pl-4">
                <h4 className="font-semibold text-gray-900">Protein Synthesis</h4>
                <p className="text-sm text-gray-600">Active muscle protein synthesis markers</p>
              </div>
              <div className="border-l-4 border-indigo-500 pl-4">
                <h4 className="font-semibold text-gray-900">Nitrogen Balance</h4>
                <p className="text-sm text-gray-600">Positive nitrogen retention for tissue repair</p>
              </div>
            </div>
          </div>

          {/* Neurotransmitters */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">🧠</span>
              Neurotransmitter Balance
            </h3>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-gray-900">Serotonin Pathway</h4>
                <p className="text-sm text-gray-600">Balanced mood and sleep regulation markers</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-gray-900">Dopamine System</h4>
                <p className="text-sm text-gray-600">Healthy motivation and reward pathway function</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-semibold text-gray-900">GABA Activity</h4>
                <p className="text-sm text-gray-600">Optimal relaxation and stress response</p>
              </div>
            </div>
          </div>

          {/* Antioxidants & Inflammation */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">🛡️</span>
              Antioxidants & Inflammation
            </h3>
            <div className="space-y-4">
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-gray-900">Antioxidant Capacity</h4>
                <p className="text-sm text-gray-600">Strong glutathione and vitamin E levels</p>
              </div>
              <div className="border-l-4 border-yellow-500 pl-4">
                <h4 className="font-semibold text-gray-900">Inflammatory Markers</h4>
                <p className="text-sm text-gray-600">Low systemic inflammation indicators</p>
              </div>
              <div className="border-l-4 border-teal-500 pl-4">
                <h4 className="font-semibold text-gray-900">Oxidative Stress</h4>
                <p className="text-sm text-gray-600">Minimal cellular damage from free radicals</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-8 bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl shadow-lg p-8 text-white">
          <h3 className="text-2xl font-bold mb-6">Personalized Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <h4 className="font-semibold mb-2">🥗 Nutrition</h4>
              <p className="text-sm opacity-90">
                Continue balanced protein intake. Consider increasing omega-3 fatty acids for enhanced brain function.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <h4 className="font-semibold mb-2">💊 Supplements</h4>
              <p className="text-sm opacity-90">
                Magnesium and B-complex vitamins may support energy metabolism optimization.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <h4 className="font-semibold mb-2">🏃 Lifestyle</h4>
              <p className="text-sm opacity-90">
                Maintain current exercise routine. Consider meditation for neurotransmitter balance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

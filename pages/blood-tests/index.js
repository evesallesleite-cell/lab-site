// Blood Tests Dashboard Index
// Provides easy access to all blood test analysis functionality

import { useRouter } from 'next/router';
import Header from '../../components/header';

export default function BloodTestsIndex() {
  const router = useRouter();

  const bloodTestPages = [
    { 
      name: 'Hormone Analysis', 
      path: '/blood-tests/hormones', 
      description: 'Comprehensive hormone panel analysis including DHEA, cortisol, and reproductive hormones',
      icon: '🧪'
    },
    { 
      name: 'Lipid Profile', 
      path: '/blood-tests/lipids', 
      description: 'Cholesterol, HDL, LDL, triglycerides and cardiovascular health markers',
      icon: '❤️'
    },
    { 
      name: 'Metabolomics', 
      path: '/blood-tests/metabolomics', 
      description: 'Advanced metabolic analysis and biochemical pathway insights',
      icon: '⚛️'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">
            🩸 Blood Test Analysis Dashboard
          </h1>
          
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">📊 Comprehensive Blood Work Analysis</h2>
            <p className="text-gray-600 mb-4">
              Advanced analysis of blood test results including hormone panels, lipid profiles, 
              and metabolomic data with integrated visualizations and trend analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {bloodTestPages.map((page, index) => (
              <div 
                key={index}
                onClick={() => router.push(page.path)}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6 border-l-4 border-red-500"
              >
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{page.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {page.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {page.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-900 mb-2">🔬 Available Analyses</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white p-3 rounded border">
                <h4 className="font-semibold">🧪 Hormone Panel</h4>
                <p className="text-gray-600">DHEA, DHEA-S, Cortisol, Progesterone, Estradiol, LH, FSH</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <h4 className="font-semibold">❤️ Cardiovascular</h4>
                <p className="text-gray-600">Total Cholesterol, HDL, LDL, Triglycerides, VLDL</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <h4 className="font-semibold">⚛️ Metabolomics</h4>
                <p className="text-gray-600">Advanced metabolic pathway analysis and biomarkers</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <h4 className="font-semibold">📈 Trends</h4>
                <p className="text-gray-600">Historical tracking and predictive analysis</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Medical Dashboard Index
// Provides easy access to all medical analysis functionality

import { useRouter } from 'next/router';
import Header from '../../components/header';

export default function MedicalIndex() {
  const router = useRouter();

  const medicalPages = [
    { 
      name: 'PDF Medical Report Extractor', 
      path: '/medical/simple-pdf', 
      description: 'AI-powered extraction of bacterial taxonomy and medical data from PDFs',
      icon: '📄'
    },
    { 
      name: 'Digestive Health Analysis', 
      path: '/medical/digestive', 
      description: 'Comprehensive digestive health and microbiome analysis',
      icon: '🦠'
    },
    { 
      name: 'Advanced Digestive AI', 
      path: '/medical/digestive-ai', 
      description: 'AI-enhanced digestive health insights and recommendations',
      icon: '🧠'
    },
    { 
      name: 'Body Composition', 
      path: '/medical/body', 
      description: 'Body composition analysis and health metrics',
      icon: '⚖️'
    },
    { 
      name: 'LifeCode Analysis', 
      path: '/medical/lifecode', 
      description: 'Genetic analysis and personalized health insights',
      icon: '🧬'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">
            🏥 Medical Analysis Dashboard
          </h1>
          
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">🔬 Medical Data Analysis Platform</h2>
            <p className="text-gray-600 mb-4">
              Advanced medical data analysis tools including PDF report extraction, 
              digestive health analysis, genetic insights, and comprehensive health metrics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {medicalPages.map((page, index) => (
              <div 
                key={index}
                onClick={() => router.push(page.path)}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6 border-l-4 border-green-500"
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

          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-900 mb-2">✨ Featured Tools</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white p-3 rounded border">
                <h4 className="font-semibold">📄 PDF Extractor</h4>
                <p className="text-gray-600">Extract bacterial taxonomy and biomarkers from medical reports</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <h4 className="font-semibold">🦠 Microbiome Analysis</h4>
                <p className="text-gray-600">Comprehensive digestive health and gut bacteria analysis</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

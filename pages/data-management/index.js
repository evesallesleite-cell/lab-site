// Data Management Dashboard Index
// Central hub for all data upload, processing, and management functions

import { useRouter } from 'next/router';
import Header from '../../components/header';

export default function DataManagementIndex() {
  const router = useRouter();

  const dataManagementPages = [
    { 
      name: 'File Upload', 
      path: '/data-management/upload', 
      description: 'Upload and process PDFs, CSVs, and other health data files',
      icon: '📁'
    },
    { 
      name: 'Body Measurements', 
      path: '/data-management/body', 
      description: 'Track body composition, weight, and physical measurements',
      icon: '📏'
    },
    { 
      name: 'Digestive Health', 
      path: '/data-management/digestive', 
      description: 'Monitor digestive health metrics and symptoms',
      icon: '🍎'
    },
    { 
      name: 'LifeCode Analysis', 
      path: '/data-management/lifecode', 
      description: 'Advanced genetic and lifestyle factor analysis',
      icon: '🧬'
    }
  ];

  const quickActions = [
    { name: 'Quick Upload', action: () => router.push('/data-management/upload'), icon: '⚡' },
    { name: 'Data Explorer', action: () => router.push('/explore'), icon: '🔍' },
    { name: 'Test Functions', action: () => router.push('/test-whoop'), icon: '🧪' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">
            💾 Data Management Center
          </h1>
          
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">📊 Centralized Health Data Hub</h2>
            <p className="text-gray-600 mb-4">
              Upload, process, and manage all your health data from various sources. 
              Supports PDF extraction, CSV imports, WHOOP integration, and manual data entry.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">⚡ Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="bg-white hover:bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  <span>{action.icon}</span>
                  <span>{action.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dataManagementPages.map((page, index) => (
              <div 
                key={index}
                onClick={() => router.push(page.path)}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6 border-l-4 border-blue-500"
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

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">💾 Supported Data Types</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white p-3 rounded border">
                <h4 className="font-semibold">📄 Documents</h4>
                <p className="text-gray-600">PDF reports, lab results, medical records</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <h4 className="font-semibold">📊 Data Files</h4>
                <p className="text-gray-600">CSV, JSON, Excel exports from devices</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <h4 className="font-semibold">🔗 API Integrations</h4>
                <p className="text-gray-600">WHOOP, fitness trackers, health apps</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <h4 className="font-semibold">✋ Manual Entry</h4>
                <p className="text-gray-600">Body measurements, symptoms, notes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

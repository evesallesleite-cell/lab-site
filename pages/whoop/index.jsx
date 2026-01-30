// WHOOP Dashboard Index
// Provides easy access to all WHOOP-related functionality

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '../../components/header';

export default function WhoopIndex() {
  const router = useRouter();

  const whoopPages = [
    { 
      name: 'Main Dashboard', 
      path: '/whoop/whoop', 
      description: 'Complete WHOOP data overview with sleep, strain, and recovery',
      icon: '📊'
    },
    { 
      name: 'Sleep Analysis', 
      path: '/whoop/sleep', 
      description: 'Detailed sleep data, scores, and trends',
      icon: '🛌'
    },
    { 
      name: 'Strain Tracking', 
      path: '/whoop/strain', 
      description: 'Workout analysis and strain metrics',
      icon: '💪'
    },
    { 
      name: 'Recovery Metrics', 
      path: '/whoop/recovery', 
      description: 'Recovery scores and readiness data',
      icon: '🔋'
    },
    { 
      name: 'Sleep Dashboard', 
      path: '/whoop/sleep-dashboard', 
      description: 'Comprehensive sleep analysis dashboard',
      icon: '📈'
    },
    { 
      name: 'WHOOP Login', 
      path: '/whoop/whoop-login', 
      description: 'Authenticate with WHOOP API',
      icon: '🔐'
    },
    { 
      name: 'Enhanced View', 
      path: '/whoop/whoop-enhanced', 
      description: 'Enhanced WHOOP data visualization',
      icon: '✨'
    },
    { 
      name: 'Charts View', 
      path: '/whoop/whoop-charts', 
      description: 'Chart-focused WHOOP data analysis',
      icon: '📊'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">
            🏃‍♂️ WHOOP Data Dashboard
          </h1>
          
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">📊 WHOOP Analytics Platform</h2>
            <p className="text-gray-600 mb-4">
              Access comprehensive WHOOP data analysis including sleep patterns, workout strain, 
              and recovery metrics. All data is synchronized from your WHOOP device via the official API.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whoopPages.map((page, index) => (
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
            <h3 className="text-lg font-semibold text-blue-900 mb-2">🔗 Quick Links</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              <button 
                onClick={() => router.push('/whoop/whoop-login')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                🔐 Login to WHOOP
              </button>
              <button 
                onClick={() => router.push('/whoop/whoop')}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                📊 Main Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

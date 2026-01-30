// Advanced Debugging Component for PDF Extraction
// components/ExtractionDebugger.js

import { useState } from 'react';

export default function ExtractionDebugger({ extractionData, onReprocess }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedPages, setExpandedPages] = useState(new Set());
  
  if (!extractionData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-semibold">No Debug Data Available</h3>
        <p className="text-red-600">Upload a file to see extraction debugging information.</p>
      </div>
    );
  }

  const togglePageExpansion = (pageNum) => {
    const newExpanded = new Set(expandedPages);
    if (newExpanded.has(pageNum)) {
      newExpanded.delete(pageNum);
    } else {
      newExpanded.add(pageNum);
    }
    setExpandedPages(newExpanded);
  };

  const tabs = [
    { id: 'overview', label: '📊 Overview', count: null },
    { id: 'pages', label: '📄 Page Analysis', count: extractionData.pages?.length },
    { id: 'bacteria', label: '🧬 Bacterial Data', count: extractionData.consolidated?.bacterialTaxonomy?.length },
    { id: 'biomarkers', label: '🔬 Biomarkers', count: Object.keys(extractionData.consolidated?.biomarkers || {}).length },
    { id: 'fungi', label: '🍄 Fungal Data', count: extractionData.consolidated?.fungalAnalysis?.length },
    { id: 'raw', label: '🔍 Raw JSON', count: null }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="border-b border-gray-200">
        <div className="flex justify-between items-center p-4">
          <h2 className="text-xl font-bold text-gray-900">🛠️ Extraction Debugger</h2>
          <button
            onClick={onReprocess}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Reprocess File
          </button>
        </div>
        
        <div className="flex overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="ml-2 px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {activeTab === 'overview' && (
          <OverviewTab data={extractionData} />
        )}
        
        {activeTab === 'pages' && (
          <PagesTab 
            pages={extractionData.pages || []} 
            expandedPages={expandedPages}
            onToggleExpansion={togglePageExpansion}
          />
        )}
        
        {activeTab === 'bacteria' && (
          <BacterialTab data={extractionData.consolidated?.bacterialTaxonomy || []} />
        )}
        
        {activeTab === 'biomarkers' && (
          <BiomarkersTab data={extractionData.consolidated?.biomarkers || {}} />
        )}
        
        {activeTab === 'fungi' && (
          <FungalTab data={extractionData.consolidated?.fungalAnalysis || []} />
        )}
        
        {activeTab === 'raw' && (
          <RawJsonTab data={extractionData} />
        )}
      </div>
    </div>
  );
}

function OverviewTab({ data }) {
  const stats = {
    totalPages: data.totalPages || 0,
    bacterialEntries: data.consolidated?.bacterialTaxonomy?.length || 0,
    fungalEntries: data.consolidated?.fungalAnalysis?.length || 0,
    biomarkers: Object.keys(data.consolidated?.biomarkers || {}).filter(k => data.consolidated.biomarkers[k]).length,
    functionalTests: Object.keys(data.consolidated?.functionalTests || {}).filter(k => data.consolidated.functionalTests[k]).length,
    extractionMethod: data.extractionMethod || 'unknown'
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{value}</div>
            <div className="text-sm text-gray-600 capitalize">
              {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800">🎯 Extraction Quality Assessment</h3>
        <div className="mt-2 space-y-2">
          <QualityIndicator 
            label="Bacterial Species Extracted" 
            value={stats.bacterialEntries}
            expected={400}
            threshold={300}
          />
          <QualityIndicator 
            label="Biomarkers Found" 
            value={stats.biomarkers}
            expected={4}
            threshold={2}
          />
          <QualityIndicator 
            label="Functional Tests Found" 
            value={stats.functionalTests}
            expected={5}
            threshold={3}
          />
        </div>
      </div>

      {data.consolidated?.metadata?.pagesAnalyzed && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">📋 Page Analysis Summary</h3>
          <div className="space-y-2">
            {data.consolidated.metadata.pagesAnalyzed.map(page => (
              <div key={page.page} className="flex items-center justify-between bg-gray-50 rounded p-3">
                <span className="font-medium">Page {page.page}</span>
                <span className="text-sm text-gray-600">
                  {Array.isArray(page.type) ? page.type.join(', ') : page.type}
                </span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {page.dataCount} sections
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QualityIndicator({ label, value, expected, threshold }) {
  const percentage = Math.min((value / expected) * 100, 100);
  const status = value >= threshold ? 'good' : value > 0 ? 'warning' : 'poor';
  
  const colors = {
    good: 'bg-green-500',
    warning: 'bg-yellow-500', 
    poor: 'bg-red-500'
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <div className="flex items-center space-x-2">
        <div className="w-20 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${colors[status]}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm font-medium">{value}/{expected}</span>
      </div>
    </div>
  );
}

function PagesTab({ pages, expandedPages, onToggleExpansion }) {
  return (
    <div className="space-y-4">
      {pages.map(page => (
        <div key={page.pageNumber} className="border border-gray-200 rounded-lg">
          <button
            onClick={() => onToggleExpansion(page.pageNumber)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
          >
            <div className="flex items-center space-x-4">
              <span className="font-semibold">Page {page.pageNumber}</span>
              <span className="text-sm text-gray-600">
                {Array.isArray(page.pageType) ? page.pageType.join(', ') : page.pageType}
              </span>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                {page.textLength} chars
              </span>
            </div>
            <span className="text-gray-400">
              {expandedPages.has(page.pageNumber) ? '▼' : '▶'}
            </span>
          </button>
          
          {expandedPages.has(page.pageNumber) && (
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Detected Sections</h4>
                  <ul className="text-sm space-y-1">
                    {page.structuredData.detectedSections.map(section => (
                      <li key={section} className="text-gray-700">• {section}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Extracted Data</h4>
                  <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
                    {JSON.stringify(page.structuredData.extractedData, null, 2)}
                  </pre>
                </div>
              </div>
              
              <details className="mt-4">
                <summary className="cursor-pointer font-semibold text-sm">Raw Text Preview</summary>
                <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                  {page.rawText.slice(0, 1000)}...
                </pre>
              </details>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function BacterialTab({ data }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Bacterial Taxonomy Entries: {data.length}</h3>
        <div className="text-sm text-gray-600">
          Top abundance: {data[0]?.percentage?.toFixed(2)}%
        </div>
      </div>
      
      <div className="overflow-auto max-h-96">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="text-left p-2">Kingdom</th>
              <th className="text-left p-2">Phylum</th>
              <th className="text-left p-2">Genus</th>
              <th className="text-left p-2">Species</th>
              <th className="text-right p-2">%</th>
              <th className="text-right p-2">Qty</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 50).map((entry, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-2">{entry.kingdom}</td>
                <td className="p-2">{entry.phylum}</td>
                <td className="p-2">{entry.genus}</td>
                <td className="p-2">{entry.species}</td>
                <td className="p-2 text-right">{entry.percentage?.toFixed(2)}%</td>
                <td className="p-2 text-right">{entry.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 50 && (
          <div className="text-center p-4 text-gray-600">
            ... and {data.length - 50} more entries
          </div>
        )}
      </div>
    </div>
  );
}

function BiomarkersTab({ data }) {
  return (
    <div className="space-y-4">
      {Object.entries(data).map(([key, value]) => (
        value && (
          <div key={key} className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1')}</h3>
            <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Value:</span>
                <span className="ml-2 font-medium">{value.value}</span>
              </div>
              <div>
                <span className="text-gray-600">Unit:</span>
                <span className="ml-2 font-medium">{value.unit}</span>
              </div>
              <div>
                <span className="text-gray-600">Reference:</span>
                <span className="ml-2 font-medium">{value.reference || 'N/A'}</span>
              </div>
            </div>
          </div>
        )
      ))}
    </div>
  );
}

function FungalTab({ data }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {data.map((entry, idx) => (
          <div key={idx} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{entry.fullName}</h3>
              <div className="text-sm text-gray-600">
                {entry.genus} {entry.species}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{entry.percentage}%</div>
              <div className="text-sm text-gray-600">Qty: {entry.quantity}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RawJsonTab({ data }) {
  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="font-semibold">Complete Extraction Data</h3>
        <button
          onClick={() => navigator.clipboard.writeText(JSON.stringify(data, null, 2))}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
        >
          📋 Copy JSON
        </button>
      </div>
      <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto max-h-96">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

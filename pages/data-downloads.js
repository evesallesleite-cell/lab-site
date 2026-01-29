import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const Header = dynamic(() => import("../components/header"), { ssr: false });

export default function DataDownloads() {
  const [dataStats, setDataStats] = useState(null);
  const [fullData, setFullData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load all data on component mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      
      // Load unified data
      const unifiedResponse = await fetch('/api/personal/unified-data');
      const unifiedResult = await unifiedResponse.json();
      
      // Load all WHOOP data files
      const [sleepResponse, recoveryResponse, strainResponse] = await Promise.all([
        fetch('/data-json/sleep-data.json'),
        fetch('/data-json/recovery-data.json'),
        fetch('/data-json/strain-data.json')
      ]);
      
      const [sleepData, recoveryData, strainData] = await Promise.all([
        sleepResponse.json(),
        recoveryResponse.json(),
        strainResponse.json()
      ]);
      
      if (unifiedResult.success) {
        setDataStats({
          sleepRecords: sleepData.records?.length || 0,
          recoveryRecords: recoveryData.records?.length || 0,
          strainRecords: strainData.records?.length || 0,
          supplements: unifiedResult.data.supplements?.totalSupplements || 0,
          bloodTests: unifiedResult.data.bloodTests?.length || 0,
          genetics: Object.keys(unifiedResult.data.genetics || {}).length,
          lastUpdated: unifiedResult.data.profile?.lastUpdated || 'Unknown'
        });
        
        setFullData({
          unified: unifiedResult.data,
          whoop: {
            sleep: sleepData,
            recovery: recoveryData,
            strain: strainData
          },
          supplements: unifiedResult.data.supplements,
          bloodTests: unifiedResult.data.bloodTests,
          genetics: unifiedResult.data.genetics
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadJson = (data, filename) => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (data) => {
    const size = JSON.stringify(data).length;
    return size > 1024 * 1024 
      ? `${(size / (1024 * 1024)).toFixed(1)} MB`
      : size > 1024
      ? `${(size / 1024).toFixed(1)} KB`
      : `${size} bytes`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your health data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto p-6">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Health Data Downloads</h1>
          <p className="text-gray-600 mb-4">
            Download your complete health datasets in JSON format for analysis, backup, or integration with other tools.
          </p>
          
          {dataStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded">
                <div className="font-semibold text-blue-900">Sleep Records</div>
                <div className="text-blue-700">{dataStats.sleepRecords}</div>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <div className="font-semibold text-purple-900">Strain Records</div>
                <div className="text-purple-700">{dataStats.strainRecords}</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="font-semibold text-green-900">Recovery Records</div>
                <div className="text-green-700">{dataStats.recoveryRecords}</div>
              </div>
              <div className="bg-orange-50 p-3 rounded">
                <div className="font-semibold text-orange-900">Supplements</div>
                <div className="text-orange-700">{dataStats.supplements}</div>
              </div>
            </div>
          )}
          
          <div className="mt-4 text-xs text-gray-500">
            Last updated: {dataStats?.lastUpdated}
          </div>
        </div>

        {/* Download Cards Grid */}
        {fullData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* WHOOP Sleep Data */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🛏️</div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Sleep Data</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Complete sleep records with scores, stages (light, deep, REM), efficiency, HRV, and respiratory rate data.
                  </p>
                  <div className="space-y-2 text-xs text-gray-500 mb-4">
                    <div>• Records: {dataStats.sleepRecords}</div>
                    <div>• File size: ~{formatFileSize(fullData.whoop.sleep)}</div>
                    <div>• Includes: Sleep scores, stage breakdown, efficiency, heart rate variability</div>
                  </div>
                  <button
                    onClick={() => downloadJson(fullData.whoop.sleep, 'whoop-sleep-data.json')}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Download Sleep JSON
                  </button>
                </div>
              </div>
            </div>

            {/* WHOOP Strain Data */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">💪</div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Strain/Workout Data</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    All workout sessions with strain scores, heart rate data, sport types, duration, and performance metrics.
                  </p>
                  <div className="space-y-2 text-xs text-gray-500 mb-4">
                    <div>• Records: {dataStats.strainRecords}</div>
                    <div>• File size: ~{formatFileSize(fullData.whoop.strain)}</div>
                    <div>• Includes: Sport IDs, strain scores, heart rate zones, calories</div>
                  </div>
                  <button
                    onClick={() => downloadJson(fullData.whoop.strain, 'whoop-strain-data.json')}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                  >
                    Download Strain JSON
                  </button>
                </div>
              </div>
            </div>

            {/* WHOOP Recovery Data */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🔄</div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Recovery Data</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Daily recovery scores including recovery percentage, resting heart rate, HRV measurements, and trends.
                  </p>
                  <div className="space-y-2 text-xs text-gray-500 mb-4">
                    <div>• Records: {dataStats.recoveryRecords}</div>
                    <div>• File size: ~{formatFileSize(fullData.whoop.recovery)}</div>
                    <div>• Includes: Recovery scores, RHR, HRV, sleep performance impact</div>
                  </div>
                  <button
                    onClick={() => downloadJson(fullData.whoop.recovery, 'whoop-recovery-data.json')}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Download Recovery JSON
                  </button>
                </div>
              </div>
            </div>

            {/* Supplement Stack */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">💊</div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Supplement Stack</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Complete supplement regimen with dosages, timing, benefits, and stacking recommendations.
                  </p>
                  <div className="space-y-2 text-xs text-gray-500 mb-4">
                    <div>• Supplements: {dataStats.supplements}</div>
                    <div>• File size: ~{formatFileSize(fullData.supplements)}</div>
                    <div>• Includes: Names, dosages, timing, benefits, categories</div>
                  </div>
                  <button
                    onClick={() => downloadJson(fullData.supplements, 'supplement-stack.json')}
                    className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                  >
                    Download Supplements JSON
                  </button>
                </div>
              </div>
            </div>

            {/* Blood Test Data */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🩸</div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Blood Test Results</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Laboratory blood test results with biomarkers, reference ranges, and trend analysis.
                  </p>
                  <div className="space-y-2 text-xs text-gray-500 mb-4">
                    <div>• Test records: {dataStats.bloodTests}</div>
                    <div>• File size: ~{formatFileSize(fullData.bloodTests || {})}</div>
                    <div>• Includes: Biomarker values, reference ranges, test dates</div>
                  </div>
                  <button
                    onClick={() => downloadJson(fullData.bloodTests, 'blood-test-results.json')}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Download Blood Tests JSON
                  </button>
                </div>
              </div>
            </div>

            {/* Genetic Data */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🧬</div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Genetic Data (LifeCode)</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Genetic test results and interpretations from LifeCode including health predispositions and recommendations.
                  </p>
                  <div className="space-y-2 text-xs text-gray-500 mb-4">
                    <div>• Genetic markers: {dataStats.genetics}</div>
                    <div>• File size: ~{formatFileSize(fullData.genetics || {})}</div>
                    <div>• Includes: Genetic variants, health insights, recommendations</div>
                  </div>
                  <button
                    onClick={() => downloadJson(fullData.genetics, 'lifecode-genetic-data.json')}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                  >
                    Download Genetics JSON
                  </button>
                </div>
              </div>
            </div>

            {/* Complete Unified Dataset */}
            <div className="bg-white rounded-lg shadow-sm p-6 md:col-span-2">
              <div className="flex items-start gap-4">
                <div className="text-3xl">📦</div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Complete Unified Dataset</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    All your health data combined into a single comprehensive JSON file including WHOOP metrics, supplements, blood tests, and genetic data.
                  </p>
                  <div className="space-y-2 text-xs text-gray-500 mb-4">
                    <div>• Total records: {dataStats.sleepRecords + dataStats.strainRecords + dataStats.recoveryRecords}</div>
                    <div>• File size: ~{formatFileSize(fullData.unified)}</div>
                    <div>• Includes: Everything above in a single organized structure</div>
                  </div>
                  <button
                    onClick={() => downloadJson(fullData.unified, 'complete-health-data.json')}
                    className="w-full px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 transition-colors"
                  >
                    Download Complete Dataset
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Usage Instructions */}
        <div className="bg-blue-50 rounded-lg p-6 mt-6">
          <h3 className="font-bold text-blue-900 mb-2">Usage Instructions</h3>
          <div className="text-blue-800 text-sm space-y-2">
            <p>• JSON files can be imported into analysis tools like Python pandas, R, Excel, or Tableau</p>
            <p>• Use ChatGPT Code Interpreter or Claude to analyze the data by uploading the JSON files</p>
            <p>• Each file is formatted for easy parsing with clear field names and consistent structure</p>
            <p>• For WHOOP data: sport_id 45 = gym/weightlifting, 34 = tennis, 52 = hiking</p>
          </div>
        </div>
      </div>
    </div>
  );
}
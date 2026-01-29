import React, { useState, useEffect, useMemo } from "react";
import Script from "next/script";
import dynamic from "next/dynamic";
import { GUT_HEALTH_ANALYSIS_PROMPT } from "../../lib/ai-prompts";

// Avoid SSR issues for the AI analysis component
const SmartBlurb = dynamic(() => import("../../components/SmartBlurb"), { ssr: false });

export default function DigestivePage() {
  const [gutData, setGutData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pdfLoaded, setPdfLoaded] = useState(false);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('gut_health_data');
    if (savedData) {
      try {
        setGutData(JSON.parse(savedData));
      } catch (err) {
        console.error('Error loading saved gut health data:', err);
      }
    }
  }, []);

  const clearData = () => {
    setGutData(null);
    localStorage.removeItem('gut_health_data');
  };

  // Memoize gut health analysis prompt to prevent unnecessary re-renders
  const gutHealthPrompt = useMemo(() => {
    if (!gutData) return '';
    
    return GUT_HEALTH_ANALYSIS_PROMPT.replace(
      '{data}', 
      JSON.stringify(gutData, null, 2)
    );
  }, [gutData]);

  // Parse gut health data from PDF text
  const parseGutHealthData = (text) => {
    const data = {
      testType: 'gut_health',
      patientInfo: {},
      functionalTests: {},
      biomarkers: {},
      microbiota: {},
      summary: {}
    };

    // Extract patient info
    const patientMatch = text.match(/Paciente:\s*([^\n]+)/);
    if (patientMatch) data.patientInfo.name = patientMatch[1].trim();

    const ageMatch = text.match(/Idade:\s*(\d+)\s*anos/);
    if (ageMatch) data.patientInfo.age = parseInt(ageMatch[1]);

    const dateMatch = text.match(/Data da coleta:\s*([^\n]+)/);
    if (dateMatch) data.patientInfo.collectionDate = dateMatch[1].trim();

    // Extract functional coprological tests
    const functionalSection = text.match(/PROVA COPROLÓGICA FUNCIONAL([\s\S]*?)BIOMARCADORES/);
    if (functionalSection) {
      const functionalText = functionalSection[1];
      
      // Parse key indicators
      const consistencyMatch = functionalText.match(/CONSISTÊNCIA\s+([^\s]+)/);
      if (consistencyMatch) data.functionalTests.consistency = consistencyMatch[1];

      const pHMatch = functionalText.match(/pH\s+([\d,]+)/);
      if (pHMatch) data.functionalTests.pH = pHMatch[1];

      const fatMatch = functionalText.match(/GORDURAS NEUTRAS\s+([^\s]+)/);
      if (fatMatch) data.functionalTests.neutralFats = fatMatch[1];
    }

    // Extract biomarkers
    const calprotectinMatch = text.match(/CALPROTECTINA\s+([\d,]+)\s*ug\/g/);
    if (calprotectinMatch) data.biomarkers.calprotectin = parseFloat(calprotectinMatch[1].replace(',', '.'));

    const zonulinMatch = text.match(/ZONULINA\s+([\d,]+)\s*ng\/mL/);
    if (zonulinMatch) data.biomarkers.zonulin = parseFloat(zonulinMatch[1].replace(',', '.'));

    const elastaseMatch = text.match(/ELASTASE PANCREÁTICA\s+>?([\d,]+)\s*μg\/g/);
    if (elastaseMatch) data.biomarkers.elastase = parseFloat(elastaseMatch[1].replace(',', '.'));

    // Extract microbiota data
    const abundanceMatch = text.match(/Abundância.*?F\+B\s+([\d,]+)%/);
    if (abundanceMatch) data.microbiota.abundance = parseFloat(abundanceMatch[1].replace(',', '.'));

    const proportionMatch = text.match(/Proporção.*?F\/B\s+([\d,]+)/);
    if (proportionMatch) data.microbiota.proportion = parseFloat(proportionMatch[1].replace(',', '.'));

    const diversityMatch = text.match(/DIVERSIDADE\s+([\d,]+)/);
    if (diversityMatch) data.microbiota.diversity = parseFloat(diversityMatch[1].replace(',', '.'));

    const richnessMatch = text.match(/RIQUEZA\s+(\d+)/);
    if (richnessMatch) data.microbiota.richness = parseInt(richnessMatch[1]);

    // Extract protective bacteria
    data.microbiota.protectiveBacteria = {};
    const akkermansiMatch = text.match(/Akkermansia muciniphila\s+([\d,]+)%/);
    if (akkermansiMatch) data.microbiota.protectiveBacteria.akkermansia = parseFloat(akkermansiMatch[1].replace(',', '.'));

    const faecalibacteriumMatch = text.match(/Faecalibacterium prausnitzii\s+([\d,]+)%/);
    if (faecalibacteriumMatch) data.microbiota.protectiveBacteria.faecalibacterium = parseFloat(faecalibacteriumMatch[1].replace(',', '.'));

    const bifidobacteriumMatch = text.match(/Bifidobacterium spp\s+([\d,]+)%/);
    if (bifidobacteriumMatch) data.microbiota.protectiveBacteria.bifidobacterium = parseFloat(bifidobacteriumMatch[1].replace(',', '.'));

    return data;
  };

  const handleFileUpload = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      setError('Please select a valid PDF file');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use pdfjs-dist to extract text from PDF
      const pdfjsLib = window.pdfjsLib;
      if (!pdfjsLib) {
        throw new Error('PDF.js library not loaded');
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }

      console.log('Extracted PDF text:', fullText.substring(0, 1000) + '...');

      const parsedData = parseGutHealthData(fullText);
      console.log('Parsed gut health data:', parsedData);

      setGutData(parsedData);
      localStorage.setItem('gut_health_data', JSON.stringify(parsedData));

    } catch (err) {
      console.error('Error processing PDF:', err);
      setError('Error processing PDF file: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50">
      {/* PDF.js Script */}
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
        onLoad={() => {
          if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            setPdfLoaded(true);
          }
        }}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <span className="text-6xl mr-4">🦠</span>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Digestive System Analysis
              </h1>
              <div className="flex items-center justify-center mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                  🧬 PDF Analysis
                </span>
              </div>
            </div>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Upload your intestinal checkup report for comprehensive digestive health analysis, 
            microbiome assessment, and personalized gut health recommendations
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Upload Your Intestinal Checkup Report</h2>
            {gutData && (
              <span className="text-sm text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                ✓ Report loaded
              </span>
            )}
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-emerald-400 transition-colors">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && pdfLoaded) {
                  handleFileUpload(file);
                } else if (!pdfLoaded) {
                  setError('PDF.js library is still loading, please wait...');
                }
              }}
              className="hidden"
              id="pdf-upload"
              disabled={loading || !pdfLoaded}
            />
            <label
              htmlFor="pdf-upload"
              className={`cursor-pointer inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 ${loading || !pdfLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Processing...' : gutData ? 'Upload New Report' : 'Choose PDF File'}
            </label>
            {gutData && (
              <button
                onClick={clearData}
                className="ml-4 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-red-600 bg-red-50 hover:bg-red-100"
              >
                Clear Data
              </button>
            )}
            <p className="text-gray-500 mt-2">Upload your intestinal health PDF report</p>
            {!pdfLoaded && (
              <p className="text-amber-600 mt-2 text-sm">Loading PDF reader...</p>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Results Display */}
        {gutData && (
          <div className="space-y-8">
            {/* Patient Info */}
            {gutData.patientInfo && Object.keys(gutData.patientInfo).length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Patient Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {gutData.patientInfo.name && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <span className="text-sm text-gray-600">Patient</span>
                      <p className="font-semibold text-gray-900">{gutData.patientInfo.name}</p>
                    </div>
                  )}
                  {gutData.patientInfo.age && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <span className="text-sm text-gray-600">Age</span>
                      <p className="font-semibold text-gray-900">{gutData.patientInfo.age} years</p>
                    </div>
                  )}
                  {gutData.patientInfo.collectionDate && (
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <span className="text-sm text-gray-600">Collection Date</span>
                      <p className="font-semibold text-gray-900">{gutData.patientInfo.collectionDate}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Key Indicators Overview */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Gut Health Overview</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Biomarkers */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">🔬</span>
                    Biomarkers
                  </h3>
                  <div className="space-y-3">
                    {gutData.biomarkers.calprotectin && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-700">Calprotectin</span>
                        <span className="font-semibold">{gutData.biomarkers.calprotectin} μg/g</span>
                      </div>
                    )}
                    {gutData.biomarkers.zonulin && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-700">Zonulin</span>
                        <span className="font-semibold">{gutData.biomarkers.zonulin} ng/mL</span>
                      </div>
                    )}
                    {gutData.biomarkers.elastase && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-700">Elastase</span>
                        <span className="font-semibold">{gutData.biomarkers.elastase} μg/g</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Microbiota */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">🦠</span>
                    Microbiota
                  </h3>
                  <div className="space-y-3">
                    {gutData.microbiota.diversity && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-700">Diversity</span>
                        <span className="font-semibold">{gutData.microbiota.diversity}</span>
                      </div>
                    )}
                    {gutData.microbiota.richness && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-700">Richness</span>
                        <span className="font-semibold">{gutData.microbiota.richness}</span>
                      </div>
                    )}
                    {gutData.microbiota.abundance && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-700">F+B Abundance</span>
                        <span className="font-semibold">{gutData.microbiota.abundance}%</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Functional Tests */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">⚙️</span>
                    Function
                  </h3>
                  <div className="space-y-3">
                    {gutData.functionalTests.consistency && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-700">Consistency</span>
                        <span className="font-semibold">{gutData.functionalTests.consistency}</span>
                      </div>
                    )}
                    {gutData.functionalTests.pH && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-700">pH</span>
                        <span className="font-semibold">{gutData.functionalTests.pH}</span>
                      </div>
                    )}
                    {gutData.functionalTests.neutralFats && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-700">Neutral Fats</span>
                        <span className="font-semibold">{gutData.functionalTests.neutralFats}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Analysis */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">🤖 AI Digestive Health Analysis</h2>
                <button
                  onClick={() => {
                    // Clear gut health analysis cache
                    const keysToRemove = [];
                    for (let i = 0; i < localStorage.length; i++) {
                      const key = localStorage.key(i);
                      if (key && key.includes('gut_health_analysis')) {
                        keysToRemove.push(key);
                      }
                    }
                    keysToRemove.forEach(key => localStorage.removeItem(key));
                    console.log(`Cleared ${keysToRemove.length} gut health analysis cache entries`);
                    // Force page refresh to regenerate analysis
                    window.location.reload();
                  }}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-sm font-medium"
                  title="Refresh AI Analysis"
                >
                  🔄 Refresh AI Analysis
                </button>
              </div>
              
              <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-lg p-6 border border-emerald-200">
                <SmartBlurb 
                  title="Comprehensive Digestive Health Analysis"
                  useCache={true}
                  cacheKey="gut_health_analysis"
                  customData={gutData}
                  customPrompt={gutHealthPrompt}
                />
              </div>
            </div>

            {/* Raw Data Display for debugging */}
            <details className="bg-white rounded-2xl shadow-lg p-8">
              <summary className="text-xl font-bold text-gray-900 cursor-pointer">
                📊 Parsed Data (Debug)
              </summary>
              <pre className="mt-4 p-4 bg-gray-100 rounded-lg text-sm overflow-auto">
                {JSON.stringify(gutData, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Info Section for when no data is uploaded */}
        {!gutData && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">What You'll Get</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🔬</span>
                  Comprehensive Analysis
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Biomarker interpretation (Calprotectin, Zonulin, Elastase)</li>
                  <li>• Microbiome diversity and composition assessment</li>
                  <li>• Digestive function evaluation</li>
                  <li>• Inflammation and permeability indicators</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">💡</span>
                  Personalized Recommendations
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Targeted dietary modifications</li>
                  <li>• Specific probiotic and prebiotic protocols</li>
                  <li>• Lifestyle interventions for gut health</li>
                  <li>• Monitoring and follow-up guidance</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

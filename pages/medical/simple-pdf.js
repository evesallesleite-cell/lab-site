// Simple PDF to JSON Extraction
// pages/simple-pdf.js

import { useState } from 'react';
import Header from '../../components/header';

export default function SimplePDF() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [pageProgress, setPageProgress] = useState({ current: 0, total: 0 });
  const [debugTab, setDebugTab] = useState('text'); // New state for debug tabs

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile && uploadedFile.type === 'application/pdf') {
      setFile(uploadedFile);
      setResult(null);
      setError(null);
    } else {
      alert('Please upload a PDF file');
    }
  };

  const processSimplePDF = async () => {
    if (!file) {
      alert('Please select a PDF file first');
      return;
    }

    setProcessing(true);
    setError(null);
    setCurrentStep(1);
    setPageProgress({ current: 0, total: 0 });
    
    try {
      console.log('� DEBUG: Starting simple PDF processing...');
      console.log('🚀 DEBUG: File info:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });
      setStatus('📄 Uploading PDF file...');
      
      // Step 1: Extract text from PDF with timeout
      const formData = new FormData();
      formData.append('pdf', file);
      
      console.log('🚀 DEBUG: FormData created, starting OCR request...');
      setStatus('🔧 Starting PDF text extraction...');
      
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('❌ DEBUG: OCR request timed out after 30 seconds');
        controller.abort();
        setError('PDF extraction timed out after 30 seconds. Your PDF might be too complex for PDF.js extraction.');
      }, 30000); // Reduced to 30 second timeout
      
      console.log('🚀 DEBUG: Sending OCR request to /api/medical/pdf-ocr-working...');
      const ocrResponse = await fetch('/api/medical/pdf-ocr-working', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      
      console.log('🚀 DEBUG: OCR response received:', {
        status: ocrResponse.status,
        statusText: ocrResponse.statusText,
        ok: ocrResponse.ok
      });
      
      clearTimeout(timeoutId);
      
      if (!ocrResponse.ok) {
        const errorText = await ocrResponse.text();
        console.log('❌ DEBUG: OCR failed with error:', errorText);
        throw new Error(`OCR failed (${ocrResponse.status}): ${errorText}`);
      }
      
      console.log('🚀 DEBUG: Parsing OCR JSON response...');
      const ocrResult = await ocrResponse.json();
      console.log('✅ DEBUG: OCR completed successfully:', ocrResult.stats);
      console.log('🚀 DEBUG: First 500 chars of extracted text:', ocrResult.extractedText.substring(0, 500));
      
      setStatus(`✅ Extracted text from ${ocrResult.stats.totalPages} pages (${ocrResult.stats.totalCharacters} characters)`);
      setCurrentStep(2);
      
      // Brief pause to show the completion
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 2: Convert text to JSON with simple patterns
      console.log('🚀 DEBUG: Starting pattern extraction...');
      setStatus('🧠 Analyzing text and extracting medical data...');
      
      const aiController = new AbortController();
      const aiTimeoutId = setTimeout(() => {
        console.log('❌ DEBUG: Pattern extraction timed out after 30 seconds');
        aiController.abort();
        setError('Pattern extraction timed out after 30 seconds.');
      }, 30000); // 30 second timeout for pattern extraction
      
      console.log('🚀 DEBUG: Sending comprehensive extraction request to /api/medical/ai-extract-comprehensive...');
      const aiResponse = await fetch('/api/medical/ai-extract-comprehensive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: ocrResult.extractedText
        }),
        signal: aiController.signal
      });
      
      console.log('🚀 DEBUG: Pattern extraction response received:', {
        status: aiResponse.status,
        statusText: aiResponse.statusText,
        ok: aiResponse.ok
      });
      
      clearTimeout(aiTimeoutId);
      
      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.log('❌ DEBUG: Pattern extraction failed with error:', errorText);
        throw new Error(`Pattern extraction failed (${aiResponse.status}): ${errorText}`);
      }
      
      console.log('🚀 DEBUG: Parsing pattern extraction JSON response...');
      const aiResult = await aiResponse.json();
      console.log('✅ DEBUG: Comprehensive extraction completed successfully');
      console.log('🚀 DEBUG: Extracted data summary:', {
        hasBacterialTaxonomy: !!aiResult.extractedData?.completeBacterialTaxonomy,
        bacterialCount: aiResult.extractedData?.completeBacterialTaxonomy?.length || 0,
        hasBiomarkers: !!aiResult.extractedData?.biomarkers,
        biomarkersCount: Object.keys(aiResult.extractedData?.biomarkers || {}).length,
        hasPatientInfo: !!aiResult.extractedData?.patientInfo,
        hasFunctionalTests: !!aiResult.extractedData?.functionalTests,
        hasMicrobiotaSummary: !!aiResult.extractedData?.microbiotaSummary,
        hasPhylumAnalysis: !!aiResult.extractedData?.phylumAnalysis,
        protectiveBacteriaCount: aiResult.extractedData?.protectiveBacteria?.length || 0,
        pathogenicBacteriaCount: aiResult.extractedData?.pathogenicBacteria?.length || 0,
        atypicalFindingsCount: aiResult.extractedData?.atypicalFindings?.length || 0,
        fungalAnalysisCount: aiResult.extractedData?.fungalAnalysis?.length || 0,
        extractionMethod: aiResult.metadata?.extractionMethod
      });
      
      const bacterialCount = aiResult.extractedData?.completeBacterialTaxonomy?.length || 0;
      const biomarkersCount = Object.keys(aiResult.extractedData?.biomarkers || {}).length;
      const sectionsFound = Object.keys(aiResult.extractedData || {}).length;
      const protectiveBacteriaCount = Array.isArray(aiResult.extractedData?.protectiveBacteria) ? aiResult.extractedData.protectiveBacteria.length : 0;
      const pathogenicBacteriaCount = Array.isArray(aiResult.extractedData?.pathogenicBacteria) ? aiResult.extractedData.pathogenicBacteria.length : 0;
      const atypicalFindingsCount = Array.isArray(aiResult.extractedData?.atypicalFindings) ? aiResult.extractedData.atypicalFindings.length : 0;
      
      setStatus(`✅ Comprehensive extraction complete! Found ${bacterialCount} bacterial species, ${biomarkersCount} biomarkers, and ${sectionsFound} data sections`);
      setCurrentStep(3);
      
      console.log('✅ DEBUG: Processing completed successfully!');
      setResult({
        rawText: ocrResult.extractedText,
        extractedData: aiResult.extractedData,
        stats: {
          textLength: ocrResult.extractedText.length,
          bacterialCount: bacterialCount,
          biomarkersCount: biomarkersCount,
          sectionsFound: sectionsFound,
          protectiveBacteriaCount: protectiveBacteriaCount,
          pathogenicBacteriaCount: pathogenicBacteriaCount,
          atypicalFindingsCount: atypicalFindingsCount
        }
      });
      
    } catch (error) {
      console.error('❌ DEBUG: Processing failed with error:', error);
      console.error('❌ DEBUG: Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      if (error.name === 'AbortError') {
        setError('Processing was cancelled due to timeout. Please try with a smaller PDF or check your connection.');
      } else {
        setError(error.message);
      }
      setStatus(`❌ Processing failed: ${error.message}`);
    } finally {
      console.log('🚀 DEBUG: Processing finished, cleaning up...');
      setProcessing(false);
    }
  };

  const downloadJSON = () => {
    if (!result?.extractedData) return;
    
    const blob = new Blob([JSON.stringify(result.extractedData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical_data_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">
            📄 Comprehensive Medical Report Extractor
          </h1>
          
          {/* File Upload */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">1. Upload PDF</h2>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {file && (
              <p className="mt-2 text-green-600">✅ {file.name}</p>
            )}
          </div>

          {/* Process Button */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">2. Extract Data</h2>
            <button
              onClick={processSimplePDF}
              disabled={!file || processing}
              className={`w-full py-3 px-6 rounded-lg text-white font-bold ${
                !file || processing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {processing ? '🔄 Processing...' : '🚀 Comprehensive Extract'}
            </button>
          </div>

          {/* Progress Display */}
          {processing && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">🔄 Processing Status</h2>
              
              {/* Current Status */}
              <div className="mb-4">
                <p className="text-lg mb-2">{status}</p>
                
                {/* Progress Steps */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {currentStep > 1 ? '✅' : '1'}
                    </div>
                    <span>PDF Upload</span>
                  </div>
                  
                  <div className="flex-1 h-0.5 bg-gray-300">
                    <div className={`h-full bg-green-500 transition-all duration-500 ${currentStep >= 2 ? 'w-full' : 'w-0'}`}></div>
                  </div>
                  
                  <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {currentStep > 2 ? '✅' : '2'}
                    </div>
                    <span>OCR Extract</span>
                  </div>
                  
                  <div className="flex-1 h-0.5 bg-gray-300">
                    <div className={`h-full bg-green-500 transition-all duration-500 ${currentStep >= 3 ? 'w-full' : 'w-0'}`}></div>
                  </div>
                  
                  <div className={`flex items-center space-x-2 ${currentStep >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {currentStep >= 3 ? '✅' : '3'}
                    </div>
                    <span>AI Extract</span>
                  </div>
                </div>
              </div>
              
              {/* Animated Processing Indicator */}
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Processing your medical report...</span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <h3 className="font-bold">Error:</h3>
              <p>{error}</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">3. Results</h2>
              
              {/* Comprehensive Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-100 p-4 rounded text-center">
                  <h3 className="font-bold text-sm">Text Length</h3>
                  <p className="text-xl">{result.stats.textLength}</p>
                </div>
                <div className="bg-green-100 p-4 rounded text-center">
                  <h3 className="font-bold text-sm">Bacteria Found</h3>
                  <p className="text-xl">{result.stats.bacterialCount}</p>
                </div>
                <div className="bg-yellow-100 p-4 rounded text-center">
                  <h3 className="font-bold text-sm">Biomarkers</h3>
                  <p className="text-xl">{result.stats.biomarkersCount}</p>
                </div>
                <div className="bg-purple-100 p-4 rounded text-center">
                  <h3 className="font-bold text-sm">Sections Found</h3>
                  <p className="text-xl">{Object.keys(result.extractedData || {}).length}</p>
                </div>
              </div>

              {/* Comprehensive Data Display */}
              {result.extractedData && (
                <div className="space-y-6 mb-6">
                  
                  {/* Patient Information */}
                  {result.extractedData.patientInfo && (
                    <div className="border rounded-lg p-4">
                      <h3 className="text-lg font-bold mb-3 text-blue-600">📋 Patient Information</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {Object.entries(result.extractedData.patientInfo).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-semibold">{key}:</span> {value}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Functional Tests */}
                  {result.extractedData.functionalTests && (
                    <div className="border rounded-lg p-4">
                      <h3 className="text-lg font-bold mb-3 text-green-600">🔬 Checkup Intestinal (Functional Tests)</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {Object.entries(result.extractedData.functionalTests).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-semibold">{key}:</span> {value}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Biomarkers */}
                  {result.extractedData.biomarkers && (
                    <div className="border rounded-lg p-4">
                      <h3 className="text-lg font-bold mb-3 text-orange-600">🧪 Biomarkers</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {Object.entries(result.extractedData.biomarkers).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-semibold">{key}:</span> {typeof value === 'object' ? JSON.stringify(value) : value}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Microbiota Summary */}
                  {result.extractedData.microbiotaSummary && (
                    <div className="border rounded-lg p-4">
                      <h3 className="text-lg font-bold mb-3 text-purple-600">🦠 Microbiota Summary</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {Object.entries(result.extractedData.microbiotaSummary).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-semibold">{key}:</span> {typeof value === 'object' ? JSON.stringify(value) : value}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Phylum Analysis */}
                  {result.extractedData.phylumAnalysis && Array.isArray(result.extractedData.phylumAnalysis) && result.extractedData.phylumAnalysis.length > 0 && (
                    <div className="border rounded-lg p-4">
                      <h3 className="text-lg font-bold mb-3 text-teal-600">🌿 Phylum Analysis</h3>
                      <div className="space-y-2 text-sm">
                        {result.extractedData.phylumAnalysis.map((phylum, index) => (
                          <div key={index} className="border-l-4 border-teal-300 pl-3">
                            <div className="font-semibold">{phylum.phylum || phylum.name}</div>
                            <div>Percentage: {phylum.percentage}</div>
                            {phylum.interpretation && <div className="text-gray-600">{phylum.interpretation}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Species Analysis */}
                  {((result.extractedData.protectiveBacteria && Array.isArray(result.extractedData.protectiveBacteria)) || 
                    (result.extractedData.pathogenicBacteria && Array.isArray(result.extractedData.pathogenicBacteria))) && (
                    <div className="border rounded-lg p-4">
                      <h3 className="text-lg font-bold mb-3 text-indigo-600">🔬 Species Analysis</h3>
                      
                      {result.extractedData.protectiveBacteria && Array.isArray(result.extractedData.protectiveBacteria) && result.extractedData.protectiveBacteria.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-green-600 mb-2">✅ Protective Bacteria</h4>
                          <div className="space-y-1 text-sm">
                            {result.extractedData.protectiveBacteria.map((bacteria, index) => (
                              <div key={index} className="border-l-4 border-green-300 pl-3">
                                <div className="font-medium">{bacteria.species || bacteria.name}</div>
                                {bacteria.percentage && <div>Percentage: {bacteria.percentage}</div>}
                                {bacteria.status && <div className="text-gray-600">{bacteria.status}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.extractedData.pathogenicBacteria && Array.isArray(result.extractedData.pathogenicBacteria) && result.extractedData.pathogenicBacteria.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-red-600 mb-2">⚠️ Pathogenic Bacteria</h4>
                          <div className="space-y-1 text-sm">
                            {result.extractedData.pathogenicBacteria.map((bacteria, index) => (
                              <div key={index} className="border-l-4 border-red-300 pl-3">
                                <div className="font-medium">{bacteria.species || bacteria.name}</div>
                                {bacteria.percentage && <div>Percentage: {bacteria.percentage}</div>}
                                {bacteria.status && <div className="text-gray-600">{bacteria.status}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Atypical Findings */}
                  {result.extractedData.atypicalFindings && Array.isArray(result.extractedData.atypicalFindings) && result.extractedData.atypicalFindings.length > 0 && (
                    <div className="border rounded-lg p-4">
                      <h3 className="text-lg font-bold mb-3 text-red-600">⚠️ Atypical Findings</h3>
                      <div className="space-y-1 text-sm">
                        {result.extractedData.atypicalFindings.map((finding, index) => (
                          <div key={index} className="border-l-4 border-red-300 pl-3">
                            <div className="font-medium">{finding.finding || finding.name}</div>
                            {finding.details && <div className="text-gray-600">{finding.details}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fungal Analysis */}
                  {result.extractedData.fungalAnalysis && Array.isArray(result.extractedData.fungalAnalysis) && result.extractedData.fungalAnalysis.length > 0 && (
                    <div className="border rounded-lg p-4">
                      <h3 className="text-lg font-bold mb-3 text-yellow-600">🍄 Fungal Analysis</h3>
                      <div className="space-y-1 text-sm">
                        {result.extractedData.fungalAnalysis.map((fungus, index) => (
                          <div key={index} className="border-l-4 border-yellow-300 pl-3">
                            <div className="font-medium">{fungus.fungus || fungus.name}</div>
                            {fungus.status && <div>Status: {fungus.status}</div>}
                            {fungus.details && <div className="text-gray-600">{fungus.details}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Complete Bacterial Taxonomy */}
                  {result.extractedData.completeBacterialTaxonomy && Array.isArray(result.extractedData.completeBacterialTaxonomy) && result.extractedData.completeBacterialTaxonomy.length > 0 && (
                    <div className="border rounded-lg p-4">
                      <h3 className="text-lg font-bold mb-3 text-gray-700">📊 Complete Bacterial Taxonomy List</h3>
                      <div className="max-h-96 overflow-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-100 sticky top-0">
                            <tr>
                              <th className="p-2 text-left border">Bacteria</th>
                              <th className="p-2 text-left border">Phylum</th>
                              <th className="p-2 text-left border">Class</th>
                              <th className="p-2 text-left border">Order</th>
                              <th className="p-2 text-left border">Family</th>
                              <th className="p-2 text-left border">Genus</th>
                              <th className="p-2 text-left border">Species</th>
                              <th className="p-2 text-left border">Quantity</th>
                              <th className="p-2 text-left border">Percentage</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.extractedData.completeBacterialTaxonomy.map((bacteria, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="p-2 border font-medium">{bacteria.bacteria || bacteria.name}</td>
                                <td className="p-2 border">{bacteria.phylum || '-'}</td>
                                <td className="p-2 border">{bacteria.class || '-'}</td>
                                <td className="p-2 border">{bacteria.order || '-'}</td>
                                <td className="p-2 border">{bacteria.family || '-'}</td>
                                <td className="p-2 border">{bacteria.genus || '-'}</td>
                                <td className="p-2 border">{bacteria.species || '-'}</td>
                                <td className="p-2 border font-medium">{bacteria.quantity || '-'}</td>
                                <td className="p-2 border font-medium">{bacteria.percentage || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* Download JSON */}
              <div className="mb-6">
                <button
                  onClick={downloadJSON}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                  📥 Download JSON
                </button>
              </div>

              {/* Debug Log with Tabs */}
              <div>
                <div className="flex items-center space-x-4 mb-4">
                  <h3 className="text-lg font-bold">🐛 Debug Output:</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setDebugTab('text')}
                      className={`px-3 py-1 rounded text-sm ${
                        debugTab === 'text' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      � Full Text
                    </button>
                    <button
                      onClick={() => setDebugTab('json')}
                      className={`px-3 py-1 rounded text-sm ${
                        debugTab === 'json' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      🔧 JSON Data
                    </button>
                  </div>
                </div>
                
                {debugTab === 'text' ? (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Complete text extracted from PDF ({result.rawText.length} characters):
                    </p>
                    <pre className="bg-gray-100 p-4 rounded text-xs max-h-96 overflow-auto border">
                      {result.rawText}
                    </pre>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Structured data extracted from the text:
                    </p>
                    <pre className="bg-gray-100 p-4 rounded text-xs max-h-96 overflow-auto border">
                      {JSON.stringify(result.extractedData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

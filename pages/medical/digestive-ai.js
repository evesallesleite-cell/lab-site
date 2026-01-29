import { useState, useEffect } from 'react';
import Head from 'next/head';
import ChartJSLoader from '../components/ChartJSLoader';
import SmartBlurb from '../components/SmartBlurb';
import ExtractionDebugger from '../components/ExtractionDebugger';
import { AIMedicalParser, DynamicReportRenderer } from '../lib/ai-medical-parser';
import { PDFPageExtractor } from '../lib/pdf-page-extractor';

export default function DigestiveAI() {
  const [gutData, setGutData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [extractionMethod, setExtractionMethod] = useState('page_by_page');
  const [debugData, setDebugData] = useState(null);
  const [showDebugger, setShowDebugger] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);

  // Load PDF.js
  useEffect(() => {
    const loadPDF = async () => {
      if (typeof window !== 'undefined') {
        try {
          const pdfjsLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
          setPdfLoaded(true);
        } catch (error) {
          console.error('Failed to load PDF.js:', error);
          setError('Failed to load PDF reader');
        }
      }
    };

    loadPDF();
  }, []);

  const handleFileUpload = async (file) => {
    if (!file) return;

    setLoading(true);
    setError('');
    setCurrentFile(file);
    
    try {
      console.log('🔄 Starting enhanced page-by-page PDF analysis...');
      
      let extractedData;
      let debugInfo;
      
      if (extractionMethod === 'page_by_page') {
        // Use new page-by-page extraction
        const pageExtractor = new PDFPageExtractor();
        const pageResults = await pageExtractor.extractByPages(file);
        
        debugInfo = {
          ...pageResults,
          debugInfo: pageExtractor.getDebugInfo()
        };
        
        // Convert to compatible format
        extractedData = convertPageDataToDisplayFormat(pageResults.consolidated);
        
        console.log('� Page-by-page extraction complete:', {
          pages: pageResults.totalPages,
          bacterialEntries: pageResults.consolidated.bacterialTaxonomy?.length || 0,
          fungalEntries: pageResults.consolidated.fungalAnalysis?.length || 0
        });
        
      } else {
        // Fallback to original method
        const textContent = await extractTextFromPDF(file);
        console.log('📄 Extracted text length:', textContent.length);
        
        const parser = new AIMedicalParser();
        extractedData = await parser.parseReport(textContent, 'digestive');
        
        debugInfo = {
          extractionMethod: 'legacy',
          textLength: textContent.length,
          data: extractedData
        };
      }
      
      setGutData(extractedData);
      setDebugData(debugInfo);
      
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      setError(`Analysis failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const extractTextFromPDF = async (file) => {
    const pdfjsLib = await import('pdfjs-dist');
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  };

  const convertPageDataToDisplayFormat = (consolidated) => {
    // Convert the new format to the existing display format
    return {
      testType: "gut_health",
      patientInfo: {
        name: consolidated.patientInfo?.fullName || '',
        age: parseInt(consolidated.patientInfo?.age?.replace(/\D/g, '') || '0'),
        collectionDate: consolidated.patientInfo?.collectionDate || ''
      },
      functionalTests: consolidated.functionalTests || {},
      biomarkers: consolidated.biomarkers || {},
      microbiota: {
        // Convert bacterial taxonomy to summary format
        abundance: parseFloat(consolidated.microbiotaOverview?.fbAbundance?.replace(/[%,]/g, '') || '0'),
        diversity: parseFloat(consolidated.microbiotaOverview?.diversity?.replace(',', '.') || '0'),
        richness: parseInt(consolidated.microbiotaOverview?.richness || '0'),
        
        // Extract protective bacteria
        protectiveBacteria: extractProtectiveFromTaxonomy(consolidated.bacterialTaxonomy),
        pathogenicBacteria: extractPathogenicFromTaxonomy(consolidated.bacterialTaxonomy),
        atypicalFindings: extractAtypicalFromTaxonomy(consolidated.bacterialTaxonomy),
        
        // Generate summaries
        genusDistribution: generateGenusDistribution(consolidated.bacterialTaxonomy),
        phyloComposition: generatePhyloComposition(consolidated.bacterialTaxonomy)
      },
      fungalAnalysis: consolidated.fungalAnalysis || [],
      bacterialTaxonomy: consolidated.bacterialTaxonomy || [],
      summary: {
        reportType: determineReportTypes(consolidated)
      },
      extractionStats: {
        totalBacterialEntries: consolidated.bacterialTaxonomy?.length || 0,
        totalFungalEntries: consolidated.fungalAnalysis?.length || 0,
        extractionMethod: 'page_by_page_ocr'
      }
    };
  };

  const extractProtectiveFromTaxonomy = (taxonomy) => {
    const protective = {};
    const protectiveNames = [
      'Akkermansia muciniphila', 'Faecalibacterium prausnitzii', 
      'Bifidobacterium', 'Eubacterium rectale'
    ];
    
    taxonomy?.forEach(entry => {
      const fullName = `${entry.genus} ${entry.species}`;
      protectiveNames.forEach(name => {
        if (fullName.toLowerCase().includes(name.toLowerCase()) || 
            entry.genus.toLowerCase().includes(name.split(' ')[0].toLowerCase())) {
          const key = name.split(' ')[0].toLowerCase();
          protective[key] = entry.percentage;
        }
      });
    });
    
    return protective;
  };

  const extractPathogenicFromTaxonomy = (taxonomy) => {
    const pathogenic = {};
    const pathogenicNames = ['Bacteroides fragilis', 'Salmonella'];
    
    taxonomy?.forEach(entry => {
      const fullName = `${entry.genus} ${entry.species}`;
      pathogenicNames.forEach(name => {
        if (fullName.toLowerCase().includes(name.toLowerCase())) {
          const key = name.replace(' ', '').toLowerCase();
          pathogenic[key] = entry.percentage;
        }
      });
    });
    
    return pathogenic;
  };

  const extractAtypicalFromTaxonomy = (taxonomy) => {
    const atypical = {};
    const atypicalNames = [
      'Bacteroides dorei', 'Bilophila wadsworthia', 
      'Prevotella copri', 'Phascolarctobacterium faecium'
    ];
    
    taxonomy?.forEach(entry => {
      const fullName = `${entry.genus} ${entry.species}`;
      atypicalNames.forEach(name => {
        if (fullName.toLowerCase().includes(name.toLowerCase())) {
          const key = name.replace(' ', '').toLowerCase();
          atypical[key] = entry.percentage;
        }
      });
    });
    
    return atypical;
  };

  const generateGenusDistribution = (taxonomy) => {
    const distribution = {};
    taxonomy?.forEach(entry => {
      if (!distribution[entry.genus]) {
        distribution[entry.genus] = 0;
      }
      distribution[entry.genus] += entry.percentage;
    });
    
    return Object.fromEntries(
      Object.entries(distribution)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
    );
  };

  const generatePhyloComposition = (taxonomy) => {
    const composition = {};
    taxonomy?.forEach(entry => {
      if (!composition[entry.phylum]) {
        composition[entry.phylum] = 0;
      }
      composition[entry.phylum] += entry.percentage;
    });
    
    return composition;
  };

  const determineReportTypes = (consolidated) => {
    const types = [];
    if (consolidated.bacterialTaxonomy?.length > 0) types.push('Microbiota Sequencing');
    if (Object.keys(consolidated.biomarkers || {}).length > 0) types.push('Biomarkers');
    if (Object.keys(consolidated.functionalTests || {}).length > 0) types.push('Functional Tests');
    if (consolidated.fungalAnalysis?.length > 0) types.push('Fungal Analysis');
    return types.length > 0 ? types : ['Unknown'];
  };

  const clearData = () => {
    setGutData(null);
    setError('');
    setExtractionMethod('');
  };

  // Dynamic report renderer for any JSON structure
  const renderDynamicReport = (data) => {
    if (!data) return null;

    return (
      <div className="space-y-6">
        {/* Report Metadata */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Analysis Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="bg-white rounded-lg p-3">
              <div className="text-gray-600">Extraction Method</div>
              <div className="font-semibold text-blue-600">{data.metadata?.extractionMethod || 'Unknown'}</div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="text-gray-600">Sections Detected</div>
              <div className="font-semibold text-green-600">{data.metadata?.sectionsDetected || 0}</div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="text-gray-600">Report Types</div>
              <div className="font-semibold text-purple-600">{data.summary?.reportType?.join(', ') || 'None'}</div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="text-gray-600">Language</div>
              <div className="font-semibold text-orange-600">{data.reportInfo?.language || 'Auto-detected'}</div>
            </div>
          </div>
        </div>

        {/* Dynamic sections based on extracted data */}
        {Object.entries(data).map(([sectionKey, sectionData]) => {
          if (['metadata', 'summary', 'reportInfo'].includes(sectionKey)) return null;
          
          return renderSection(sectionKey, sectionData);
        })}

        {/* AI Analysis */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🤖 AI Health Analysis</h2>
          <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-lg p-6 border border-emerald-200">
            <SmartBlurb 
              title="AI-Powered Medical Report Analysis"
              useCache={true}
              cacheKey="ai_medical_analysis"
              customData={data}
              customPrompt={generateAIPrompt(data)}
            />
          </div>
        </div>

        {/* Raw JSON Data (for debugging) */}
        <details className="bg-white rounded-2xl shadow-lg p-8">
          <summary className="text-xl font-bold text-gray-900 cursor-pointer">
            🔍 Raw Extracted Data (Debug)
          </summary>
          <pre className="mt-4 p-4 bg-gray-100 rounded-lg text-xs overflow-auto max-h-96">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      </div>
    );
  };

  const renderSection = (sectionKey, sectionData) => {
    if (!sectionData || typeof sectionData !== 'object') return null;

    const sectionTitle = formatSectionTitle(sectionKey);
    
    return (
      <div key={sectionKey} className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{sectionTitle}</h2>
        
        {Array.isArray(sectionData) ? (
          <div className="space-y-4">
            {sectionData.map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                {typeof item === 'object' ? (
                  Object.entries(item).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center py-1">
                      <span className="text-gray-700">{formatKey(key)}</span>
                      <span className="font-semibold">{formatValue(value)}</span>
                    </div>
                  ))
                ) : (
                  <span>{item}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(sectionData).map(([key, value]) => (
              <div key={key} className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">{formatKey(key)}</div>
                <div className="font-semibold text-lg">{formatValue(value)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const formatSectionTitle = (key) => {
    const titleMap = {
      functionalTests: '⚙️ Functional Tests',
      biomarkers: '🩸 Biomarkers',
      microbiota: '🦠 Microbiota Analysis',
      patientInfo: '👤 Patient Information',
      additionalSections: '📋 Additional Data'
    };
    
    return titleMap[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  const formatKey = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ');
  };

  const formatValue = (value) => {
    if (typeof value === 'object' && value !== null) {
      if (value.value && value.unit) {
        return `${value.value} ${value.unit}`;
      }
      return JSON.stringify(value);
    }
    
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    
    return String(value);
  };

  const generateAIPrompt = (data) => {
    return `
Analyze this medical report data extracted from a digestive health report and provide:

1. **Health Status Summary**: Overall assessment of digestive health
2. **Key Findings**: Most important results (both concerning and positive)
3. **Bacterial Balance**: Analysis of microbiota composition
4. **Recommendations**: Actionable health advice based on the data
5. **Follow-up**: What tests or monitoring might be needed

Medical Data:
${JSON.stringify(data, null, 2)}

Provide a comprehensive but accessible analysis that a patient can understand.
    `;
  };

  return (
    <>
      <Head>
        <title>AI-Powered Digestive Health Analysis</title>
        <meta name="description" content="Advanced AI analysis of digestive health reports" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                🤖 AI-Powered Digestive Health Analysis
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Upload any medical report and let AI extract and analyze all the data automatically.
                No hardcoded patterns - pure AI reasoning.
              </p>
            </div>

            {/* Upload Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 Upload Medical Report</h2>
              
              <div className="text-center">
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
                  className={`cursor-pointer inline-flex items-center px-8 py-4 border-2 border-dashed border-emerald-300 text-lg font-medium rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors ${loading || !pdfLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      AI Processing...
                    </>
                  ) : (
                    <>
                      🤖 {gutData ? 'Upload New Report' : 'Choose PDF File (AI Analysis)'}
                    </>
                  )}
                </label>
                
                {gutData && (
                  <button
                    onClick={clearData}
                    className="ml-4 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-red-600 bg-red-50 hover:bg-red-100"
                  >
                    Clear Data
                  </button>
                )}
                
                <div className="mt-4 text-sm text-gray-600">
                  <p>✨ AI will automatically detect and extract all medical data</p>
                  <p>🔍 No hardcoded patterns - adapts to any report format</p>
                  {!pdfLoaded && (
                    <p className="text-amber-600 mt-2">Loading PDF reader...</p>
                  )}
                  {extractionMethod && (
                    <p className="text-blue-600 mt-2">Last extraction: {extractionMethod}</p>
                  )}
                </div>
                
                {/* Extraction Method Selector */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Extraction Method:
                  </label>
                  <select
                    value={extractionMethod}
                    onChange={(e) => setExtractionMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="page_by_page">🔍 Page-by-Page OCR (Recommended)</option>
                    <option value="legacy">🤖 Legacy AI Method</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Page-by-page extracts all 400+ bacterial species individually
                  </p>
                </div>
                
                {/* Debug Controls */}
                {(gutData || debugData) && (
                  <div className="mt-6 flex gap-4 justify-center">
                    <button
                      onClick={() => setShowDebugger(!showDebugger)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      {showDebugger ? '🔧 Hide Debugger' : '🛠️ Show Extraction Debugger'}
                    </button>
                    {currentFile && (
                      <button
                        onClick={() => handleFileUpload(currentFile)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        disabled={loading}
                      >
                        🔄 Reprocess with Current Method
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Advanced Debugger */}
            {showDebugger && debugData && (
              <div className="mb-8">
                <ExtractionDebugger 
                  extractionData={debugData}
                  onReprocess={() => currentFile && handleFileUpload(currentFile)}
                />
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{error}</p>
              </div>
            )}
            
            {/* Dynamic Report Display */}
            {gutData && renderDynamicReport(gutData)}

          </div>
        </div>
      </div>

      <ChartJSLoader />
    </>
  );
}

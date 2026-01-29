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
    console.log('🔍 DEBUG: Raw text length:', text.length);
    console.log('🔍 DEBUG: Text preview (first 500 chars):', text.substring(0, 500));
    console.log('🔍 DEBUG: Contains PROVA COPROLÓGICA:', text.includes('PROVA COPROLÓGICA FUNCIONAL'));
    console.log('🔍 DEBUG: Contains BIOMARCADORES:', text.includes('BIOMARCADORES'));
    console.log('🔍 DEBUG: Contains CALPROTECTINA:', text.includes('CALPROTECTINA'));
    console.log('🔍 DEBUG: Contains SEQUENCIAMENTO:', text.includes('SEQUENCIAMENTO GENÉTICO'));
    
    const data = {
      testType: 'gut_health',
      patientInfo: {},
      functionalTests: {},
      biomarkers: {},
      microbiota: {
        protectiveBacteria: {},
        pathogenicBacteria: {},
        atypicalFindings: {}
      },
      summary: {}
    };

    // Extract patient info - improved patterns for cleaner extraction
    const patientNameMatch = text.match(/(?:Paciente:?\s*)?([A-ZÁÊÔÂÍÚÇ\s]+?)(?:\s+Protocolo|$)/);
    if (patientNameMatch) {
      data.patientInfo.name = patientNameMatch[1].trim();
    }

    const ageMatch = text.match(/Idade:\s*(\d+)\s*anos/);
    if (ageMatch) data.patientInfo.age = parseInt(ageMatch[1]);

    // Clean date extraction - just get the date part
    const dateMatch = text.match(/Data da coleta:\s*(\d{2}\/\d{2}\/\d{4})/);
    if (dateMatch) data.patientInfo.collectionDate = dateMatch[1];

    // Check if this is a functional tests report or just microbiota
    const hasFunctionalTests = text.includes('PROVA COPROLÓGICA FUNCIONAL');
    const hasBiomarkers = text.includes('BIOMARCADORES') || text.includes('CALPROTECTINA');

    // Extract functional coprological tests if present
    if (hasFunctionalTests) {
      const functionalSection = text.match(/PROVA COPROLÓGICA FUNCIONAL([\s\S]*?)(?:BIOMARCADORES|$)/);
      if (functionalSection) {
        const functionalText = functionalSection[1];
        
        // Parse all functional test indicators
        const consistencyMatch = functionalText.match(/CONSISTÊNCIA\s+([^\s\n\r]+)/);
        if (consistencyMatch) data.functionalTests.consistency = consistencyMatch[1];

        const pHMatch = functionalText.match(/pH\s+([\d,]+)/);
        if (pHMatch) data.functionalTests.pH = pHMatch[1];

        const neutralFatsMatch = functionalText.match(/GORDURAS NEUTRAS\s+([^\s\n\r]+)/);
        if (neutralFatsMatch) data.functionalTests.neutralFats = neutralFatsMatch[1];

        const foreignBodiesMatch = functionalText.match(/CORPOS ESTRANHOS\s+([^\s\n\r]+)/);
        if (foreignBodiesMatch) data.functionalTests.foreignBodies = foreignBodiesMatch[1];

        const muscleUndigestedMatch = functionalText.match(/FIBRAS MUSCULARES MAL DIGERIDAS\s+([^\s\n\r]+)/);
        if (muscleUndigestedMatch) data.functionalTests.muscleUndigested = muscleUndigestedMatch[1];

        const muscleDigestedMatch = functionalText.match(/FIBRAS MUSCULARES BEM DIGERIDAS\s+([^\s\n\r]+)/);
        if (muscleDigestedMatch) data.functionalTests.muscleDigested = muscleDigestedMatch[1];

        const starchMatch = functionalText.match(/AMIDO\s+([^\s\n\r]+)/);
        if (starchMatch) data.functionalTests.starch = starchMatch[1];

        const celluloseMatch = functionalText.match(/CELULOSE\s+([^\s\n\r]+)/);
        if (celluloseMatch) data.functionalTests.cellulose = celluloseMatch[1];

        const crystalsMatch = functionalText.match(/CRISTAIS\s+([^\s\n\r*]+)/);
        if (crystalsMatch) data.functionalTests.crystals = crystalsMatch[1];

        const redBloodCellsMatch = functionalText.match(/HEMÁCIAS\s+([^\s\n\r]+)/);
        if (redBloodCellsMatch) data.functionalTests.redBloodCells = redBloodCellsMatch[1];

        const leukocytesMatch = functionalText.match(/LEUCÓCITOS\s+([^\s\n\r]+)/);
        if (leukocytesMatch) data.functionalTests.leukocytes = leukocytesMatch[1];

        const iodophilicFloraMatch = functionalText.match(/FLORA IODÓFILA\s+([^\s\n\r]+)/);
        if (iodophilicFloraMatch) data.functionalTests.iodophilicFlora = iodophilicFloraMatch[1];

        const protozoaCystsMatch = functionalText.match(/CISTOS DE PROTOZOÁRIOS\s+([^\s\n\r]+)/);
        if (protozoaCystsMatch) data.functionalTests.protozoaCysts = protozoaCystsMatch[1];

        const helminthEggsMatch = functionalText.match(/OVOS DE HELMINTOS\s+([^\s\n\r]+)/);
        if (helminthEggsMatch) data.functionalTests.helminthEggs = helminthEggsMatch[1];

        const larvaeEggsMatch = functionalText.match(/OVOS DE LARVAS\s+([^\s\n\r]+)/);
        if (larvaeEggsMatch) data.functionalTests.larvaeEggs = larvaeEggsMatch[1];
      }
    }

  // Extract biomarkers if present
  if (hasBiomarkers) {
    const calprotectinMatch = text.match(/CALPROTECTINA\s+([\d,]+)\s*(?:ug|μg)\/g/i);
    if (calprotectinMatch) data.biomarkers.calprotectin = parseFloat(calprotectinMatch[1].replace(',', '.'));

    // Enhanced zonulin pattern - handle value on line before ZONULINA
    const zonulinMatch = text.match(/(\d+[,.]?\d*)\s*ng\/mL[\s\n\r]*ZONULINA/i) || 
                        text.match(/ZONULINA[\s\S]*?(\d+[,.]?\d*)\s*ng\/mL/i);
    if (zonulinMatch) data.biomarkers.zonulin = parseFloat(zonulinMatch[1].replace(',', '.'));

    const elastaseMatch = text.match(/ELASTASE PANCREÁTICA\s+>?([\d,]+)\s*(?:μg|ug)\/g/i);
    if (elastaseMatch) data.biomarkers.elastase = parseFloat(elastaseMatch[1].replace(',', '.'));

    const fattyAcidsMatch = text.match(/ÁCIDOS GRAXOS FECAIS\s+([^\s\n\r]+)/);
    if (fattyAcidsMatch) data.biomarkers.fattyAcids = fattyAcidsMatch[1];
  }    // Extract microbiota data - enhanced patterns
    const abundanceMatch = text.match(/Abundância.*?F\+B\s+([\d,]+)%/);
    if (abundanceMatch) data.microbiota.abundance = parseFloat(abundanceMatch[1].replace(',', '.'));

    const proportionMatch = text.match(/Proporção.*?F\/B\s+([\d,]+)/);
    if (proportionMatch) data.microbiota.proportion = parseFloat(proportionMatch[1].replace(',', '.'));

    const diversityMatch = text.match(/DIVERSIDADE\s+([\d,]+)/);
    if (diversityMatch) data.microbiota.diversity = parseFloat(diversityMatch[1].replace(',', '.'));

    const richnessMatch = text.match(/RIQUEZA\s+(\d+)/);
    if (richnessMatch) data.microbiota.richness = parseInt(richnessMatch[1]);

    // Extract distribution
    const distributionMatch = text.match(/DISTRIBUIÇÃO\s+([^\s\n\r]+)/);
    if (distributionMatch) data.microbiota.distribution = distributionMatch[1];

    // Extract protective bacteria
    data.microbiota.protectiveBacteria = {};
    const akkermansiMatch = text.match(/Akkermansia muciniphila\s+([\d,]+)%/);
    if (akkermansiMatch) data.microbiota.protectiveBacteria.akkermansia = parseFloat(akkermansiMatch[1].replace(',', '.'));

    const eubacteriumMatch = text.match(/Eubacterium rectale\s+([\d,]+)%/);
    if (eubacteriumMatch) data.microbiota.protectiveBacteria.eubacterium = parseFloat(eubacteriumMatch[1].replace(',', '.'));

    const faecalibacteriumMatch = text.match(/Faecalibacterium prausnitzii\s+([\d,]+)%/);
    if (faecalibacteriumMatch) data.microbiota.protectiveBacteria.faecalibacterium = parseFloat(faecalibacteriumMatch[1].replace(',', '.'));

    const bifidobacteriumMatch = text.match(/Bifidobacterium spp\s+([\d,]+)%/);
    if (bifidobacteriumMatch) data.microbiota.protectiveBacteria.bifidobacterium = parseFloat(bifidobacteriumMatch[1].replace(',', '.'));

    // Extract pathogenic species
    const bacteroidesFragilisMatch = text.match(/Bacteroides fragilis\s+([\d,]+)%/);
    if (bacteroidesFragilisMatch) data.microbiota.pathogenicBacteria.bacteroidesFragilis = parseFloat(bacteroidesFragilisMatch[1].replace(',', '.'));

    const salmonellaMatch = text.match(/Salmonella spp\s+([\d,]+)%/);
    if (salmonellaMatch) data.microbiota.pathogenicBacteria.salmonella = parseFloat(salmonellaMatch[1].replace(',', '.'));

    // Extract atypical findings
    const bacteroidesMatch = text.match(/Bacteroides dorei\s+([\d,]+)%/);
    if (bacteroidesMatch) data.microbiota.atypicalFindings.bacteroidesDorei = parseFloat(bacteroidesMatch[1].replace(',', '.'));

    const bilophilaMatch = text.match(/Bilophila wadsworthia\s+([\d,]+)%/);
    if (bilophilaMatch) data.microbiota.atypicalFindings.bilophilaWadsworthia = parseFloat(bilophilaMatch[1].replace(',', '.'));

    const prevotellaCopriMatch = text.match(/Prevotella copri\s+([\d,]+)%/);
    if (prevotellaCopriMatch) data.microbiota.atypicalFindings.prevotellaCopri = parseFloat(prevotellaCopriMatch[1].replace(',', '.'));

    const phascolarctobacteriumMatch = text.match(/Phascolarctobacterium faecium\s+([\d,]+)%/);
    if (phascolarctobacteriumMatch) data.microbiota.atypicalFindings.phascolarctobacteriumFaecium = parseFloat(phascolarctobacteriumMatch[1].replace(',', '.'));

    // Extract additional genus distribution data
    data.microbiota.genusDistribution = {};
    const genusPatterns = [
      { pattern: /Prevotella\s+Bacteroidetes\s+([\d,]+)%/, key: 'prevotella', name: 'Prevotella' },
      { pattern: /Bacteroides\s+Bacteroidetes\s+([\d,]+)%/, key: 'bacteroides', name: 'Bacteroides' },
      { pattern: /Phascolarctobacterium\s+Firmicutes\s+([\d,]+)%/, key: 'phascolarctobacterium', name: 'Phascolarctobacterium' },
      { pattern: /Faecalibacterium\s+Firmicutes\s+([\d,]+)%/, key: 'faecalibacterium', name: 'Faecalibacterium' },
      { pattern: /Alistipes\s+Bacteroidetes\s+([\d,]+)%/, key: 'alistipes', name: 'Alistipes' },
      { pattern: /Prevotellamassilia\s+Bacteroidetes\s+([\d,]+)%/, key: 'prevotellamassilia', name: 'Prevotellamassilia' },
      { pattern: /Parasutterella\s+Proteobacteria\s+([\d,]+)%/, key: 'parasutterella', name: 'Parasutterella' },
      { pattern: /Akkermansia\s+Verrucomicrobia\s+([\d,]+)%/, key: 'akkermansia', name: 'Akkermansia' },
      { pattern: /Roseburia\s+Firmicutes\s+([\d,]+)%/, key: 'roseburia', name: 'Roseburia' },
      { pattern: /Ruminococcus\s+Firmicutes\s+([\d,]+)%/, key: 'ruminococcus', name: 'Ruminococcus' }
    ];

    genusPatterns.forEach(genus => {
      const match = text.match(genus.pattern);
      if (match) {
        data.microbiota.genusDistribution[genus.key] = parseFloat(match[1].replace(',', '.'));
      }
    });

    // Extract phylo composition data
    data.microbiota.phyloComposition = {};
    const phyloPatterns = [
      { pattern: /Bacteroidetes\s+([\d,]+)%/, key: 'bacteroidetes', name: 'Bacteroidetes' },
      { pattern: /Firmicutes\s+([\d,]+)%/, key: 'firmicutes', name: 'Firmicutes' },
      { pattern: /Proteobacteria\s+([\d,]+)%/, key: 'proteobacteria', name: 'Proteobacteria' },
      { pattern: /Verrucomicrobia\s+([\d,]+)%/, key: 'verrucomicrobia', name: 'Verrucomicrobia' },
      { pattern: /Actinobacteria\s+([\d,]+)%/, key: 'actinobacteria', name: 'Actinobacteria' }
    ];

    phyloPatterns.forEach(phylo => {
      const match = text.match(phylo.pattern);
      if (match) {
        data.microbiota.phyloComposition[phylo.key] = parseFloat(match[1].replace(',', '.'));
      }
    });

    // Add report type information
    data.summary.reportType = [];
    if (hasFunctionalTests) data.summary.reportType.push('Functional Tests');
    if (hasBiomarkers) data.summary.reportType.push('Biomarkers');
    if (Object.keys(data.microbiota).length > 0) data.summary.reportType.push('Microbiota Sequencing');

    console.log('🔍 DEBUG: Final parsed data:');
    console.log('🔍 DEBUG: Functional tests count:', Object.keys(data.functionalTests).length);
    console.log('🔍 DEBUG: Biomarkers count:', Object.keys(data.biomarkers).length);
    console.log('🔍 DEBUG: Microbiota count:', Object.keys(data.microbiota).length);
    console.log('🔍 DEBUG: Report types:', data.summary.reportType);
    console.log('🔍 DEBUG: hasFunctionalTests flag:', hasFunctionalTests);
    console.log('🔍 DEBUG: hasBiomarkers flag:', hasBiomarkers);

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
          
          {/* Debug Section - Show raw parsing info */}
          {gutData && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">🔍 Debug Info (Check Browser Console for Details)</h3>
              <div className="text-xs space-y-1">
                <p><strong>Functional Tests:</strong> {Object.keys(gutData.functionalTests || {}).length} fields detected</p>
                <p><strong>Biomarkers:</strong> {Object.keys(gutData.biomarkers || {}).length} fields detected</p>
                <p><strong>Microbiota:</strong> {Object.keys(gutData.microbiota || {}).length} fields detected</p>
                <p><strong>Report Types:</strong> {(gutData.summary?.reportType || []).join(', ')}</p>
                <button 
                  onClick={() => console.log('Full gutData:', gutData)}
                  className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  Log Full Data to Console
                </button>
              </div>
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

            {/* Report Type Information */}
            {gutData.summary && gutData.summary.reportType && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Report Type</h2>
                <div className="flex flex-wrap gap-2">
                  {gutData.summary.reportType.map((type, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {type}
                    </span>
                  ))}
                </div>
                {!gutData.summary.reportType.includes('Functional Tests') && !gutData.summary.reportType.includes('Biomarkers') && (
                  <p className="text-sm text-gray-600 mt-2">
                    This report contains microbiota sequencing data only. For complete digestive health assessment, 
                    upload a report that includes functional coprological tests and biomarkers.
                  </p>
                )}
              </div>
            )}

            {/* Report Type Alert */}
            {gutData.summary?.reportType?.length === 1 && gutData.summary.reportType[0] === 'Microbiota Sequencing' && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      📊 Microbiota-Only Report Detected
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>This PDF contains <strong>only microbiota sequencing data</strong>. Many labs provide separate reports for:</p>
                      <ul className="mt-2 list-disc list-inside space-y-1">
                        <li><strong>Functional Tests:</strong> Stool consistency, pH, digestive enzymes</li>
                        <li><strong>Biomarkers:</strong> Calprotectin, zonulin, inflammation markers</li>
                        <li><strong>Complete Checkup:</strong> All sections combined</li>
                      </ul>
                      <p className="mt-2 font-medium">💡 Check if your lab provided additional PDF files or request a "checkup intestinal completo"</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Patient Information */}
            {gutData.patientInfo && (Object.keys(gutData.patientInfo).length > 0) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">👤 Patient Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {gutData.patientInfo.name && (
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-semibold">{gutData.patientInfo.name}</p>
                    </div>
                  )}
                  {gutData.patientInfo.age && (
                    <div>
                      <p className="text-sm text-gray-600">Age</p>
                      <p className="font-semibold">{gutData.patientInfo.age} years</p>
                    </div>
                  )}
                  {gutData.patientInfo.collectionDate && (
                    <div>
                      <p className="text-sm text-gray-600">Collection Date</p>
                      <p className="font-semibold">{gutData.patientInfo.collectionDate}</p>
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
                    {gutData.biomarkers.calprotectin !== undefined && (
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
                        <span className="font-semibold">{gutData.biomarkers.elastase > 800 ? '>800' : gutData.biomarkers.elastase} μg/g</span>
                      </div>
                    )}
                    {gutData.biomarkers.fattyAcids && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-700">Fatty Acids</span>
                        <span className="font-semibold">{gutData.biomarkers.fattyAcids}</span>
                      </div>
                    )}
                    {Object.keys(gutData.biomarkers).length === 0 && (
                      <div className="text-center text-gray-500 py-4">
                        <p className="text-sm">No biomarkers in this report</p>
                        <p className="text-xs">Upload a complete intestinal checkup for biomarker analysis</p>
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
                    {gutData.microbiota.proportion && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-700">F/B Proportion</span>
                        <span className="font-semibold">{gutData.microbiota.proportion}</span>
                      </div>
                    )}
                    {gutData.microbiota.distribution && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-700">Distribution</span>
                        <span className={`font-semibold ${gutData.microbiota.distribution === 'Atipica' ? 'text-amber-600' : 'text-green-600'}`}>
                          {gutData.microbiota.distribution}
                        </span>
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
                  <div className="space-y-2 text-sm">
                    {gutData.functionalTests.consistency && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Consistency</span>
                        <span className={`font-semibold ${gutData.functionalTests.consistency === 'Pastosa' ? 'text-red-600' : 'text-green-600'}`}>
                          {gutData.functionalTests.consistency}
                        </span>
                      </div>
                    )}
                    {gutData.functionalTests.pH && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">pH</span>
                        <span className="font-semibold text-green-600">{gutData.functionalTests.pH}</span>
                      </div>
                    )}
                    {gutData.functionalTests.neutralFats && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Neutral Fats</span>
                        <span className={`font-semibold ${gutData.functionalTests.neutralFats === 'Presente' ? 'text-red-600' : 'text-green-600'}`}>
                          {gutData.functionalTests.neutralFats}
                        </span>
                      </div>
                    )}
                    {gutData.functionalTests.foreignBodies && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Foreign Bodies</span>
                        <span className={`font-semibold ${gutData.functionalTests.foreignBodies === 'Ausente' ? 'text-green-600' : 'text-red-600'}`}>
                          {gutData.functionalTests.foreignBodies}
                        </span>
                      </div>
                    )}
                    {gutData.functionalTests.crystals && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Crystals</span>
                        <span className={`font-semibold ${gutData.functionalTests.crystals === 'Presente' ? 'text-red-600' : 'text-green-600'}`}>
                          {gutData.functionalTests.crystals}
                        </span>
                      </div>
                    )}
                    {Object.keys(gutData.functionalTests).length === 0 && (
                      <div className="text-center text-gray-500 py-4">
                        <p className="text-sm">No functional tests in this report</p>
                        <p className="text-xs">Upload a complete intestinal checkup for functional analysis</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Bacterial Analysis */}
            {(gutData.microbiota.protectiveBacteria || gutData.microbiota.pathogenicBacteria || gutData.microbiota.atypicalFindings) && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Bacterial Analysis</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Protective Bacteria */}
                  {gutData.microbiota.protectiveBacteria && Object.keys(gutData.microbiota.protectiveBacteria).length > 0 && (
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="mr-2">✅</span>
                        Protective Bacteria
                      </h3>
                      <div className="space-y-3">
                        {gutData.microbiota.protectiveBacteria.akkermansia !== undefined && (
                          <div className="border-l-4 border-green-500 pl-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-900">Akkermansia muciniphila</span>
                              <span className="font-bold text-green-600">{gutData.microbiota.protectiveBacteria.akkermansia}%</span>
                            </div>
                            <p className="text-xs text-gray-600">Gut barrier & metabolism</p>
                          </div>
                        )}
                        {gutData.microbiota.protectiveBacteria.faecalibacterium !== undefined && (
                          <div className="border-l-4 border-green-500 pl-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-900">Faecalibacterium prausnitzii</span>
                              <span className="font-bold text-green-600">{gutData.microbiota.protectiveBacteria.faecalibacterium}%</span>
                            </div>
                            <p className="text-xs text-gray-600">Anti-inflammatory butyrate</p>
                          </div>
                        )}
                        {gutData.microbiota.protectiveBacteria.bifidobacterium !== undefined && (
                          <div className="border-l-4 border-yellow-500 pl-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-900">Bifidobacterium spp</span>
                              <span className={`font-bold ${gutData.microbiota.protectiveBacteria.bifidobacterium < 1 ? 'text-red-600' : 'text-green-600'}`}>
                                {gutData.microbiota.protectiveBacteria.bifidobacterium}%
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">Immune support & lactose</p>
                          </div>
                        )}
                        {gutData.microbiota.protectiveBacteria.eubacterium !== undefined && (
                          <div className="border-l-4 border-red-500 pl-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-900">Eubacterium rectale</span>
                              <span className={`font-bold ${gutData.microbiota.protectiveBacteria.eubacterium < 1 ? 'text-red-600' : 'text-green-600'}`}>
                                {gutData.microbiota.protectiveBacteria.eubacterium}%
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">Butyrate production</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pathogenic Bacteria */}
                  {gutData.microbiota.pathogenicBacteria && Object.keys(gutData.microbiota.pathogenicBacteria).length > 0 && (
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="mr-2">⚠️</span>
                        Pathogenic Species
                      </h3>
                      <div className="space-y-3">
                        {gutData.microbiota.pathogenicBacteria.bacteroidesFragilis !== undefined && (
                          <div className="border-l-4 border-green-500 pl-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-900">Bacteroides fragilis</span>
                              <span className="font-bold text-green-600">{gutData.microbiota.pathogenicBacteria.bacteroidesFragilis}%</span>
                            </div>
                            <p className="text-xs text-gray-600">Within safe limits (&lt;0.5%)</p>
                          </div>
                        )}
                        {gutData.microbiota.pathogenicBacteria.salmonella !== undefined && (
                          <div className="border-l-4 border-green-500 pl-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-900">Salmonella spp</span>
                              <span className="font-bold text-green-600">{gutData.microbiota.pathogenicBacteria.salmonella}%</span>
                            </div>
                            <p className="text-xs text-gray-600">Minimal presence</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Atypical Findings */}
                  {gutData.microbiota.atypicalFindings && Object.keys(gutData.microbiota.atypicalFindings).length > 0 && (
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="mr-2">🔍</span>
                        Atypical Findings
                      </h3>
                      <div className="space-y-3">
                        {gutData.microbiota.atypicalFindings.bacteroidesDorei !== undefined && (
                          <div className="border-l-4 border-blue-500 pl-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-900">Bacteroides dorei</span>
                              <span className="font-bold text-blue-600">{gutData.microbiota.atypicalFindings.bacteroidesDorei}%</span>
                            </div>
                            <p className="text-xs text-gray-600">Elevated presence</p>
                          </div>
                        )}
                        {gutData.microbiota.atypicalFindings.bilophilaWadsworthia !== undefined && (
                          <div className="border-l-4 border-red-500 pl-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-900">Bilophila wadsworthia</span>
                              <span className="font-bold text-red-600">{gutData.microbiota.atypicalFindings.bilophilaWadsworthia}%</span>
                            </div>
                            <p className="text-xs text-gray-600">Above desired (&lt;0.1%)</p>
                          </div>
                        )}
                        {gutData.microbiota.atypicalFindings.prevotellaCopri !== undefined && (
                          <div className="border-l-4 border-amber-500 pl-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-900">Prevotella copri</span>
                              <span className="font-bold text-amber-600">{gutData.microbiota.atypicalFindings.prevotellaCopri}%</span>
                            </div>
                            <p className="text-xs text-gray-600">High abundance</p>
                          </div>
                        )}
                        {gutData.microbiota.atypicalFindings.phascolarctobacteriumFaecium !== undefined && (
                          <div className="border-l-4 border-purple-500 pl-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-900">Phascolarctobacterium faecium</span>
                              <span className="font-bold text-purple-600">{gutData.microbiota.atypicalFindings.phascolarctobacteriumFaecium}%</span>
                            </div>
                            <p className="text-xs text-gray-600">Notable presence</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Genus Distribution */}
            {gutData.microbiota.genusDistribution && Object.keys(gutData.microbiota.genusDistribution).length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Genus Distribution</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(gutData.microbiota.genusDistribution)
                    .sort(([,a], [,b]) => b - a) // Sort by percentage descending
                    .map(([genus, percentage]) => {
                      const getGenusColor = (genus, percentage) => {
                        if (percentage > 15) return 'border-red-300 bg-red-50 text-red-800';
                        if (percentage > 10) return 'border-amber-300 bg-amber-50 text-amber-800';
                        if (percentage > 5) return 'border-blue-300 bg-blue-50 text-blue-800';
                        return 'border-green-300 bg-green-50 text-green-800';
                      };

                      const formatGenusName = (genus) => {
                        const nameMap = {
                          prevotella: 'Prevotella',
                          bacteroides: 'Bacteroides',
                          phascolarctobacterium: 'Phascolarctobacterium',
                          faecalibacterium: 'Faecalibacterium',
                          alistipes: 'Alistipes',
                          prevotellamassilia: 'Prevotellamassilia',
                          parasutterella: 'Parasutterella',
                          akkermansia: 'Akkermansia',
                          roseburia: 'Roseburia',
                          ruminococcus: 'Ruminococcus'
                        };
                        return nameMap[genus] || genus.charAt(0).toUpperCase() + genus.slice(1);
                      };

                      return (
                        <div key={genus} className={`p-4 rounded-lg border-2 ${getGenusColor(genus, percentage)}`}>
                          <div className="text-sm font-medium">{formatGenusName(genus)}</div>
                          <div className="text-2xl font-bold">{percentage}%</div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Phylo Composition */}
            {gutData.microbiota.phyloComposition && Object.keys(gutData.microbiota.phyloComposition).length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Phylum Composition</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(gutData.microbiota.phyloComposition)
                    .sort(([,a], [,b]) => b - a) // Sort by percentage descending
                    .map(([phylum, percentage]) => {
                      const getPhylumColor = (phylum) => {
                        const colors = {
                          bacteroidetes: 'border-blue-300 bg-blue-50 text-blue-800',
                          firmicutes: 'border-green-300 bg-green-50 text-green-800',
                          proteobacteria: 'border-red-300 bg-red-50 text-red-800',
                          verrucomicrobia: 'border-purple-300 bg-purple-50 text-purple-800',
                          actinobacteria: 'border-amber-300 bg-amber-50 text-amber-800'
                        };
                        return colors[phylum] || 'border-gray-300 bg-gray-50 text-gray-800';
                      };

                      const formatPhylumName = (phylum) => {
                        return phylum.charAt(0).toUpperCase() + phylum.slice(1);
                      };

                      return (
                        <div key={phylum} className={`p-4 rounded-lg border-2 ${getPhylumColor(phylum)}`}>
                          <div className="text-sm font-medium">{formatPhylumName(phylum)}</div>
                          <div className="text-2xl font-bold">{percentage}%</div>
                          <div className="text-xs text-gray-600 mt-1">
                            {phylum === 'bacteroidetes' && 'Immune modulation'}
                            {phylum === 'firmicutes' && 'Energy metabolism'}
                            {phylum === 'proteobacteria' && 'Potential inflammation'}
                            {phylum === 'verrucomicrobia' && 'Mucin degradation'}
                            {phylum === 'actinobacteria' && 'Vitamin synthesis'}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Complete Functional Tests */}
            {gutData.functionalTests && Object.keys(gutData.functionalTests).length > 5 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Functional Coprological Analysis</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(gutData.functionalTests).map(([key, value]) => {
                    if (!value) return null;
                    
                    const getStatusColor = (key, value) => {
                      const abnormal = ['Presente', 'Pastosa'];
                      const normal = ['Ausente', 'Normal'];
                      
                      if (key === 'consistency' && value === 'Pastosa') return 'text-red-600 bg-red-50';
                      if (key === 'neutralFats' && value === 'Presente') return 'text-red-600 bg-red-50';
                      if (key === 'crystals' && value === 'Presente') return 'text-red-600 bg-red-50';
                      if (normal.includes(value)) return 'text-green-600 bg-green-50';
                      if (key === 'pH') return 'text-green-600 bg-green-50';
                      return 'text-gray-600 bg-gray-50';
                    };

                    const formatKey = (key) => {
                      const keyMap = {
                        consistency: 'Consistency',
                        pH: 'pH',
                        neutralFats: 'Neutral Fats',
                        foreignBodies: 'Foreign Bodies',
                        muscleUndigested: 'Muscle Fibers (Undigested)',
                        muscleDigested: 'Muscle Fibers (Digested)',
                        starch: 'Starch',
                        cellulose: 'Cellulose',
                        crystals: 'Crystals',
                        redBloodCells: 'Red Blood Cells',
                        leukocytes: 'Leukocytes',
                        iodophilicFlora: 'Iodophilic Flora',
                        protozoaCysts: 'Protozoa Cysts',
                        helminthEggs: 'Helminth Eggs',
                        larvaeEggs: 'Larvae Eggs'
                      };
                      return keyMap[key] || key;
                    };

                    return (
                      <div key={key} className={`p-3 rounded-lg border ${getStatusColor(key, value)}`}>
                        <div className="text-sm font-medium text-gray-900">{formatKey(key)}</div>
                        <div className="text-lg font-bold">{value}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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

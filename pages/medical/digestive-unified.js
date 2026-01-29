import React, { useState, useEffect, useMemo } from "react";
import Script from "next/script";
import dynamic from "next/dynamic";
import { GUT_HEALTH_ANALYSIS_PROMPT } from "../../lib/ai-prompts";

// Avoid SSR issues for the AI analysis component
const SmartBlurb = dynamic(() => import("../../components/SmartBlurb"), { ssr: false });

export default function DigestiveUnifiedPage() {
  const [gutData, setGutData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [rawPdfText, setRawPdfText] = useState("");

  // Enhanced AI-powered PDF processing function
  const parseDigestiveData = async (text) => {
    console.log("Starting enhanced AI-powered parsing of digestive data...");

    try {
      // Split the text into pages based on patient name repetition
      const pages = splitIntoPages(text);
      console.log(`Detected ${pages.length} pages in the PDF`);

      // Extract patient information from page 2 (index 1)
      const patientInfo = extractPatientInfo(pages[1] || text);
      console.log("Extracted patient info:", patientInfo);

      // Extract digestive analysis (ChatGP Intestinal)
      const digestiveAnalysis = extractDigestiveAnalysis(text);
      console.log("Extracted digestive analysis:", digestiveAnalysis);

      // Extract biomarkers
      const biomarkers = extractBiomarkers(text);
      console.log("Extracted biomarkers:", biomarkers);

      // Extract phylogenic analysis
      const phylogenicData = extractPhylogenicData(text);
      console.log("Extracted phylogenic data:", phylogenicData);

      // Extract detailed bacteria list (from page 15+)
      const bacteriaList = await extractDetailedBacteriaList(text);
      console.log(`Extracted ${bacteriaList.length} bacteria from detailed list`);

      // Process remaining text chunks for additional organisms
      const chunks = splitTextIntoChunks(text, 500);
      console.log(`Split text into ${chunks.length} chunks for AI processing`);

      const aiResults = [];
      
      for (let i = 0; i < chunks.length; i++) {
        console.log(`Processing chunk ${i + 1}/${chunks.length}...`);
        
        try {
          const chunkResults = await processChunkWithAI(chunks[i]);
          if (chunkResults && chunkResults.length > 0) {
            aiResults.push(...chunkResults);
          }
        } catch (chunkError) {
          console.error(`Error processing chunk ${i + 1}:`, chunkError);
          // Continue processing other chunks even if one fails
        }
      }

      console.log(`AI processing complete. Found ${aiResults.length} organisms from AI`);

      // Combine structured bacteria list with AI results
      const allBacteria = [...bacteriaList, ...aiResults];

      // Deduplicate results by name (case insensitive)
      const uniqueResults = [];
      const seen = new Set();
      
      for (const item of allBacteria) {
        const key = item.name?.toLowerCase();
        if (key && !seen.has(key)) {
          seen.add(key);
          uniqueResults.push(item);
        }
      }

      console.log(`After deduplication: ${uniqueResults.length} unique organisms`);

      // Create categories for AI analysis
      const categorizedForAI = {};
      const categorizedBacteria = groupBacteriaByCategory(uniqueResults);
      
      Object.entries(categorizedBacteria).forEach(([category, bacteria]) => {
        categorizedForAI[category] = bacteria.map(b => `${b.name}: ${b.value}${b.unit || ''}`).join(', ');
      });

      return {
        bacteria: uniqueResults,
        patientInfo,
        digestiveAnalysis,
        biomarkers,
        phylogenicData,
        rawText: text,
        categorizedForAI,
        functionalTests: digestiveAnalysis, // Legacy compatibility
        pages: pages.length
      };

    } catch (error) {
      console.error("Error in enhanced AI-powered parsing:", error);
      throw new Error(`Enhanced AI parsing failed: ${error.message}`);
    }
  };

  // Split text into chunks of approximately targetWords
  const splitTextIntoChunks = (text, targetWords) => {
    const words = text.split(/\s+/);
    const chunks = [];
    
    for (let i = 0; i < words.length; i += targetWords) {
      const chunk = words.slice(i, i + targetWords).join(' ');
      if (chunk.trim()) {
        chunks.push(chunk);
      }
    }
    
    return chunks;
  };

  // Process a single text chunk with AI
  const processChunkWithAI = async (chunk) => {
    const prompt = `Extract all bacteria, microorganisms, and fungi mentioned in this medical text chunk. For each organism found, return a JSON array with objects containing 'name' (organism name), 'value' (numerical value if present), and 'unit' (unit of measurement if present).

Text chunk: "${chunk}"

Return only a valid JSON array, no explanations:`;

    try {
      const response = await fetch('/api/openai-extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Parse the JSON response
      let parsedData = [];
      try {
        parsedData = JSON.parse(data.extractedData);
      } catch (parseError) {
        console.warn('Could not parse AI response as JSON:', data.extractedData);
        return [];
      }

      // Validate the structure
      if (!Array.isArray(parsedData)) {
        console.warn('AI response is not an array:', parsedData);
        return [];
      }

      // Filter and validate items
      const validItems = parsedData.filter(item => 
        item && 
        typeof item.name === 'string' && 
        item.name.trim().length > 0
      ).map(item => ({
        name: item.name.trim(),
        value: item.value || 'Present',
        unit: item.unit || ''
      }));

      console.log(`Chunk processed: found ${validItems.length} organisms`);
      return validItems;

    } catch (error) {
      console.error('Error in processChunkWithAI:', error);
      throw error;
    }
  };

  // Split PDF text into pages based on patient name repetition
  const splitIntoPages = (text) => {
    // Look for page breaks indicated by patient name repetition
    const lines = text.split('\n');
    const pages = [];
    let currentPage = [];
    let patientName = null;

    for (const line of lines) {
      const pacienteMatch = line.match(/Paciente[:\s]+([A-ZÀ-ÿ\s]+)/i);
      
      if (pacienteMatch && patientName && pacienteMatch[1].trim() === patientName) {
        // New page detected
        if (currentPage.length > 0) {
          pages.push(currentPage.join('\n'));
          currentPage = [];
        }
      }
      
      if (pacienteMatch && !patientName) {
        patientName = pacienteMatch[1].trim();
      }
      
      currentPage.push(line);
    }
    
    if (currentPage.length > 0) {
      pages.push(currentPage.join('\n'));
    }
    
    return pages.length > 0 ? pages : [text];
  };

  // Extract patient information from page 2
  const extractPatientInfo = (pageText) => {
    const patientInfo = {};
    
    const patterns = {
      paciente: /Paciente[:\s]+([A-ZÀ-ÿ\s]+?)(?:\n|Protocolo)/i,
      protocolo: /Protocolo[:\s]+([^\n]+)/i,
      dataNascimento: /(?:Data\s+de\s+)?nascimento[:\s]+([^\n]+)/i,
      dataColeta: /(?:Data\s+(?:da\s+)?)?coleta[:\s]+([^\n]+)/i,
      prescritor: /Prescritor[:\s]+([A-ZÀ-ÿ\s]+?)(?:\n|Idade)/i,
      idade: /Idade[:\s]+([^\n]+)/i,
      peso: /Peso[:\s]+([^\n]+)/i,
      altura: /Altura[:\s]+([^\n]+)/i
    };

    for (const [key, pattern] of Object.entries(patterns)) {
      const match = pageText.match(pattern);
      if (match) {
        patientInfo[key] = match[1].trim();
      }
    }

    return patientInfo;
  };

  // Extract digestive analysis indicators
  const extractDigestiveAnalysis = (text) => {
    const analysis = {};
    
    // Look for "ChatGP Intestinal" section
    const intestinalSection = text.match(/ChatGP\s+Intestinal(.*?)(?=Biomarc|Sequenciamento|$)/is);
    if (!intestinalSection) return analysis;
    
    const sectionText = intestinalSection[1];
    
    const indicators = {
      consistencia: /Consistência[:\s]+([^\n]+)/i,
      pH: /pH[:\s]+([^\n]+)/i,
      gorduraNeutra: /(?:Gordura\s+neutra|Neutral\s+fats)[:\s]+([^\n]+)/i,
      corposEstranhos: /Corpos\s+estranhos[:\s]+([^\n]+)/i,
      fibrasMuscularesDigeridas: /Fibras\s+musculares\s+(?:bem\s+)?digeridas[:\s]+([^\n]+)/i,
      fibrasMuscularesNaoDigeridas: /Fibras\s+musculares\s+(?:mal\s+)?digeridas[:\s]+([^\n]+)/i,
      leveduras: /Leveduras[:\s]+([^\n]+)/i,
      parasitas: /Parasitas[:\s]+([^\n]+)/i,
      ovosHelmintos: /Ovos\s+de\s+helmintos[:\s]+([^\n]+)/i
    };

    for (const [key, pattern] of Object.entries(indicators)) {
      const match = sectionText.match(pattern);
      if (match) {
        analysis[key] = match[1].trim();
      }
    }

    return analysis;
  };

  // Extract biomarkers
  const extractBiomarkers = (text) => {
    const biomarkers = {};
    
    // Look for biomarkers section
    const biomarkersSection = text.match(/Biomarc(?:adores)?(.*?)(?=Sequenciamento|Análise|$)/is);
    if (!biomarkersSection) return biomarkers;
    
    const sectionText = biomarkersSection[1];
    
    const markers = {
      calprotectina: /Calprotectina[:\s]+([^\n]+)/i,
      zonulina: /Zonulina[:\s]+([^\n]+)/i,
      elastasePancreatica: /Elastase\s+pancreat[íi]ca[:\s]+([^\n]+)/i,
      lactoferrina: /Lactoferrina[:\s]+([^\n]+)/i,
      lisozima: /Lisozima[:\s]+([^\n]+)/i,
      alfaAntitripsina: /(?:Alfa|α)[-\s]*antitripsina[:\s]+([^\n]+)/i
    };

    for (const [key, pattern] of Object.entries(markers)) {
      const match = sectionText.match(pattern);
      if (match) {
        biomarkers[key] = match[1].trim();
      }
    }

    return biomarkers;
  };

  // Extract phylogenic data
  const extractPhylogenicData = (text) => {
    const phylogenic = {};
    
    // Look for "Análise de filo" section
    const phyloSection = text.match(/Análise\s+de\s+filo(.*?)(?=\n\s*\n|\n[A-Z])/is);
    if (!phyloSection) return phylogenic;
    
    const sectionText = phyloSection[1];
    
    const phyla = {
      bacteroidetes: /Bacteroidetes[:\s]+([^\n]+)/i,
      firmicutes: /Firmicutes[:\s]+([^\n]+)/i,
      proteobacteria: /Proteobacteria[:\s]+([^\n]+)/i,
      actinobacteria: /Actinobacteria[:\s]+([^\n]+)/i,
      verrucomicrobia: /Verrucomicrobia[:\s]+([^\n]+)/i
    };

    for (const [key, pattern] of Object.entries(phyla)) {
      const match = sectionText.match(pattern);
      if (match) {
        phylogenic[key] = match[1].trim();
      }
    }

    return phylogenic;
  };

  // Extract detailed bacteria list from structured table (page 15+)
  const extractDetailedBacteriaList = async (text) => {
    const bacteriaList = [];
    
    // Look for the structured bacteria table with 9 columns
    // Kingdom, Phylum, Class, Order, Family, Gender, Species, Quantity, Percent
    const lines = text.split('\n');
    let inBacteriaTable = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detect start of bacteria table (look for percentage patterns)
      if (line.match(/^\d+[,.]?\d*%/) || line.match(/\d{1,2}[,.]?\d{2}%/)) {
        inBacteriaTable = true;
      }
      
      if (inBacteriaTable && line) {
        // Parse table row: try to extract bacteria data
        const parts = line.split(/\s{2,}|\t/); // Split on multiple spaces or tabs
        
        // Look for percentage and quantity patterns
        const percentMatch = line.match(/(\d+[,.]?\d*)%/);
        const quantityMatch = line.match(/(\d+)\s+(\d+[,.]?\d*)%/);
        
        if (percentMatch && parts.length >= 7) {
          // Try to reconstruct the bacteria entry
          const percent = parseFloat(percentMatch[1].replace(',', '.'));
          let quantity = 'Present';
          
          if (quantityMatch) {
            quantity = parseInt(quantityMatch[1]);
          }
          
          // Extract species name (usually the most specific taxonomic level)
          let speciesName = '';
          
          // Look for scientific names in the line
          const scientificNameMatch = line.match(/([A-Z][a-z]+(?:\s+[a-z]+)*)/);
          if (scientificNameMatch) {
            speciesName = scientificNameMatch[1];
          }
          
          if (speciesName && percent > 0) {
            bacteriaList.push({
              name: speciesName,
              value: quantity,
              unit: quantity === 'Present' ? '' : ' organisms',
              percentage: percent,
              source: 'structured_table'
            });
          }
        }
        
        // Stop when percentages get very low or reach 0.00%
        if (line.includes('0,00%') || line.includes('0.00%')) {
          const zeroLines = lines.slice(i, i + 10).filter(l => l.includes('0,00%') || l.includes('0.00%')).length;
          if (zeroLines >= 5) {
            break; // Multiple zero entries, likely end of significant data
          }
        }
      }
    }
    
    console.log(`Extracted ${bacteriaList.length} bacteria from structured table`);
    return bacteriaList;
  };

  // Process the Laudo 2 PDF automatically
  const processLaudoPDF = async () => {
    if (!window.pdfjsLib || loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch('/laudo 2.pdf');
      if (!response.ok) {
        throw new Error(`Failed to load PDF: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      console.log(`Processing PDF with ${pdf.numPages} pages...`);
      
      let fullText = "";
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(" ");
        fullText += pageText + "\n";
      }
      
      console.log(`Extracted ${fullText.length} characters from PDF`);
      setRawPdfText(fullText);
      
      if (fullText.length < 100) {
        throw new Error("PDF appears to be empty or unreadable");
      }
      
      // Parse with AI
      const parsedData = await parseDigestiveData(fullText);
      setGutData(parsedData);
      
      console.log("Successfully processed laudo 2.pdf:", parsedData);
      
    } catch (error) {
      console.error("Error processing PDF:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-process when PDF.js loads
  useEffect(() => {
    if (pdfLoaded && !gutData && !loading) {
      processLaudoPDF();
    }
  }, [pdfLoaded, gutData, loading]);

  const clearData = () => {
    setGutData(null);
    setRawPdfText("");
    setError("");
    // Clear cache and reprocess
    localStorage.removeItem('digestive_unified_data');
    processLaudoPDF();
  };

  // Bacteria categorization function
  const groupBacteriaByCategory = (bacteria) => {
    const categories = {
      'Beneficial Bacteria': [],
      'Pathogenic Bacteria': [],
      'Fungi & Yeasts': [],
      'Other Microorganisms': []
    };

    bacteria.forEach(item => {
      const name = item.name.toLowerCase();
      
      if (name.includes('bifidobacterium') || name.includes('lactobacillus') || 
          name.includes('akkermansia') || name.includes('faecalibacterium')) {
        categories['Beneficial Bacteria'].push(item);
      } else if (name.includes('candida') || name.includes('saccharomyces') || 
                 name.includes('fungi') || name.includes('yeast')) {
        categories['Fungi & Yeasts'].push(item);
      } else if (name.includes('clostridium') || name.includes('salmonella') || 
                 name.includes('shigella') || name.includes('pathogen')) {
        categories['Pathogenic Bacteria'].push(item);
      } else {
        categories['Other Microorganisms'].push(item);
      }
    });

    // Remove empty categories
    return Object.fromEntries(
      Object.entries(categories).filter(([_, items]) => items.length > 0)
    );
  };

  // Icon for each category
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Beneficial Bacteria': return '🦠';
      case 'Pathogenic Bacteria': return '⚠️';
      case 'Fungi & Yeasts': return '🍄';
      case 'Other Microorganisms': return '🔬';
      default: return '📊';
    }
  };

  // AI prompts for different categories
  const gutHealthPrompts = useMemo(() => ({
    'Beneficial Bacteria': `Analyze these beneficial gut bacteria levels and provide health insights about gut microbiome balance, digestive health, and recommendations for maintaining healthy levels. Focus on probiotic benefits and gut health optimization.`,
    'Pathogenic Bacteria': `Analyze these pathogenic bacteria levels and provide health insights about potential infections, gut imbalance, and recommendations for treatment or monitoring. Focus on health risks and management strategies.`,
    'Fungi & Yeasts': `Analyze these fungal organisms and yeast levels in the gut. Provide insights about fungal overgrowth, candida issues, and recommendations for maintaining healthy fungal balance in the microbiome.`,
    'Other Microorganisms': `Analyze these microorganisms and provide insights about their role in gut health, potential benefits or concerns, and overall impact on digestive wellness.`
  }), []);

  // Color coding for abundance levels
  const getAbundanceColor = (value, unit) => {
    if (typeof value !== 'number') return 'bg-gray-400';
    if (value < 1000) return 'bg-green-400';
    if (value <= 10000) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  const getAbundanceLevel = (value) => {
    if (typeof value !== 'number') return { level: 'Present', color: 'text-gray-600 bg-gray-50' };
    if (value > 10000) return { level: 'High', color: 'text-rose-600 bg-rose-50' };
    if (value >= 1000) return { level: 'Moderate', color: 'text-amber-600 bg-amber-50' };
    return { level: 'Low', color: 'text-emerald-600 bg-emerald-50' };
  };

  return (
    <>
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
        onLoad={() => {
          if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
            setPdfLoaded(true);
          }
        }}
      />

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Digestive System Analysis</h1>
              <p className="text-gray-600 mt-2">Automated analysis of laudo 2.pdf - bacteria extraction and microbiome composition</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                🦠 Microbiome Analysis
              </span>
            </div>
          </div>

          {/* Processing Status Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Laudo 2 Analysis Status</h2>
              {gutData && (
                <span className="text-sm text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                  ✓ Analysis Complete
                </span>
              )}
            </div>

            <div className="border border-gray-200 rounded-xl p-8 text-center">
              {loading && (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
                  <p className="text-gray-600">Processing laudo 2.pdf...</p>
                </div>
              )}

              {!loading && gutData && (
                <div className="flex flex-col items-center">
                  <div className="text-green-600 text-4xl mb-4">✅</div>
                  <p className="text-gray-900 font-medium mb-2">Analysis Complete</p>
                  <p className="text-gray-600">Successfully processed laudo 2.pdf and extracted microbiome data</p>
                  <button
                    onClick={clearData}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-600 bg-red-50 hover:bg-red-100"
                  >
                    🔄 Reprocess File
                  </button>
                </div>
              )}

              {!loading && !gutData && !pdfLoaded && (
                <div className="flex flex-col items-center">
                  <div className="animate-pulse text-amber-600 text-4xl mb-4">⏳</div>
                  <p className="text-amber-600">Loading PDF processing library...</p>
                </div>
              )}

              {!loading && !gutData && pdfLoaded && (
                <div className="flex flex-col items-center">
                  <div className="text-blue-600 text-4xl mb-4">📄</div>
                  <p className="text-gray-900 font-medium mb-2">Ready to Process</p>
                  <p className="text-gray-600">PDF library loaded, processing will begin automatically</p>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
                <button
                  onClick={() => {
                    setError("");
                    processLaudoPDF();
                  }}
                  className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  Retry Processing
                </button>
              </div>
            )}
          </div>

          {gutData && (
            <>
              {/* Raw PDF Text */}
              {rawPdfText && (
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Raw PDF Text</h2>
                  <textarea
                    value={rawPdfText}
                    readOnly
                    className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm"
                  />
                </div>
              )}

              {/* Analysis Summary */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg p-8 mb-8 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Analysis Summary</h2>
                    <p className="text-blue-100">Comprehensive digestive health report processed</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{gutData.bacteria.length}</div>
                    <div className="text-blue-100 text-sm">Total Organisms</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold">{gutData.pages || 22}</div>
                    <div className="text-blue-100 text-sm">PDF Pages</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold">
                      {Object.keys(gutData.digestiveAnalysis || {}).length}
                    </div>
                    <div className="text-blue-100 text-sm">Digestive Tests</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold">
                      {Object.keys(gutData.biomarkers || {}).length}
                    </div>
                    <div className="text-blue-100 text-sm">Biomarkers</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold">
                      {Object.keys(gutData.phylogenicData || {}).length}
                    </div>
                    <div className="text-blue-100 text-sm">Phyla Analyzed</div>
                  </div>
                </div>
              </div>

              {/* Patient Information */}
              {gutData.patientInfo && Object.keys(gutData.patientInfo).length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                  <div className="flex items-center mb-6">
                    <span className="text-3xl mr-4">👤</span>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Patient Information</h2>
                      <p className="text-gray-600">Demographic and collection details</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {gutData.patientInfo.paciente && (
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <span className="text-sm text-green-600 font-medium">Patient</span>
                        <p className="font-semibold text-gray-900">{gutData.patientInfo.paciente}</p>
                      </div>
                    )}
                    {gutData.patientInfo.protocolo && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="text-sm text-blue-600 font-medium">Protocol</span>
                        <p className="font-semibold text-gray-900">{gutData.patientInfo.protocolo}</p>
                      </div>
                    )}
                    {gutData.patientInfo.dataNascimento && (
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <span className="text-sm text-purple-600 font-medium">Date of Birth</span>
                        <p className="font-semibold text-gray-900">{gutData.patientInfo.dataNascimento}</p>
                      </div>
                    )}
                    {gutData.patientInfo.dataColeta && (
                      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <span className="text-sm text-yellow-600 font-medium">Collection Date</span>
                        <p className="font-semibold text-gray-900">{gutData.patientInfo.dataColeta}</p>
                      </div>
                    )}
                    {gutData.patientInfo.idade && (
                      <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
                        <span className="text-sm text-pink-600 font-medium">Age</span>
                        <p className="font-semibold text-gray-900">{gutData.patientInfo.idade}</p>
                      </div>
                    )}
                    {gutData.patientInfo.prescritor && (
                      <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                        <span className="text-sm text-indigo-600 font-medium">Prescriber</span>
                        <p className="font-semibold text-gray-900">{gutData.patientInfo.prescritor}</p>
                      </div>
                    )}
                    {gutData.patientInfo.peso && (
                      <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                        <span className="text-sm text-cyan-600 font-medium">Weight</span>
                        <p className="font-semibold text-gray-900">{gutData.patientInfo.peso}</p>
                      </div>
                    )}
                    {gutData.patientInfo.altura && (
                      <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                        <span className="text-sm text-teal-600 font-medium">Height</span>
                        <p className="font-semibold text-gray-900">{gutData.patientInfo.altura}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Microbiome Analysis Summary */}
              {gutData.bacteria && gutData.bacteria.length > 0 && (
                <div className="space-y-8">
                  <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-gray-900">Microbiome Analysis by Category</h2>
                      <button
                        onClick={() => {
                          // Clear all digestive analysis cache
                          const keysToRemove = [];
                          for (let i = 0; i < localStorage.length; i++) {
                            const key = localStorage.key(i);
                            if (key && key.includes('digestive_unified')) {
                              keysToRemove.push(key);
                            }
                          }
                          keysToRemove.forEach(key => localStorage.removeItem(key));
                          console.log(`Cleared ${keysToRemove.length} digestive analysis cache entries`);
                          // Force page refresh to regenerate all analyses
                          window.location.reload();
                        }}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium"
                        title="Refresh All AI Analyses"
                      >
                        🔄 Refresh All AI
                      </button>
                    </div>
                    <p className="text-gray-600 mb-6">
                      Analysis of {gutData.bacteria.length} microorganisms detected in your digestive system
                    </p>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white">
                        <div className="text-2xl font-bold">
                          {gutData.bacteria?.filter(item => typeof item.value === 'number' && item.value < 1000).length || 0}
                        </div>
                        <div className="text-green-100 text-sm">Low Abundance (&lt;1K)</div>
                      </div>
                      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-4 text-white">
                        <div className="text-2xl font-bold">
                          {gutData.bacteria?.filter(item => typeof item.value === 'number' && item.value >= 1000 && item.value <= 10000).length || 0}
                        </div>
                        <div className="text-yellow-100 text-sm">Moderate Abundance (1K-10K)</div>
                      </div>
                      <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-xl p-4 text-white">
                        <div className="text-2xl font-bold">
                          {gutData.bacteria?.filter(item => typeof item.value === 'number' && item.value > 10000).length || 0}
                        </div>
                        <div className="text-red-100 text-sm">High Abundance (&gt;10K)</div>
                      </div>
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 text-white">
                        <div className="text-2xl font-bold">{gutData.bacteria?.length || 0}</div>
                        <div className="text-blue-100 text-sm">Total Organisms</div>
                      </div>
                    </div>
                  </div>

                  {/* Categorized Bacteria */}
                  {(() => {
                    const categorizedBacteria = groupBacteriaByCategory(gutData.bacteria);

                    return Object.entries(categorizedBacteria).map(([category, bacteria]) => (
                      <div key={category} className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                        <div className="flex items-center mb-6">
                          <span className="text-3xl mr-4">{getCategoryIcon(category)}</span>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900">{category}</h3>
                            <p className="text-gray-600">{bacteria.length} organisms detected</p>
                          </div>
                        </div>

                        {/* Two-column layout: Organisms on left, AI analysis on right */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* Left column: Organisms */}
                          <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Detected Organisms</h4>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                              {bacteria
                                .sort((a, b) => {
                                  if (typeof a.value === 'number' && typeof b.value === 'number') {
                                    return b.value - a.value;
                                  }
                                  return a.name.localeCompare(b.name);
                                })
                                .map((item, index) => {
                                  const abundance = getAbundanceLevel(item.value);
                                  return (
                                    <div
                                      key={index}
                                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                                    >
                                      <div className="flex items-center justify-between mb-3">
                                        <h5 className="font-medium text-gray-900 text-sm">{item.name}</h5>
                                        <div className="flex items-center gap-2">
                                          <div className="text-right">
                                            <span className="text-lg font-bold text-gray-900">
                                              {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                                              {item.unit}
                                            </span>
                                            {item.percentage && (
                                              <div className="text-sm text-gray-600 font-medium">
                                                {item.percentage}%
                                              </div>
                                            )}
                                          </div>
                                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${abundance.color}`}>
                                            {abundance.level}
                                          </span>
                                          {item.source === 'structured_table' && (
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                              Table
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {(typeof item.value === 'number' || item.percentage) && (
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                          <div
                                            className={`h-2 rounded-full transition-all duration-500 ease-out ${getAbundanceColor(item.value, item.unit)}`}
                                            style={{ 
                                              width: item.percentage 
                                                ? `${Math.min(100, (item.percentage / 20) * 100)}%` // Scale percentage to fit nicely
                                                : `${Math.min(100, (item.value / 20000) * 100)}%`
                                            }}
                                          ></div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          </div>

                          {/* Right column: AI Analysis */}
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">AI Analysis</h4>
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200 h-96 overflow-auto">
                              <SmartBlurb
                                title={`${category} - Microbiome Analysis`}
                                analytes={[`Microbiome_${category}`]}
                                useCache={true}
                                cacheKey="digestive_unified"
                                customData={gutData.categorizedForAI?.[category]}
                                customPrompt={gutHealthPrompts[category]}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}

              {/* Digestive Analysis (ChatGP Intestinal) */}
              {gutData.digestiveAnalysis && Object.keys(gutData.digestiveAnalysis).length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                  <div className="flex items-center mb-6">
                    <span className="text-3xl mr-4">🔬</span>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Digestive Analysis (ChatGP Intestinal)</h2>
                      <p className="text-gray-600">Physical and microscopic examination results</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(gutData.digestiveAnalysis).map(([key, value]) => {
                      const displayName = key
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, str => str.toUpperCase());
                      
                      // Determine status color based on common indicators
                      let statusColor = 'bg-gray-50 border-gray-200';
                      if (value.toLowerCase().includes('normal') || 
                          value.toLowerCase().includes('ausent') ||
                          value.toLowerCase().includes('não detectad')) {
                        statusColor = 'bg-green-50 border-green-200';
                      } else if (value.toLowerCase().includes('present') ||
                                 value.toLowerCase().includes('detectad') ||
                                 value.toLowerCase().includes('alterad')) {
                        statusColor = 'bg-yellow-50 border-yellow-200';
                      }
                      
                      return (
                        <div key={key} className={`${statusColor} rounded-lg p-4 border`}>
                          <span className="text-sm text-gray-600 font-medium">{displayName}</span>
                          <p className="font-semibold text-gray-900 mt-1">{value}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Biomarkers */}
              {gutData.biomarkers && Object.keys(gutData.biomarkers).length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                  <div className="flex items-center mb-6">
                    <span className="text-3xl mr-4">📊</span>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Biomarkers</h2>
                      <p className="text-gray-600">Inflammatory and functional intestinal markers</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(gutData.biomarkers).map(([key, value]) => {
                      const displayName = key
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, str => str.toUpperCase());
                      
                      return (
                        <div key={key} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                          <span className="text-sm text-purple-600 font-medium">{displayName}</span>
                          <p className="font-semibold text-gray-900 mt-1 text-lg">{value}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Phylogenic Analysis */}
              {gutData.phylogenicData && Object.keys(gutData.phylogenicData).length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                  <div className="flex items-center mb-6">
                    <span className="text-3xl mr-4">🧬</span>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Phylogenic Analysis</h2>
                      <p className="text-gray-600">Bacterial phyla distribution in the microbiome</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(gutData.phylogenicData).map(([key, value]) => {
                      const displayName = key
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, str => str.toUpperCase());
                      
                      // Color coding for different phyla
                      const phylaColors = {
                        bacteroidetes: 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200',
                        firmicutes: 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200',
                        proteobacteria: 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200',
                        actinobacteria: 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200',
                        verrucomicrobia: 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200'
                      };
                      
                      const colorClass = phylaColors[key.toLowerCase()] || 'bg-gray-50 border-gray-200';
                      
                      return (
                        <div key={key} className={`${colorClass} rounded-lg p-4 border`}>
                          <span className="text-sm font-medium text-gray-700">{displayName}</span>
                          <p className="font-semibold text-gray-900 mt-1 text-lg">{value}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Export Options */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Export Data</h2>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      const dataStr = JSON.stringify(gutData, null, 2);
                      const dataBlob = new Blob([dataStr], { type: 'application/json' });
                      const url = URL.createObjectURL(dataBlob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = 'digestive-analysis.json';
                      link.click();
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Export as JSON
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(gutData.rawText || '');
                      alert('Raw text copied to clipboard!');
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Copy Raw Text
                  </button>
                </div>
              </div>
            </>
          )}

          {!gutData && !loading && (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="text-6xl mb-4">🦠</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Processing Laudo 2</h2>
              <p className="text-gray-600">
                Automatically analyzing laudo 2.pdf to extract bacteria, microbiome composition, and gut health markers.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
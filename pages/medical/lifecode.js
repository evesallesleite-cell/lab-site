import React, { useState, useEffect, useMemo } from "react";
import Script from "next/script";
import dynamic from "next/dynamic";
import { GENETIC_ANALYSIS_PROMPT } from "../../lib/ai-prompts";

// Avoid SSR issues for the AI analysis component
const SmartBlurb = dynamic(() => import("../../components/SmartBlurb"), { ssr: false });

export default function LifeCodePage() {
  const [pdfData, setPdfData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pdfLoaded, setPdfLoaded] = useState(false);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('lifecode_data');
    if (savedData) {
      try {
        setPdfData(JSON.parse(savedData));
      } catch (err) {
        console.error('Error loading saved data:', err);
      }
    }
  }, []);

  const clearData = () => {
    setPdfData(null);
    localStorage.removeItem('lifecode_data');
  };

  // Memoize genetic analysis prompts to prevent unnecessary re-renders
  const geneticPrompts = useMemo(() => {
    if (!pdfData || !pdfData.categorizedForAI) return {};
    
    const prompts = {};
    Object.keys(pdfData.categorizedForAI).forEach(category => {
      const categoryData = pdfData.categorizedForAI[category];
      prompts[category] = GENETIC_ANALYSIS_PROMPT(category).replace(
        '{data}', 
        categoryData ? JSON.stringify(categoryData, null, 2) : 'No data available'
      );
    });
    return prompts;
  }, [pdfData?.categorizedForAI]);

  const getCategoryIcon = (category) => {
    const icons = {
      'Metabolism': '🧬',
      'Cardiovascular': '❤️',
      'Longevity': '🌟',
      'Intolerances': '🚫',
      'Vitamins & Minerals': '💊',
      'Mental Health': '🧠',
      'Physical Fitness': '💪',
      'Skin & Aesthetics': '✨',
      'Hormones': '⚡',
      'Others': '📊'
    };
    return icons[category] || '📊';
  };

  const groupMarkersByCategory = (markers) => {
    const categories = {
      'Metabolism': [],
      'Cardiovascular': [],
      'Longevity': [],
      'Intolerances': [],
      'Vitamins & Minerals': [],
      'Mental Health': [],
      'Physical Fitness': [],
      'Skin & Aesthetics': [],
      'Hormones': [],
      'Others': []
    };

    markers.forEach(marker => {
      const name = marker.titulo.toLowerCase();
      const originalName = marker.originalName?.toLowerCase() || '';
      
      if (name.includes('energy') || name.includes('eating') || name.includes('metabolism') || 
          name.includes('obesity') || name.includes('insulin') || name.includes('diabetes') || 
          name.includes('glp1') || name.includes('liver') || name.includes('alcohol') ||
          originalName.includes('gasto') || originalName.includes('comportamento') || 
          originalName.includes('metabolismo') || originalName.includes('insulina') ||
          originalName.includes('diabetes') || originalName.includes('álcool') || 
          originalName.includes('hepática')) {
        categories['Metabolism'].push(marker);
      } else if (name.includes('cardiovascular') || name.includes('hypertension') || 
                 name.includes('cholesterol') || name.includes('ldl') || name.includes('hdl') || 
                 name.includes('triglyceride') || name.includes('omega') || name.includes('statin') || 
                 name.includes('warfarin') || originalName.includes('cardiovascular') || 
                 originalName.includes('hipertensão') || originalName.includes('colesterol') ||
                 originalName.includes('trigliceride') || originalName.includes('ômega') ||
                 originalName.includes('estatinas') || originalName.includes('varfarina')) {
        categories['Cardiovascular'].push(marker);
      } else if (name.includes('longevity') || name.includes('macular') || name.includes('oxidative') || 
                 name.includes('detox') || name.includes('inflammation') || originalName.includes('longevidade') ||
                 originalName.includes('macular') || originalName.includes('oxidativo') ||
                 originalName.includes('inflamação')) {
        categories['Longevity'].push(marker);
      } else if (name.includes('lactose') || name.includes('gluten') || name.includes('celiac') || 
                 name.includes('histamine') || name.includes('allergies') || name.includes('omeprazole') ||
                 originalName.includes('lactose') || originalName.includes('glúten') || 
                 originalName.includes('celíaca') || originalName.includes('histamina') ||
                 originalName.includes('alergias') || originalName.includes('omeprazol')) {
        categories['Intolerances'].push(marker);
      } else if (name.includes('vitamin') || name.includes('choline') || name.includes('folate') || 
                 name.includes('minerals') || originalName.includes('vitamina') || 
                 originalName.includes('colina') || originalName.includes('folato') ||
                 originalName.includes('minerais')) {
        categories['Vitamins & Minerals'].push(marker);
      } else if (name.includes('circadian') || name.includes('sleep') || name.includes('mood') || 
                 name.includes('stress') || name.includes('addiction') || name.includes('migraine') || 
                 name.includes('cannabinoid') || name.includes('pain') || originalName.includes('circadiano') ||
                 originalName.includes('sono') || originalName.includes('humor') || 
                 originalName.includes('estresse') || originalName.includes('dependência') ||
                 originalName.includes('enxaqueca') || originalName.includes('canabinoides') ||
                 originalName.includes('dor')) {
        categories['Mental Health'].push(marker);
      } else if (name.includes('fitness') || name.includes('energy production') || name.includes('exercise') || 
                 name.includes('fatigue') || name.includes('muscle') || name.includes('tendon') || 
                 name.includes('ligament') || name.includes('joint') || name.includes('caffeine') ||
                 originalName.includes('aptidão') || originalName.includes('energia') || 
                 originalName.includes('exercício') || originalName.includes('fadiga') ||
                 originalName.includes('muscular') || originalName.includes('tendínea') ||
                 originalName.includes('ligament') || originalName.includes('articular') ||
                 originalName.includes('cafeína')) {
        categories['Physical Fitness'].push(marker);
      } else if (name.includes('skin') || name.includes('dermatitis') || name.includes('aesthetic') ||
                 originalName.includes('cutâneo') || originalName.includes('dermatites') ||
                 originalName.includes('estética')) {
        categories['Skin & Aesthetics'].push(marker);
      } else if (name.includes('testosterone') || name.includes('male infertility') ||
                 originalName.includes('testosterona') || originalName.includes('infertilidade')) {
        categories['Hormones'].push(marker);
      } else {
        categories['Others'].push(marker);
      }
    });

    // Remove empty categories
    return Object.fromEntries(Object.entries(categories).filter(([_, markers]) => markers.length > 0));
  };

  useEffect(() => {
    // Load stored data if available
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lifecode_data');
      if (stored) {
        try {
          setPdfData(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse stored LifeCode data:', e);
        }
      }
    }
  }, []);

  const handleFileUpload = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      setError('Please select a valid PDF file');
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Convert file to ArrayBuffer for PDF.js
      const arrayBuffer = await file.arrayBuffer();
      
      // Load PDF using PDF.js
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      // Extract text from all pages
      const textParts = [];
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        textParts.push(pageText);
      }
      
      const fullText = textParts.join('\n');
      
      // Parse the extracted text
      const parsedData = parseLifeCodeData(fullText);
      
      // Store in localStorage and state
      localStorage.setItem('lifecode_data', JSON.stringify(parsedData));
      setPdfData(parsedData);
      
    } catch (err) {
      setError('Error processing PDF: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const parseLifeCodeData = (text) => {
    console.log('🔍 Starting comprehensive LifeCode parsing...');
    console.log('📄 Text length:', text.length);
    
    const data = {
      patientInfo: {},
      summaryItems: [],
      rawText: text
    };

    // Parse patient information
    const patientMatch = text.match(/Paciente:\s*([A-ZÁ-ÚÃÕÂÊÔÇ\s\-\.]+)\s+Protocolo:\s*([0-9]+)/i);
    if (patientMatch) {
      data.patientInfo.paciente = patientMatch[1].trim();
      data.patientInfo.protocolo = patientMatch[2].trim();
    }

    const detailsMatch = text.match(/Data de nascimento:\s*([0-9]{2}\/[0-9]{2}\/[0-9]{4}).*?Data da coleta:\s*([0-9]{2}\/[0-9]{2}\/[0-9]{4}).*?Prescritor:\s*([A-ZÁ-ÚÃÕÂÊÔÇ\s\-\.]+).*?Idade:\s*([0-9]+)\s*anos\s*Liberado em:\s*([0-9]{2}\/[0-9]{2}\/[0-9]{4})/i);
    if (detailsMatch) {
      data.patientInfo.dataNascimento = detailsMatch[1];
      data.patientInfo.dataColeta = detailsMatch[2];
      data.patientInfo.prescritor = detailsMatch[3].trim();
      data.patientInfo.idade = detailsMatch[4];
      data.patientInfo.liberadoEm = detailsMatch[5];
    }

    // Complete translation map for ALL LifeCode markers
    const translations = {
      // Main categories from the RESUMO DO PERFIL section
      'Gasto Energético': 'Energy Expenditure',
      'Comportamento Alimentar': 'Eating Behavior', 
      'Metabolismo, Obesidade e Resistência à perda de peso': 'Metabolism, Obesity & Weight Loss Resistance',
      'Resistência à Insulina e Diabetes tipo 2': 'Insulin Resistance & Type 2 Diabetes',
      'Resposta à análogos de GLP1': 'GLP1 Analogs Response',
      'Risco para Diabetes tipo 1': 'Type 1 Diabetes Risk',
      'Doença Hepática Gordurosa Não Alcoólica': 'Non-Alcoholic Fatty Liver Disease',
      'Hiperuricemia': 'Hyperuricemia',
      'Metabolismo de álcool': 'Alcohol Metabolism',
      'Risco Cardiovascular': 'Cardiovascular Risk',
      'Risco para Hipertensão Arterial': 'Arterial Hypertension Risk',
      'Aumento de Colesterol Total': 'Total Cholesterol Increase',
      'LDL Colesterol': 'LDL Cholesterol',
      'HDL Colesterol': 'HDL Cholesterol', 
      'Hipertrigliceridemia': 'Hypertriglyceridemia',
      'Metabolismo de ômega 3 e resposta à suplementação': 'Omega 3 Metabolism & Supplementation Response',
      'Efeitos adversos do uso de Estatinas': 'Statin Adverse Effects',
      'Varfarina': 'Warfarin',
      'Longevidade': 'Longevity',
      'Degeneração Macular': 'Macular Degeneration',
      'Estresse Oxidativo e Detox': 'Oxidative Stress & Detox',
      'Inflamação e Doenças Inflamatórias Intestinais': 'Inflammation & Inflammatory Bowel Diseases',
      'Intolerância à Lactose': 'Lactose Intolerance',
      'Intolerância ao Glúten e Doença celíaca': 'Gluten Intolerance & Celiac Disease',
      'Intolerância à Histamina': 'Histamine Intolerance',
      'Risco para Alergias alimentares': 'Food Allergies Risk',
      'Metabolismo de Omeprazol': 'Omeprazole Metabolism',
      'Vitamina A': 'Vitamin A',
      'Vitamina D': 'Vitamin D',
      'Vitamina B6': 'Vitamin B6',
      'Colina': 'Choline',
      'Metabolismo do Folato': 'Folate Metabolism',
      'Vitamina B12': 'Vitamin B12',
      'Minerais': 'Minerals',
      'Ciclo Circadiano e Sono': 'Circadian Cycle & Sleep',
      'Transtornos de Humor e Resposta ao Estresse': 'Mood Disorders & Stress Response',
      'Comportamentos de dependência': 'Addiction Behaviors',
      'Enxaqueca': 'Migraine',
      'Metabolismo de canabinoides': 'Cannabinoid Metabolism',
      'Sensibilidade à dor': 'Pain Sensitivity',
      'Aptidão Física': 'Physical Fitness',
      'Produção de energia no exercício físico': 'Energy Production in Exercise',
      'Fadiga e Lesões musculares': 'Fatigue & Muscle Injuries',
      'Lesões tendíneas, ligamentares e articulares': 'Tendon, Ligament & Joint Injuries',
      'Metabolismo da Cafeína': 'Caffeine Metabolism',
      'Envelhecimento Cutâneo': 'Skin Aging',
      'Dermatites e Sensibilidade Dérmica': 'Dermatitis & Skin Sensitivity',
      'Desordens Estéticas': 'Aesthetic Disorders',
      'Testosterona': 'Testosterone',
      'Infertilidade Masculina': 'Male Infertility'
    };

    // Process text more aggressively to find all markers
    const lines = text.split(/\n/);
    const found = new Set();
    const items = [];

    console.log(`📝 Processing ${lines.length} lines for genetic markers...`);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (line.length === 0) continue;
      
      // Skip obvious administrative content with more precision
      if (line.match(/^(LIFECODE NUTRI|RESUMO DO PERFIL|TABELA DE GENÓTIPOS|INFORMAÇÕES TÉCNICAS)$/) ||
          line.match(/^Paciente:\s*/) ||
          line.match(/^(Data de nascimento|Data da coleta|Protocolo|Prescritor|Idade|Peso|Altura|Tipo de amostra|Recebimento)/) ||
          line.match(/^CRBM:\s*/) ||
          line.match(/^(Os dados contidos|Consulte sempre|DR\.|MSc|PhD)/) ||
          line.match(/^Página\s+[0-9]+\/[0-9]+/) ||
          line.match(/^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/)) {
        continue;
      }
      
      // Skip standalone scale indicators
      if (line.match(/^(FAVORÁVEL\s+DESFAVORÁVEL|BAIXO\s+ALTO|NORMAL\s+ALTERADO|RESISTÊNCIA\s+FORÇA|RÁPIDO\s+LENTO|ADEQUADO\s+REDUZIDO)$/)) {
        continue;
      }
      
      // Pattern 1: "Marker Name XX%" - most common format
      let match = line.match(/^(.+?)\s+([0-9]+)%$/);
      if (match) {
        let title = match[1].trim();
        const percentage = parseInt(match[2], 10);

        // Validate this is actually a genetic marker
        if (title.length > 3 && 
            !title.match(/^[0-9]/) && 
            !title.includes('SP -') &&
            !title.includes('PhD') &&
            !title.includes('MSc') &&
            !title.includes('DR.') &&
            !title.includes('BIOMÉDICO') &&
            !found.has(title)) {

          const englishTitle = translations[title] || title;
          
          items.push({
            titulo: englishTitle,
            percentual: percentage,
            originalName: title
          });

          found.add(title);
          console.log(`✅ Found marker: ${title} → ${englishTitle} (${percentage}%)`);
        }
        continue;
      }

      // Pattern 2: "Marker Name XX% STATUS1 STATUS2" - with risk levels
      match = line.match(/^(.+?)\s+([0-9]+)%\s+(BAIXO|ALTO|NORMAL|ALTERADO|FAVORÁVEL|DESFAVORÁVEL|RESISTÊNCIA|FORÇA|RÁPIDO|LENTO|ADEQUADO|REDUZIDO)\s+(BAIXO|ALTO|NORMAL|ALTERADO|FAVORÁVEL|DESFAVORÁVEL|RESISTÊNCIA|FORÇA|RÁPIDO|LENTO|ADEQUADO|REDUZIDO)$/);
      if (match) {
        const title = match[1].trim();
        const percentage = parseInt(match[2], 10);
        
        if (title.length > 3 && !found.has(title)) {
          const englishTitle = translations[title] || title;
          
          items.push({
            titulo: englishTitle,
            percentual: percentage,
            originalName: title
          });

          found.add(title);
          console.log(`✅ Found multi-status marker: ${title} → ${englishTitle} (${percentage}%)`);
        }
        continue;
      }

      // Pattern 3: Just the marker name, percentage might be on next line
      if (i < lines.length - 1) {
        const nextLine = lines[i + 1] ? lines[i + 1].trim() : '';
        const pctMatch = nextLine.match(/^([0-9]+)%$/);
        
        if (pctMatch && line.length > 3 && !line.match(/^[0-9]/) && !found.has(line)) {
          const percentage = parseInt(pctMatch[1], 10);
          const englishTitle = translations[line] || line;
          
          items.push({
            titulo: englishTitle,
            percentual: percentage,
            originalName: line
          });

          found.add(line);
          console.log(`✅ Found split-line marker: ${line} → ${englishTitle} (${percentage}%)`);
          i++; // Skip the percentage line
          continue;
        }
      }
    }

    // Additional aggressive search for missed markers using regex
    console.log('🔍 Performing comprehensive regex search...');
    
    Object.keys(translations).forEach(portugueseName => {
      if (!found.has(portugueseName)) {
        // Escape special regex characters and search
        const escapedName = portugueseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedName + '\\s+(\\d+)%', 'gi');
        const match = regex.exec(text);
        
        if (match) {
          const percentage = parseInt(match[1], 10);
          const englishTitle = translations[portugueseName];
          
          items.push({
            titulo: englishTitle,
            percentual: percentage,
            originalName: portugueseName
          });
          
          found.add(portugueseName);
          console.log(`✅ Found via regex: ${portugueseName} → ${englishTitle} (${percentage}%)`);
        }
      }
    });

    // Sort items by percentage (highest first)
    items.sort((a, b) => b.percentual - a.percentual);
    
    data.summaryItems = items;

    // Create categorized data for AI analysis
    data.categorizedForAI = {};
    if (items.length > 0) {
      const categorizedMarkers = groupMarkersByCategory(items);
      
      Object.entries(categorizedMarkers).forEach(([category, markers]) => {
        data.categorizedForAI[category] = {
          categoryName: category,
          totalMarkers: markers.length,
          highRiskCount: markers.filter(m => m.percentual > 70).length,
          moderateRiskCount: markers.filter(m => m.percentual >= 40 && m.percentual <= 70).length,
          lowRiskCount: markers.filter(m => m.percentual < 40).length,
          markers: markers.map(marker => ({
            name: marker.titulo,
            originalName: marker.originalName,
            riskPercentage: marker.percentual,
            riskLevel: marker.percentual > 70 ? 'High' : marker.percentual >= 40 ? 'Moderate' : 'Low'
          })),
          summary: `${category} analysis shows ${markers.length} genetic markers with ${markers.filter(m => m.percentual > 70).length} high-risk, ${markers.filter(m => m.percentual >= 40 && m.percentual <= 70).length} moderate-risk, and ${markers.filter(m => m.percentual < 40).length} low-risk variants.`,
          topRiskMarkers: markers.filter(m => m.percentual > 70).map(m => `${m.titulo} (${m.percentual}%)`),
          averageRisk: Math.round(markers.reduce((sum, m) => sum + m.percentual, 0) / markers.length)
        };
      });
    }

    console.log(`🎯 Total markers found: ${items.length}`);
    console.log('📊 Sample markers:', items.slice(0, 10).map(item => `${item.titulo}: ${item.percentual}%`));

    return data;
  };

  const getBarColor = (percentage) => {
    if (percentage < 40) return 'bg-emerald-500';
    if (percentage < 70) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getRiskLevel = (percentage) => {
    if (percentage < 40) return { level: 'Low', color: 'text-emerald-600 bg-emerald-50' };
    if (percentage < 70) return { level: 'Moderate', color: 'text-amber-600 bg-amber-50' };
    return { level: 'High', color: 'text-rose-600 bg-rose-50' };
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
              <h1 className="text-3xl font-semibold text-gray-900">LifeCode Genetic Analysis</h1>
              <p className="text-gray-600 mt-2">Upload and analyze your LifeCode genetic report</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                🧬 PDF Analysis
              </span>
            </div>
          </div>

          {/* Upload Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Upload Your LifeCode Report</h2>
              {pdfData && (
                <span className="text-sm text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                  ✓ Report loaded
                </span>
              )}
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors">
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
                className={`cursor-pointer inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 ${loading || !pdfLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Processing...' : pdfData ? 'Upload New Report' : 'Choose PDF File'}
              </label>
              {pdfData && (
                <button
                  onClick={clearData}
                  className="ml-4 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-red-600 bg-red-50 hover:bg-red-100"
                >
                  Clear Data
                </button>
              )}
              <p className="text-gray-500 mt-2">Upload your LifeCode genetic analysis PDF report</p>
              {!pdfLoaded && (
                <p className="text-amber-600 mt-2 text-sm">Loading PDF reader...</p>
              )}
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}
          </div>

          {pdfData && (
            <>
              {/* Patient Information */}
              {pdfData.patientInfo && Object.keys(pdfData.patientInfo).length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Patient Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pdfData.patientInfo.paciente && (
                      <div className="p-4 bg-indigo-50 rounded-lg">
                        <span className="text-sm text-gray-600">Patient</span>
                        <p className="font-semibold text-gray-900">{pdfData.patientInfo.paciente}</p>
                      </div>
                    )}
                    {pdfData.patientInfo.protocolo && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <span className="text-sm text-gray-600">Protocol</span>
                        <p className="font-semibold text-gray-900">{pdfData.patientInfo.protocolo}</p>
                      </div>
                    )}
                    {pdfData.patientInfo.prescritor && (
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <span className="text-sm text-gray-600">Prescriber</span>
                        <p className="font-semibold text-gray-900">{pdfData.patientInfo.prescritor}</p>
                      </div>
                    )}
                    {pdfData.patientInfo.dataNascimento && (
                      <div className="p-4 bg-green-50 rounded-lg">
                        <span className="text-sm text-gray-600">Date of Birth</span>
                        <p className="font-semibold text-gray-900">{pdfData.patientInfo.dataNascimento}</p>
                      </div>
                    )}
                    {pdfData.patientInfo.dataColeta && (
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <span className="text-sm text-gray-600">Collection Date</span>
                        <p className="font-semibold text-gray-900">{pdfData.patientInfo.dataColeta}</p>
                      </div>
                    )}
                    {pdfData.patientInfo.idade && (
                      <div className="p-4 bg-pink-50 rounded-lg">
                        <span className="text-sm text-gray-600">Age</span>
                        <p className="font-semibold text-gray-900">{pdfData.patientInfo.idade} years</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Genetic Profile Summary - Categorized */}
              {pdfData.summaryItems && pdfData.summaryItems.length > 0 && (
                <div className="space-y-8">
                  <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-gray-900">Genetic Profile by Category</h2>
                      <button
                        onClick={() => {
                          // Clear all genetic analysis cache
                          const keysToRemove = [];
                          for (let i = 0; i < localStorage.length; i++) {
                            const key = localStorage.key(i);
                            if (key && key.includes('lifecode_genetic')) {
                              keysToRemove.push(key);
                            }
                          }
                          keysToRemove.forEach(key => localStorage.removeItem(key));
                          console.log(`Cleared ${keysToRemove.length} genetic analysis cache entries`);
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
                      Analysis of {pdfData.summaryItems.length} genetic markers organized by health categories
                    </p>
                    
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white">
                        <div className="text-2xl font-bold">
                          {pdfData.summaryItems?.filter(item => item.percentual <= 30).length || 0}
                        </div>
                        <div className="text-green-100 text-sm">Low Risk (≤30%)</div>
                      </div>
                      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-4 text-white">
                        <div className="text-2xl font-bold">
                          {pdfData.summaryItems?.filter(item => item.percentual > 30 && item.percentual <= 70).length || 0}
                        </div>
                        <div className="text-yellow-100 text-sm">Moderate Risk (31-70%)</div>
                      </div>
                      <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-xl p-4 text-white">
                        <div className="text-2xl font-bold">
                          {pdfData.summaryItems?.filter(item => item.percentual > 70).length || 0}
                        </div>
                        <div className="text-red-100 text-sm">High Risk (&gt;70%)</div>
                      </div>
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 text-white">
                        <div className="text-2xl font-bold">{pdfData.summaryItems?.length || 0}</div>
                        <div className="text-blue-100 text-sm">Total Markers</div>
                      </div>
                    </div>
                  </div>

                  {/* Categorized Markers */}
                  {(() => {
                    const categorizedMarkers = groupMarkersByCategory(pdfData.summaryItems);
                    
                    return Object.entries(categorizedMarkers).map(([category, markers]) => (
                      <div key={category} className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                        <div className="flex items-center mb-6">
                          <span className="text-3xl mr-4">{getCategoryIcon(category)}</span>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900">{category}</h3>
                            <p className="text-gray-600">{markers.length} genetic markers</p>
                          </div>
                        </div>
                        
                        {/* Two-column layout: Markers on left, AI analysis on right */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* Left column: Genetic markers */}
                          <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Genetic Markers</h4>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                              {markers
                                .sort((a, b) => b.percentual - a.percentual)
                                .map((item, index) => {
                                  const risk = getRiskLevel(item.percentual);
                                  return (
                                    <div
                                      key={index}
                                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                                    >
                                      <div className="flex items-center justify-between mb-3">
                                        <h5 className="font-medium text-gray-900 text-sm">{item.titulo}</h5>
                                        <div className="flex items-center gap-2">
                                          <span className="text-lg font-bold text-gray-900">{item.percentual}%</span>
                                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${risk.color}`}>
                                            {risk.level}
                                          </span>
                                        </div>
                                      </div>
                                      
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                          className={`h-2 rounded-full transition-all duration-500 ease-out ${getBarColor(item.percentual)}`}
                                          style={{ width: `${item.percentual}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                          
                          {/* Right column: AI Analysis */}
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">AI Analysis</h4>
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200 h-96 overflow-auto">
                              <SmartBlurb 
                                title={`${category} - Genetic Analysis`}
                                analytes={[`Genetic_${category}`]}
                                useCache={true}
                                cacheKey="lifecode_genetic"
                                customData={pdfData.categorizedForAI?.[category]}
                                customPrompt={geneticPrompts[category]}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}

              {/* Risk Categories Overview */}
              <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Risk Distribution</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { level: 'Low Risk', range: '< 40%', color: 'from-emerald-500 to-emerald-600', count: pdfData.summaryItems?.filter(item => item.percentual < 40).length || 0 },
                    { level: 'Moderate Risk', range: '40-70%', color: 'from-amber-500 to-amber-600', count: pdfData.summaryItems?.filter(item => item.percentual >= 40 && item.percentual < 70).length || 0 },
                    { level: 'High Risk', range: '≥ 70%', color: 'from-rose-500 to-rose-600', count: pdfData.summaryItems?.filter(item => item.percentual >= 70).length || 0 }
                  ].map((category, index) => (
                    <div key={index} className={`bg-gradient-to-r ${category.color} rounded-xl p-6 text-white`}>
                      <h3 className="font-semibold text-lg mb-2">{category.level}</h3>
                      <p className="text-3xl font-bold mb-1">{category.count}</p>
                      <p className="text-sm opacity-90">markers ({category.range})</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Export Options */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Export Data</h2>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      const dataStr = JSON.stringify(pdfData, null, 2);
                      const dataBlob = new Blob([dataStr], { type: 'application/json' });
                      const url = URL.createObjectURL(dataBlob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = 'lifecode-analysis.json';
                      link.click();
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Export as JSON
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pdfData.rawText || '');
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

          {!pdfData && !loading && (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="text-6xl mb-4">📄</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">No Report Uploaded</h2>
              <p className="text-gray-600">
                Upload your LifeCode PDF report to view detailed genetic analysis and insights.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

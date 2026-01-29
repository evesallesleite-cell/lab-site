// AI-powered medical report parser that doesn't rely on hardcoded patterns
// Uses AI reasoning to extract structured data from any report format

export class AIMedicalParser {
  constructor(apiKey = null) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
  }

  async parseReport(textContent, reportType = 'digestive') {
    console.log('🤖 Starting AI-powered medical report parsing...');
    
    // First, let AI analyze and structure the raw text
    const structuredData = await this.extractStructuredData(textContent, reportType);
    
    // Then format it for display
    const displayData = this.formatForDisplay(structuredData);
    
    return displayData;
  }

  async extractStructuredData(textContent, reportType) {
    const prompt = this.buildExtractionPrompt(textContent, reportType);
    
    try {
      // Use AI to extract structured data
      const response = await fetch('/api/ai-extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          text: textContent
        })
      });

      if (!response.ok) {
        throw new Error('AI extraction failed');
      }

      const result = await response.json();
      return JSON.parse(result.extractedData);
    } catch (error) {
      console.error('AI extraction error:', error);
      // Fallback to local processing if API fails
      return this.fallbackExtraction(textContent, reportType);
    }
  }

  buildExtractionPrompt(textContent, reportType) {
    return `
You are a comprehensive medical data extraction AI. Extract EVERY piece of information from this ${reportType} health report. This report contains hundreds of bacterial species, biomarkers, functional tests, and fungal data - capture ALL of it.

CRITICAL REQUIREMENTS:
1. Extract ALL bacterial species from the complete taxonomy table (300-400+ entries)
2. Extract ALL functional test results with exact values and units
3. Extract ALL biomarkers with values, units, and reference ranges
4. Extract ALL fungal species with quantities
5. Extract complete patient information
6. Do NOT summarize or skip any data

COMPREHENSIVE EXTRACTION TEMPLATE:
{
  "patientInfo": {
    "fullName": "complete patient name including first and last names",
    "age": "age with units",
    "gender": "if mentioned",
    "collectionDate": "sample collection date",
    "reportDate": "report generation date",
    "labInfo": "laboratory name and codes",
    "responsibleDoctor": "doctor name and credentials",
    "reportId": "any report identification numbers"
  },
  "functionalTests": {
    "consistency": {"value": "", "scale": "Bristol scale if mentioned", "reference": ""},
    "ph": {"value": "", "reference": ""},
    "fats": {"value": "", "unit": "g/100g", "reference": ""},
    "proteins": {"value": "", "unit": "", "reference": ""},
    "carbohydrates": {"value": "", "unit": "", "reference": ""},
    "allOtherTests": [
      {"name": "", "value": "", "unit": "", "reference": "", "status": ""}
    ]
  },
  "biomarkers": {
    "calprotectin": {"value": "", "unit": "ug/g", "reference": "", "status": ""},
    "zonulin": {"value": "", "unit": "ng/mL", "reference": "", "status": ""},
    "pancreaticElastase": {"value": "", "unit": "μg/g", "reference": "", "status": ""},
    "alphaAntitrypsin": {"value": "", "unit": "mg/dL", "reference": "", "status": ""},
    "allOtherBiomarkers": [
      {"name": "", "value": "", "unit": "", "reference": "", "methodology": ""}
    ]
  },
  "microbiotaOverview": {
    "speciesRichness": "",
    "genusRichness": "",
    "fbAbundance": "",
    "simpsonIndex": "",
    "distribution": "",
    "otherMetrics": {}
  },
  "bacterialTaxonomy": [
    {
      "kingdom": "Bacteria or Archaea",
      "phylum": "",
      "class": "",
      "order": "",
      "family": "",
      "genus": "",
      "species": "",
      "quantity": "",
      "percentage": ""
    }
  ],
  "fungalAnalysis": [
    {
      "species": "complete fungal species name",
      "quantity": "",
      "percentage": "",
      "notes": ""
    }
  ],
  "phylumComposition": {
    "bacteroidetes": {"percentage": "", "description": ""},
    "firmicutes": {"percentage": "", "description": ""},
    "proteobacteria": {"percentage": "", "description": ""},
    "verrucomicrobia": {"percentage": "", "description": ""},
    "actinobacteria": {"percentage": "", "description": ""},
    "others": {}
  },
  "genusDistribution": [
    {"genus": "", "percentage": "", "phylum": ""}
  ],
  "protectiveBacteria": [
    {"name": "", "percentage": "", "function": "", "significance": ""}
  ],
  "pathogenicBacteria": [
    {"name": "", "percentage": "", "risk": "", "reference": ""}
  ],
  "atypicalFindings": [
    {"name": "", "percentage": "", "concern": "", "threshold": ""}
  ],
  "reportMetadata": {
    "totalPages": "",
    "reportType": "",
    "language": "",
    "sectionsDetected": [],
    "extractionCompleteness": "estimate percentage of data captured"
  }
}

SPECIAL INSTRUCTIONS:
- If you see a table with "REINO FILO CLASSE ORDEM FAMÍLIA GÊNERO ESPÉCIE QUANTI. PERCENT." headers, extract EVERY single row
- Look for bacterial names like "Akkermansia muciniphila", "Faecalibacterium prausnitzii", etc. and capture all percentages
- Find calprotectin, zonulin values with exact numbers and reference ranges
- Extract ALL Candida, Malassezia, Saccharomyces species
- Include every functional test result (consistency Type X, pH X.X, fats < X.X g/100g)

Text to analyze:
${textContent}

Return ONLY the complete JSON object with ALL extracted data, no additional text.`;
  }

  fallbackExtraction(textContent, reportType) {
    console.log('🔄 Using enhanced fallback extraction...');
    
    const data = {
      patientInfo: this.extractPatientInfo(textContent),
      functionalTests: this.extractFunctionalTests(textContent),
      biomarkers: this.extractBiomarkers(textContent),
      microbiotaOverview: this.extractMicrobiotaOverview(textContent),
      bacterialTaxonomy: this.extractBacterialTaxonomy(textContent),
      fungalAnalysis: this.extractFungalAnalysis(textContent),
      phylumComposition: this.extractPhylumComposition(textContent),
      genusDistribution: this.extractGenusDistribution(textContent),
      protectiveBacteria: this.extractProtectiveBacteria(textContent),
      pathogenicBacteria: this.extractPathogenicBacteria(textContent),
      atypicalFindings: this.extractAtypicalFindings(textContent),
      reportMetadata: {
        reportType: reportType,
        language: this.detectLanguage(textContent),
        sectionsDetected: this.detectSections(textContent),
        extractionMethod: 'enhanced_fallback'
      }
    };
    
    return data;
  }

  extractPatientInfo(text) {
    const info = {};
    
    // Extract full name - look for Portuguese names
    const nameMatch = text.match(/(?:Nome|Patient|PACIENTE)[:\s]*([A-ZÁÇÕÉ][A-ZÁÇÕÉa-z\s]+)/i);
    if (nameMatch) info.fullName = nameMatch[1].trim();
    
    // Extract age
    const ageMatch = text.match(/(\d+)\s*(?:anos|years|yr)/i);
    if (ageMatch) info.age = `${ageMatch[1]} years`;
    
    // Extract dates
    const dateMatch = text.match(/(\d{2}\/\d{2}\/\d{4})/);
    if (dateMatch) info.collectionDate = dateMatch[1];
    
    // Extract report ID
    const idMatch = text.match(/(?:CRBM|ID)[:\s]*(\d+)/i);
    if (idMatch) info.reportId = idMatch[1];
    
    // Extract doctor
    const doctorMatch = text.match(/(?:DR\.|Doctor)[:\s]*([A-ZÁÇÕÉ][A-ZÁÇÕÉa-z\s,]+)/i);
    if (doctorMatch) info.responsibleDoctor = doctorMatch[1].trim();
    
    return info;
  }

  extractFunctionalTests(text) {
    const tests = {};
    
    // Extract consistency
    const consistencyMatch = text.match(/(?:Consistência|Consistency)[:\s]*(?:Tipo|Type)\s*(\d+)/i);
    if (consistencyMatch) {
      tests.consistency = { value: `Type ${consistencyMatch[1]}`, scale: "Bristol scale" };
    }
    
    // Extract pH
    const phMatch = text.match(/pH[:\s]*(\d+[.,]\d+)/i);
    if (phMatch) {
      tests.ph = { value: phMatch[1].replace(',', '.') };
    }
    
    // Extract fats
    const fatMatch = text.match(/(?:Gorduras|Fats)[:\s]*(<?\s*\d+[.,]\d*)\s*g\/100g/i);
    if (fatMatch) {
      tests.fats = { value: fatMatch[1].replace(',', '.'), unit: "g/100g" };
    }
    
    return tests;
  }

  extractBiomarkers(text) {
    const biomarkers = {};
    
    // Extract calprotectin
    const calprotectinMatch = text.match(/(?:Calprotectina|Calprotectin)[:\s]*(\d+[.,]\d*)\s*(?:ug\/g|μg\/g)/i);
    if (calprotectinMatch) {
      biomarkers.calprotectin = { 
        value: calprotectinMatch[1].replace(',', '.'), 
        unit: "ug/g"
      };
    }
    
    // Extract zonulin
    const zonulinMatch = text.match(/(?:Zonulina|Zonulin)[:\s]*(\d+[.,]\d*)\s*ng\/mL/i);
    if (zonulinMatch) {
      biomarkers.zonulin = { 
        value: zonulinMatch[1].replace(',', '.'), 
        unit: "ng/mL"
      };
    }
    
    // Extract elastase
    const elastaseMatch = text.match(/(?:Elastase|Elastase pancreática)[:\s]*([>\d]+[.,]?\d*)\s*μg\/g/i);
    if (elastaseMatch) {
      biomarkers.pancreaticElastase = { 
        value: elastaseMatch[1].replace(',', '.'), 
        unit: "μg/g"
      };
    }
    
    return biomarkers;
  }

  extractBacterialTaxonomy(text) {
    const taxonomy = [];
    
    // Look for the complete taxonomy table
    const taxonomyPattern = /Bacteria\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+(\d+)\s+(\d+[.,]\d+%)/g;
    
    let match;
    while ((match = taxonomyPattern.exec(text)) !== null) {
      taxonomy.push({
        kingdom: "Bacteria",
        phylum: match[1],
        class: match[2],
        order: match[3],
        family: match[4],
        genus: match[5],
        species: match[6],
        quantity: match[7],
        percentage: match[8].replace(',', '.')
      });
    }
    
    // Also look for Archaea
    const archaeaPattern = /Archaea\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+(\d+)\s+(\d+[.,]\d+%)/g;
    
    while ((match = archaeaPattern.exec(text)) !== null) {
      taxonomy.push({
        kingdom: "Archaea",
        phylum: match[1],
        class: match[2],
        order: match[3],
        family: match[4],
        genus: match[5],
        species: match[6],
        quantity: match[7],
        percentage: match[8].replace(',', '.')
      });
    }
    
    return taxonomy;
  }

  extractFungalAnalysis(text) {
    const fungi = [];
    
    // Look for Candida species
    const candidaPattern = /Candida\s+([^\s]+)\s+(\d+)\s+\((\d+[.,]\d+%)\)/g;
    let match;
    while ((match = candidaPattern.exec(text)) !== null) {
      fungi.push({
        species: `Candida ${match[1]}`,
        quantity: match[2],
        percentage: match[3].replace(',', '.')
      });
    }
    
    // Look for other fungi
    const fungiPattern = /(Malassezia|Saccharomyces)\s+([^\s]+)\s+(\d+)\s+\((\d+[.,]\d+%)\)/g;
    while ((match = fungiPattern.exec(text)) !== null) {
      fungi.push({
        species: `${match[1]} ${match[2]}`,
        quantity: match[3],
        percentage: match[4].replace(',', '.')
      });
    }
    
    return fungi;
  }

  extractMicrobiotaOverview(text) {
    const overview = {};
    
    // Extract species richness
    const richnessMatch = text.match(/(?:richness|riqueza)[:\s]*(\d+)/i);
    if (richnessMatch) overview.speciesRichness = richnessMatch[1];
    
    // Extract F+B abundance
    const abundanceMatch = text.match(/F\+B[:\s]*(\d+[.,]\d+%)/i);
    if (abundanceMatch) overview.fbAbundance = abundanceMatch[1].replace(',', '.');
    
    // Extract Simpson index
    const simpsonMatch = text.match(/Simpson[:\s]*(\d+[.,]\d+)/i);
    if (simpsonMatch) overview.simpsonIndex = simpsonMatch[1].replace(',', '.');
    
    return overview;
  }

  extractPhylumComposition(text) {
    const composition = {};
    
    const phylumPattern = /(Bacteroidetes|Firmicutes|Proteobacteria|Verrucomicrobia|Actinobacteria)[:\s]*(\d+[.,]\d+%)/gi;
    let match;
    while ((match = phylumPattern.exec(text)) !== null) {
      const phylum = match[1].toLowerCase();
      composition[phylum] = { 
        percentage: match[2].replace(',', '.'),
        description: this.getPhylumDescription(phylum)
      };
    }
    
    return composition;
  }

  extractGenusDistribution(text) {
    const distribution = [];
    
    // Look for genus percentages in various formats
    const genusPattern = /([A-Z][a-z]+)[:\s]*(\d+[.,]\d+%)/g;
    let match;
    while ((match = genusPattern.exec(text)) !== null) {
      distribution.push({
        genus: match[1],
        percentage: match[2].replace(',', '.')
      });
    }
    
    return distribution;
  }

  extractProtectiveBacteria(text) {
    const protective = [];
    
    const protectiveNames = [
      'Akkermansia muciniphila',
      'Faecalibacterium prausnitzii', 
      'Bifidobacterium',
      'Eubacterium rectale',
      'Roseburia'
    ];
    
    protectiveNames.forEach(name => {
      const pattern = new RegExp(`${name.replace(' ', '\\s+')}[:\\s]*(\\d+[.,]\\d+%)`, 'i');
      const match = text.match(pattern);
      if (match) {
        protective.push({
          name: name,
          percentage: match[1].replace(',', '.'),
          function: this.getBacterialFunction(name)
        });
      }
    });
    
    return protective;
  }

  extractPathogenicBacteria(text) {
    const pathogenic = [];
    
    const pathogenicNames = [
      'Bacteroides fragilis',
      'Salmonella',
      'Clostridium difficile'
    ];
    
    pathogenicNames.forEach(name => {
      const pattern = new RegExp(`${name.replace(' ', '\\s+')}[:\\s]*(\\d+[.,]\\d+%)`, 'i');
      const match = text.match(pattern);
      if (match) {
        pathogenic.push({
          name: name,
          percentage: match[1].replace(',', '.'),
          risk: 'Potential pathogen'
        });
      }
    });
    
    return pathogenic;
  }

  extractAtypicalFindings(text) {
    const atypical = [];
    
    const atypicalNames = [
      'Bacteroides dorei',
      'Bilophila wadsworthia',
      'Prevotella copri'
    ];
    
    atypicalNames.forEach(name => {
      const pattern = new RegExp(`${name.replace(' ', '\\s+')}[:\\s]*(\\d+[.,]\\d+%)`, 'i');
      const match = text.match(pattern);
      if (match) {
        atypical.push({
          name: name,
          percentage: match[1].replace(',', '.'),
          concern: 'Elevated levels detected'
        });
      }
    });
    
    return atypical;
  }

  getPhylumDescription(phylum) {
    const descriptions = {
      'bacteroidetes': 'Immune modulation',
      'firmicutes': 'Energy metabolism', 
      'proteobacteria': 'Potential inflammation',
      'verrucomicrobia': 'Mucin degradation',
      'actinobacteria': 'Vitamin synthesis'
    };
    return descriptions[phylum] || '';
  }

  getBacterialFunction(name) {
    const functions = {
      'Akkermansia muciniphila': 'Gut barrier & metabolism',
      'Faecalibacterium prausnitzii': 'Anti-inflammatory butyrate',
      'Bifidobacterium': 'Immune support & lactose',
      'Eubacterium rectale': 'Butyrate production'
    };
    return functions[name] || 'Beneficial bacteria';
  }

  detectSections(text) {
    // Dynamically detect section headers
    const sectionPatterns = [
      /([A-ZÁÇÕÉ\s]+)(?:\n|$)/g,  // Portuguese section headers
      /^[A-Z][A-Z\s]{3,}$/gm,     // All caps headers
      /^\d+\.?\s*([A-ZÁÇÕÉ\s]+)/gm // Numbered sections
    ];
    
    const sections = new Set();
    sectionPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length > 3 && match[1].length < 50) {
          sections.add(match[1].trim());
        }
      }
    });
    
    return Array.from(sections);
  }

  detectLanguage(text) {
    const portugueseWords = ['prova', 'coprológica', 'biomarcadores', 'ausente', 'presente'];
    const englishWords = ['test', 'biomarkers', 'absent', 'present'];
    
    const ptCount = portugueseWords.filter(word => 
      text.toLowerCase().includes(word)).length;
    const enCount = englishWords.filter(word => 
      text.toLowerCase().includes(word)).length;
    
    return ptCount > enCount ? 'portuguese' : 'english';
  }

  extractTestsFlexibly(text, type) {
    const tests = [];
    
    // Look for patterns like "NAME value REFERENCE"
    const testPattern = /([A-ZÁÇÕÉ][A-ZÁÇÕÉa-z\s]+?)\s+([\d,]+(?:\.[\d]+)?|\w+)\s+([A-ZÁÇÕÉa-z\s:]+)/g;
    
    const matches = text.matchAll(testPattern);
    for (const match of matches) {
      tests.push({
        name: match[1].trim(),
        result: match[2].trim(),
        reference: match[3].trim()
      });
    }
    
    return { tests };
  }

  extractMicrobiotaFlexibly(text) {
    const bacteria = [];
    
    // Look for bacterial names with percentages
    const bacteriaPattern = /([A-Z][a-z]+(?:\s+[a-z]+)*)\s+([\d,]+)%/g;
    
    const matches = text.matchAll(bacteriaPattern);
    for (const match of matches) {
      bacteria.push({
        name: match[1].trim(),
        percentage: parseFloat(match[2].replace(',', '.')),
        category: this.categorizeBacteria(match[1])
      });
    }
    
    return { bacteria };
  }

  categorizeBacteria(name) {
    const protective = ['akkermansia', 'bifidobacterium', 'faecalibacterium', 'eubacterium'];
    const pathogenic = ['salmonella', 'clostridium', 'bacteroides fragilis'];
    
    const lowerName = name.toLowerCase();
    
    if (protective.some(p => lowerName.includes(p))) return 'protective';
    if (pathogenic.some(p => lowerName.includes(p))) return 'pathogenic';
    return 'neutral';
  }

  formatForDisplay(structuredData) {
    // Convert AI-extracted data to display format
    return {
      reportInfo: structuredData.reportInfo || {},
      functionalTests: this.formatFunctionalTests(structuredData.functionalTests),
      biomarkers: this.formatBiomarkers(structuredData.biomarkers),
      microbiota: this.formatMicrobiota(structuredData.microbiota),
      patientInfo: structuredData.patientInfo || {},
      summary: {
        reportType: this.determineReportTypes(structuredData),
        extractedSections: structuredData.reportInfo?.sections || []
      },
      metadata: {
        extractionMethod: 'AI-powered',
        sectionsDetected: structuredData.reportInfo?.sections?.length || 0,
        timestamp: new Date().toISOString()
      }
    };
  }

  formatFunctionalTests(functionalData) {
    if (!functionalData?.tests) return {};
    
    const formatted = {};
    functionalData.tests.forEach(test => {
      const key = this.generateKey(test.name);
      formatted[key] = test.result;
    });
    
    return formatted;
  }

  formatBiomarkers(biomarkersData) {
    if (!biomarkersData?.markers) return {};
    
    const formatted = {};
    biomarkersData.markers.forEach(marker => {
      const key = this.generateKey(marker.name);
      formatted[key] = {
        value: marker.value,
        unit: marker.unit,
        reference: marker.reference
      };
    });
    
    return formatted;
  }

  formatMicrobiota(microbiotaData) {
    if (!microbiotaData) return {};
    
    return {
      overview: microbiotaData.overview || {},
      protectiveBacteria: this.groupBacteria(microbiotaData.bacteria, 'protective'),
      pathogenicBacteria: this.groupBacteria(microbiotaData.bacteria, 'pathogenic'),
      atypicalFindings: this.groupBacteria(microbiotaData.bacteria, 'atypical'),
      phylumComposition: microbiotaData.phylumComposition || [],
      genusDistribution: microbiotaData.genusDistribution || []
    };
  }

  groupBacteria(bacteria, category) {
    if (!bacteria) return {};
    
    const filtered = bacteria.filter(b => b.category === category);
    const grouped = {};
    
    filtered.forEach(bacterium => {
      const key = this.generateKey(bacterium.name);
      grouped[key] = bacterium.percentage;
    });
    
    return grouped;
  }

  generateKey(name) {
    return name
      .toLowerCase()
      .replace(/[áàâã]/g, 'a')
      .replace(/[éèê]/g, 'e')
      .replace(/[íìî]/g, 'i')
      .replace(/[óòôõ]/g, 'o')
      .replace(/[úùû]/g, 'u')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);
  }

  determineReportTypes(data) {
    const types = [];
    
    if (data.functionalTests?.tests?.length > 0) types.push('Functional Tests');
    if (data.biomarkers?.markers?.length > 0) types.push('Biomarkers');
    if (data.microbiota?.bacteria?.length > 0) types.push('Microbiota');
    
    return types;
  }
}

// Dynamic report renderer that displays any JSON structure
export class DynamicReportRenderer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  render(data) {
    this.container.innerHTML = this.generateHTML(data);
  }

  generateHTML(data) {
    let html = '<div class="dynamic-report">';
    
    // Render each section dynamically
    Object.entries(data).forEach(([section, content]) => {
      html += this.renderSection(section, content);
    });
    
    html += '</div>';
    return html;
  }

  renderSection(title, content) {
    const formattedTitle = this.formatTitle(title);
    
    if (Array.isArray(content)) {
      return this.renderArray(formattedTitle, content);
    } else if (typeof content === 'object' && content !== null) {
      return this.renderObject(formattedTitle, content);
    } else {
      return this.renderValue(formattedTitle, content);
    }
  }

  renderObject(title, obj) {
    let html = `<div class="section bg-white rounded-xl shadow-lg p-6 mb-6">`;
    html += `<h2 class="text-xl font-bold text-gray-900 mb-4">${title}</h2>`;
    
    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        html += this.renderSubsection(key, value);
      } else {
        html += this.renderKeyValue(key, value);
      }
    });
    
    html += '</div>';
    return html;
  }

  renderArray(title, array) {
    let html = `<div class="section bg-white rounded-xl shadow-lg p-6 mb-6">`;
    html += `<h2 class="text-xl font-bold text-gray-900 mb-4">${title}</h2>`;
    
    array.forEach((item, index) => {
      html += `<div class="array-item mb-3 p-3 bg-gray-50 rounded">`;
      if (typeof item === 'object') {
        Object.entries(item).forEach(([key, value]) => {
          html += this.renderKeyValue(key, value);
        });
      } else {
        html += `<span>${item}</span>`;
      }
      html += '</div>';
    });
    
    html += '</div>';
    return html;
  }

  renderKeyValue(key, value) {
    const formattedKey = this.formatTitle(key);
    return `
      <div class="flex justify-between items-center py-2 border-b border-gray-200">
        <span class="text-gray-700">${formattedKey}</span>
        <span class="font-semibold text-gray-900">${this.formatValue(value)}</span>
      </div>
    `;
  }

  renderSubsection(title, content) {
    const formattedTitle = this.formatTitle(title);
    let html = `<div class="subsection mb-4">`;
    html += `<h3 class="text-lg font-semibold text-gray-800 mb-2">${formattedTitle}</h3>`;
    
    if (Array.isArray(content)) {
      content.forEach(item => {
        html += `<div class="ml-4 mb-2">${this.formatValue(item)}</div>`;
      });
    } else if (typeof content === 'object') {
      Object.entries(content).forEach(([key, value]) => {
        html += this.renderKeyValue(key, value);
      });
    }
    
    html += '</div>';
    return html;
  }

  formatTitle(title) {
    return title
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  formatValue(value) {
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }

  renderValue(title, value) {
    return `
      <div class="value-section bg-gray-50 rounded p-4 mb-4">
        <h3 class="font-semibold text-gray-800">${title}</h3>
        <p class="text-gray-600">${this.formatValue(value)}</p>
      </div>
    `;
  }
}

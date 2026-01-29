// Enhanced PDF Parser with page-by-page OCR extraction
// lib/pdf-page-extractor.js

export class PDFPageExtractor {
  constructor() {
    this.debugMode = true;
    this.extractedPages = [];
    this.consolidatedData = {};
  }

  async extractByPages(file) {
    console.log('🔄 Starting page-by-page extraction...');
    
    try {
      const pdfjsLib = await import('pdfjs-dist');
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      
      console.log(`📄 PDF has ${pdf.numPages} pages`);
      
      // Extract each page individually
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const pageData = await this.extractSinglePage(pdf, pageNum);
        this.extractedPages.push(pageData);
        console.log(`✅ Extracted page ${pageNum}/${pdf.numPages}`);
      }
      
      // Consolidate all pages into structured data
      this.consolidatedData = await this.consolidateAllPages();
      
      return {
        pages: this.extractedPages,
        consolidated: this.consolidatedData,
        totalPages: pdf.numPages,
        extractionMethod: 'page_by_page_ocr'
      };
      
    } catch (error) {
      console.error('❌ Page extraction failed:', error);
      throw error;
    }
  }

  async extractSinglePage(pdf, pageNumber) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    
    // Extract raw text
    const rawText = textContent.items
      .map(item => item.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Analyze page content type
    const pageType = this.identifyPageType(rawText);
    
    // Extract structured data based on page type
    const structuredData = this.extractStructuredDataFromPage(rawText, pageType, pageNumber);
    
    return {
      pageNumber,
      pageType,
      rawText,
      textLength: rawText.length,
      structuredData,
      extractedAt: new Date().toISOString()
    };
  }

  identifyPageType(text) {
    const patterns = {
      patient_info: /paciente|patient|protocolo|data de nascimento/i,
      functional_tests: /prova coprológica|consistência|ph|gorduras/i,
      biomarkers: /biomarcadores|calprotectina|zonulina|elastase/i,
      microbiota_overview: /sequenciamento|diversidade|riqueza|abundância/i,
      bacterial_taxonomy: /reino\s+filo\s+classe\s+ordem\s+família/i,
      fungal_analysis: /análise fúngica|candida|malassezia|saccharomyces/i,
      results_table: /bacteria\s+\w+\s+\w+\s+\w+\s+\w+\s+\w+\s+\d+\s+\d+[.,]\d+%/i
    };
    
    const detectedTypes = [];
    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        detectedTypes.push(type);
      }
    }
    
    return detectedTypes.length > 0 ? detectedTypes : ['unknown'];
  }

  extractStructuredDataFromPage(text, pageTypes, pageNumber) {
    const data = {
      pageNumber,
      detectedSections: pageTypes,
      extractedData: {}
    };
    
    // Patient info extraction
    if (pageTypes.includes('patient_info')) {
      data.extractedData.patientInfo = this.extractPatientInfo(text);
    }
    
    // Functional tests extraction
    if (pageTypes.includes('functional_tests')) {
      data.extractedData.functionalTests = this.extractFunctionalTests(text);
    }
    
    // Biomarkers extraction
    if (pageTypes.includes('biomarkers')) {
      data.extractedData.biomarkers = this.extractBiomarkers(text);
    }
    
    // Microbiota overview
    if (pageTypes.includes('microbiota_overview')) {
      data.extractedData.microbiotaOverview = this.extractMicrobiotaOverview(text);
    }
    
    // Bacterial taxonomy table
    if (pageTypes.includes('bacterial_taxonomy') || pageTypes.includes('results_table')) {
      data.extractedData.bacterialEntries = this.extractBacterialTable(text);
    }
    
    // Fungal analysis
    if (pageTypes.includes('fungal_analysis')) {
      data.extractedData.fungalEntries = this.extractFungalEntries(text);
    }
    
    return data;
  }

  extractBacterialTable(text) {
    const entries = [];
    
    // Enhanced bacterial table extraction with multiple robust patterns
    const patterns = [
      // Standard bacteria pattern with flexible spacing
      /Bacteria\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+([^\s]+(?:\s+[^\s]+)*?)\s+([^\s]+(?:\s+[^\s]+)*?)\s+(\d+)\s+(\d+[.,]\d+%)/gi,
      
      // Archaea pattern
      /Archaea\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+([^\s]+(?:\s+[^\s]+)*?)\s+([^\s]+(?:\s+[^\s]+)*?)\s+(\d+)\s+(\d+[.,]\d+%)/gi,
      
      // Alternative pattern for different formatting
      /(Bacteria|Archaea)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+(\d+)\s+(\d+[.,]\d+%)/gi,
      
      // Simplified pattern for partial matches
      /(\w+)\s+(\w+)\s+(\w+)\s+(\w+)\s+([^\s]+)\s+([^\s]+)\s+(\d+)\s+(\d+[.,]\d+%)/g
    ];
    
    const seen = new Set(); // Track unique entries
    
    patterns.forEach((pattern, patternIndex) => {
      let match;
      pattern.lastIndex = 0; // Reset regex state
      
      while ((match = pattern.exec(text)) !== null) {
        let kingdom, phylum, className, order, family, genus, species, quantity, percentage;
        
        if (patternIndex === 0) {
          // Standard bacteria pattern
          kingdom = 'Bacteria';
          phylum = match[1];
          className = match[2];
          order = match[3];
          family = match[4];
          genus = match[5].trim();
          species = match[6].trim();
          quantity = parseInt(match[7]);
          percentage = parseFloat(match[8].replace(',', '.').replace('%', ''));
        } else if (patternIndex === 1) {
          // Archaea pattern
          kingdom = 'Archaea';
          phylum = match[1];
          className = match[2];
          order = match[3];
          family = match[4];
          genus = match[5].trim();
          species = match[6].trim();
          quantity = parseInt(match[7]);
          percentage = parseFloat(match[8].replace(',', '.').replace('%', ''));
        } else if (patternIndex === 2) {
          // Alternative pattern with kingdom detection
          kingdom = match[1];
          phylum = match[2];
          className = match[3];
          order = match[4];
          family = match[5];
          genus = match[6];
          species = match[7];
          quantity = parseInt(match[8]);
          percentage = parseFloat(match[9].replace(',', '.').replace('%', ''));
        } else {
          // Simplified pattern - try to infer structure
          kingdom = 'Bacteria'; // Default assumption
          phylum = match[1];
          className = match[2];
          order = match[3];
          family = match[4];
          genus = match[5];
          species = match[6];
          quantity = parseInt(match[7]);
          percentage = parseFloat(match[8].replace(',', '.').replace('%', ''));
        }
        
        // Create unique identifier
        const uniqueKey = `${kingdom}_${phylum}_${className}_${order}_${family}_${genus}_${species}`;
        
        // Only add if we haven't seen this exact entry before
        if (!seen.has(uniqueKey)) {
          seen.add(uniqueKey);
          entries.push({
            kingdom,
            phylum,
            class: className,
            order,
            family,
            genus,
            species,
            quantity,
            percentage,
            rawMatch: match[0],
            patternUsed: patternIndex + 1
          });
        }
      }
    });
    
    // Sort by percentage descending
    const sortedEntries = entries.sort((a, b) => b.percentage - a.percentage);
    
    console.log(`🧬 Extracted ${sortedEntries.length} unique bacterial/archaeal entries from page`);
    
    // Log top entries for debugging
    if (sortedEntries.length > 0) {
      console.log('📊 Top 5 entries:');
      sortedEntries.slice(0, 5).forEach((entry, idx) => {
        console.log(`  ${idx + 1}. ${entry.genus} ${entry.species}: ${entry.percentage}%`);
      });
    }
    
    return sortedEntries;
  }

  extractPatientInfo(text) {
    return {
      fullName: this.extractPattern(text, /Paciente:\s*([A-ZÁÇÕÉ][A-ZÁÇÕÉa-z\s]+)/i),
      protocol: this.extractPattern(text, /Protocolo:\s*(\d+)/i),
      birthDate: this.extractPattern(text, /Data de nascimento:\s*(\d{2}\/\d{2}\/\d{4})/i),
      collectionDate: this.extractPattern(text, /Data da coleta:\s*(\d{2}\/\d{2}\/\d{4})/i),
      age: this.extractPattern(text, /Idade:\s*(\d+\s*anos)/i),
      weight: this.extractPattern(text, /Peso:\s*([\d,]+\s*Kg)/i),
      height: this.extractPattern(text, /Altura:\s*(\d+)/i),
      sampleType: this.extractPattern(text, /Tipo de amostra:\s*(\w+)/i)
    };
  }

  extractFunctionalTests(text) {
    return {
      consistency: this.extractPattern(text, /Consistência:\s*(Tipo\s*\d+)/i),
      ph: this.extractPattern(text, /pH:\s*(\d+[.,]\d+)/i),
      fats: this.extractPattern(text, /Gorduras:\s*([<>]?\s*\d+[.,]\d*\s*g\/100g)/i),
      proteins: this.extractPattern(text, /Proteínas:\s*([<>]?\s*\d+[.,]\d*)/i),
      carbohydrates: this.extractPattern(text, /Carboidratos:\s*([<>]?\s*\d+[.,]\d*)/i)
    };
  }

  extractBiomarkers(text) {
    return {
      calprotectin: this.extractBiomarker(text, /Calprotectina:\s*(\d+[.,]\d*)\s*(\w+\/\w+)/i),
      zonulin: this.extractBiomarker(text, /Zonulina:\s*(\d+[.,]\d*)\s*(\w+\/\w+)/i),
      elastase: this.extractBiomarker(text, /Elastase:\s*([>]?\d+[.,]\d*)\s*(\w+\/\w+)/i),
      alphaAntitrypsin: this.extractBiomarker(text, /α-1-Antitripsin[a]?:\s*(\d+[.,]\d*)\s*(\w+\/\w+)/i)
    };
  }

  extractBiomarker(text, pattern) {
    const match = text.match(pattern);
    if (match) {
      return {
        value: match[1].replace(',', '.'),
        unit: match[2] || '',
        reference: this.extractReference(text, match[0])
      };
    }
    return null;
  }

  extractReference(text, biomarkerText) {
    // Look for reference range near the biomarker
    const refPattern = /Normal:\s*([^)]+)/i;
    const contextStart = text.indexOf(biomarkerText);
    const contextEnd = contextStart + 200;
    const context = text.slice(contextStart, contextEnd);
    const match = context.match(refPattern);
    return match ? match[1].trim() : '';
  }

  extractMicrobiotaOverview(text) {
    return {
      fbAbundance: this.extractPattern(text, /Abundância.*F\+B\s*(\d+[.,]\d+%)/i),
      fbProportion: this.extractPattern(text, /Proporção.*F\/B\s*(\d+[.,]\d+)/i),
      diversity: this.extractPattern(text, /DIVERSIDADE\s*(\d+[.,]\d+)/i),
      richness: this.extractPattern(text, /RIQUEZA\s*(\d+)/i),
      distribution: this.extractPattern(text, /DISTRIBUIÇÃO\s*(\w+)/i)
    };
  }

  extractFungalEntries(text) {
    const fungi = [];
    
    // Pattern for fungal entries: Name Quantity (Percentage)
    const fungiPattern = /(Candida|Malassezia|Saccharomyces)\s+([^\s]+)\s+(\d+)\s*\((\d+[.,]\d+%)\)/gi;
    
    let match;
    while ((match = fungiPattern.exec(text)) !== null) {
      fungi.push({
        genus: match[1],
        species: match[2],
        quantity: parseInt(match[3]),
        percentage: parseFloat(match[4].replace(',', '.').replace('%', '')),
        fullName: `${match[1]} ${match[2]}`
      });
    }
    
    return fungi;
  }

  extractPattern(text, pattern) {
    const match = text.match(pattern);
    return match ? match[1].trim() : null;
  }

  async consolidateAllPages() {
    console.log('🔗 Consolidating data from all pages...');
    
    const consolidated = {
      patientInfo: {},
      functionalTests: {},
      biomarkers: {},
      microbiotaOverview: {},
      bacterialTaxonomy: [],
      fungalAnalysis: [],
      metadata: {
        totalPages: this.extractedPages.length,
        extractionTimestamp: new Date().toISOString(),
        pagesAnalyzed: this.extractedPages.map(p => ({
          page: p.pageNumber,
          type: p.pageType,
          dataCount: Object.keys(p.structuredData.extractedData).length
        }))
      }
    };
    
    // Merge data from all pages
    this.extractedPages.forEach(pageData => {
      const { extractedData } = pageData.structuredData;
      
      // Merge patient info
      if (extractedData.patientInfo) {
        Object.assign(consolidated.patientInfo, extractedData.patientInfo);
      }
      
      // Merge functional tests
      if (extractedData.functionalTests) {
        Object.assign(consolidated.functionalTests, extractedData.functionalTests);
      }
      
      // Merge biomarkers
      if (extractedData.biomarkers) {
        Object.assign(consolidated.biomarkers, extractedData.biomarkers);
      }
      
      // Merge microbiota overview
      if (extractedData.microbiotaOverview) {
        Object.assign(consolidated.microbiotaOverview, extractedData.microbiotaOverview);
      }
      
      // Append bacterial entries
      if (extractedData.bacterialEntries) {
        consolidated.bacterialTaxonomy.push(...extractedData.bacterialEntries);
      }
      
      // Append fungal entries
      if (extractedData.fungalEntries) {
        consolidated.fungalAnalysis.push(...extractedData.fungalEntries);
      }
    });
    
    // Remove duplicates and sort
    consolidated.bacterialTaxonomy = this.removeDuplicateBacteria(consolidated.bacterialTaxonomy);
    consolidated.fungalAnalysis = this.removeDuplicateFungi(consolidated.fungalAnalysis);
    
    console.log(`✅ Consolidated ${consolidated.bacterialTaxonomy.length} unique bacterial entries`);
    console.log(`✅ Consolidated ${consolidated.fungalAnalysis.length} unique fungal entries`);
    
    return consolidated;
  }

  removeDuplicateBacteria(bacteria) {
    const seen = new Set();
    return bacteria.filter(entry => {
      const key = `${entry.kingdom}_${entry.phylum}_${entry.class}_${entry.order}_${entry.family}_${entry.genus}_${entry.species}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => b.percentage - a.percentage);
  }

  removeDuplicateFungi(fungi) {
    const seen = new Set();
    return fungi.filter(entry => {
      const key = entry.fullName;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => b.percentage - a.percentage);
  }

  getDebugInfo() {
    return {
      totalPages: this.extractedPages.length,
      pagesAnalyzed: this.extractedPages.map(p => ({
        page: p.pageNumber,
        type: p.pageType,
        textLength: p.textLength,
        sectionsFound: p.structuredData.detectedSections
      })),
      consolidatedCounts: {
        bacterialEntries: this.consolidatedData.bacterialTaxonomy?.length || 0,
        fungalEntries: this.consolidatedData.fungalAnalysis?.length || 0,
        biomarkers: Object.keys(this.consolidatedData.biomarkers || {}).length,
        functionalTests: Object.keys(this.consolidatedData.functionalTests || {}).length
      }
    };
  }
}

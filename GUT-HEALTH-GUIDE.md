# 🦠 Gut Health Analysis System

## Overview
The Gut Health Analysis system provides AI-powered analysis of intestinal checkup reports, similar to the genetic analysis system but focused on digestive health, microbiome, and gut function.

## Features

### ✅ **PDF Processing**
- Upload intestinal checkup PDFs
- Automatic text extraction and parsing
- Structured data extraction for key biomarkers

### ✅ **AI Analysis**
- Gastroenterologist-level AI analysis
- 350 tokens (~175 words) limit for concise insights
- Plain text formatting (no markdown)
- Actionable recommendations

### ✅ **Caching System**
- Results cached after first generation
- Persist across page reloads and navigation
- Individual refresh button for re-analysis
- Manual cache clearing capability

### ✅ **Data Extraction**
The system automatically extracts:

#### Patient Information
- Name, age, collection date

#### Functional Coprological Tests
- Stool consistency, pH, neutral fats
- Muscle fibers, starch, cellulose
- Crystals, blood cells, parasites

#### Biomarkers
- **Calprotectin**: Inflammation indicator
- **Zonulin**: Gut barrier integrity
- **Pancreatic Elastase**: Digestive function
- **Fatty acids**: Fat absorption

#### Microbiota Analysis
- Abundance (F+B ratio)
- Diversity and richness
- Protective bacteria levels:
  - Akkermansia muciniphila
  - Faecalibacterium prausnitzii  
  - Bifidobacterium spp
- Pathogenic species detection

## Usage

### 1. **Access the Page**
Navigate to: `/gut-health` or use the header menu: Specialized Tests → 🦠 Gut Health Analysis

### 2. **Upload Report**
- Click the upload area
- Select your intestinal checkup PDF
- Wait for processing (automatic text extraction)

### 3. **Review Results**
- Patient information display
- Comprehensive AI analysis
- Raw data view (for debugging)

### 4. **Refresh Analysis**
- Use the "🔄 Refresh AI Analysis" button to regenerate
- Clears cache and calls OpenAI API again

## AI Analysis Includes

### **Digestive Health Assessment**
- Overall gut function evaluation
- Inflammation and barrier integrity
- Microbiome balance analysis

### **Health Implications**
- Risk factors identification
- Potential digestive conditions
- Malabsorption indicators

### **Dietary Recommendations**
- Foods to include/avoid
- Nutritional strategies
- Gut-healing protocols

### **Lifestyle Interventions**
- Stress management
- Exercise recommendations
- Sleep optimization

### **Targeted Interventions**
- Specific probiotics
- Prebiotic recommendations
- Supplement protocols

### **Monitoring Guidelines**
- Symptoms to watch
- Retest timing
- Follow-up recommendations

## Technical Details

### **File Structure**
```
pages/gut-health.js          # Main gut health page
lib/ai-prompts.js           # AI prompt configuration
pages/api/smart-blurb.js    # Enhanced API with gut health support
components/SmartBlurb.tsx   # AI analysis component with refresh
components/header.js        # Navigation with gut health link
```

### **AI Configuration**
```javascript
// In lib/ai-prompts.js
export const GUT_HEALTH_MAX_TOKENS = 350;
export const GUT_HEALTH_MAX_WORDS = 175;
export const GUT_HEALTH_ANALYSIS_PROMPT = `...`;
```

### **Caching**
- Cache key: `gut_health_analysis_[hash]`
- Stored in localStorage
- Automatic cache invalidation on data changes
- Manual refresh capability

### **Data Format**
```javascript
{
  testType: 'gut_health',
  patientInfo: { name, age, collectionDate },
  functionalTests: { consistency, pH, neutralFats },
  biomarkers: { calprotectin, zonulin, elastase },
  microbiota: { 
    abundance, proportion, diversity, richness,
    protectiveBacteria: { akkermansia, faecalibacterium, bifidobacterium }
  }
}
```

## Testing

### **Parsing Test**
Run `test-gut-health-parsing.js` in browser console to verify data extraction.

### **AI Test**
Use the refresh button or check browser console for OpenAI API status.

## Troubleshooting

### **PDF Not Processing**
- Ensure file is a valid PDF
- Check browser console for errors
- Verify PDF.js library loads correctly

### **AI Analysis Fails**
- Check OpenAI API key configuration
- Verify network connectivity
- Review browser console for error messages

### **Data Not Parsing**
- Check PDF text format matches expected patterns
- Run parsing test script
- Review regex patterns in parsing function

## Integration with Existing System

The gut health system integrates seamlessly with:
- ✅ Existing SmartBlurb component
- ✅ Shared AI prompt system
- ✅ Common caching mechanism
- ✅ Unified navigation structure
- ✅ Consistent UI/UX patterns

This provides a cohesive experience across all health analysis tools in the application.

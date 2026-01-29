# AI Instructions Location Guide

## Blood Test Results AI Instructions
**Location:** `lib/ai-prompts.js`
**Export:** `SMART_BLURB_PROMPT`
**Usage:** Used automatically by the SmartBlurb component for blood test analysis

### Key Features:
- Tailored for a 25-year-old physically active male
- Handles reference ranges and trends
- Focuses on single cohesive paragraph format
- About 100 words / 250 tokens
- Professional, neutral tone

## Genetic Analysis AI Instructions
**Location:** `lib/ai-prompts.js` 
**Export:** `GENETIC_ANALYSIS_PROMPT(category)`
**Usage:** Used by SmartBlurb component in lifecode.js for genetic analysis

### Key Features:
- Takes category parameter (e.g., "Cardiovascular", "Metabolism")
- No markdown formatting
- Doesn't repeat percentages (shown on left side)
- Plain text with clear paragraphs
- Comprehensive analysis covering 6 sections:
  1. Risk Assessment Overview
  2. Health Implications  
  3. Lifestyle Recommendations
  4. Medical Monitoring
  5. Preventive Strategies
  6. Personalized Action Plan

## How to Modify AI Instructions

### For Blood Tests:
Edit the `SMART_BLURB_PROMPT` in `lib/ai-prompts.js`

### For Genetic Analysis:
Edit the `GENETIC_ANALYSIS_PROMPT` function in `lib/ai-prompts.js`

Both prompts are now centralized in the same file for easy management and consistency.

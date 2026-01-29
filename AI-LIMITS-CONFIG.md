# AI Analysis Limits Configuration

## Blood Test Analysis
- **Max Tokens**: 250
- **Max Words**: ~100
- **Style**: Single cohesive paragraph (4-6 sentences)
- **Focus**: Concise, clinical analysis with reference ranges

## Genetic Analysis  
- **Max Tokens**: 400
- **Max Words**: ~200
- **Style**: Clear paragraphs, plain text
- **Focus**: Comprehensive but concise actionable insights

## Gut Health Analysis
- **Max Tokens**: 350
- **Max Words**: ~175
- **Style**: Clear paragraphs, plain text
- **Focus**: Digestive health insights and interventions

## Token vs Word Relationship
- Approximately 1 token = 0.5 words for English text
- 250 tokens ≈ 100-125 words
- 400 tokens ≈ 175-225 words

## Comparison

| Analysis Type | Max Tokens | Max Words | Purpose |
|---------------|------------|-----------|---------|
| Blood Tests   | 250        | ~100      | Quick clinical insights |
| Genetic       | 400        | ~200      | Detailed health guidance |
| Gut Health    | 350        | ~175      | Digestive health analysis |

## Configuration Location
All limits are defined in: `lib/ai-prompts.js`

```javascript
export const SMART_BLURB_MAX_TOKENS = 250;
export const SMART_BLURB_MAX_WORDS = 100;
export const GENETIC_ANALYSIS_MAX_TOKENS = 400;
export const GENETIC_ANALYSIS_MAX_WORDS = 200;
export const GUT_HEALTH_MAX_TOKENS = 350;
export const GUT_HEALTH_MAX_WORDS = 175;
```

## Usage
- Blood test prompts automatically include the limits
- Genetic analysis prompts include limits and guidance for conciseness
- API calls respect the token limits to prevent overly long responses

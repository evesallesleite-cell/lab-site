# OpenAI API Setup Guide

## The "detailed AI analysis is currently unavailable" Error

This error appears when the OpenAI API is not working properly. Here's how to fix it:

### 1. Check if OpenAI API Key is Configured

Open your browser console and run the test script:
```javascript
// Copy and paste the contents of test-openai-config.js
```

### 2. Add OpenAI API Key (if missing)

Create or edit `.env.local` in your project root:
```
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Get an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Create a new API key
4. Copy the key and add it to your `.env.local` file

### 4. Restart Development Server

After adding the API key:
```bash
npm run dev
```

### 5. Test the Fix

1. Use the "🔄 Refresh All AI" button on the page
2. Or use individual category refresh buttons
3. Check browser console for debug messages

## New Refresh Functionality

### Individual Category Refresh
- Each category now has a 🔄 button next to the title
- Clears cache for that specific category only
- Regenerates AI analysis for that category

### Refresh All Categories
- "🔄 Refresh All AI" button at the top
- Clears all genetic analysis cache
- Refreshes the entire page to regenerate all analyses

## Troubleshooting

### Still Getting Fallback Messages?
1. Check browser console for error messages
2. Verify API key is valid and has credits
3. Check OpenAI API status page
4. Try the test script in browser console

### Cache Issues?
- Use refresh buttons to clear cache
- Or manually run: `clear-genetic-cache.js` in console

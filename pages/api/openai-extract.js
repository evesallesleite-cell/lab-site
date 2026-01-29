// API endpoint for AI-powered bacteria extraction
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a medical data extraction specialist. Extract bacteria, microorganisms, and fungi from medical reports. Return ONLY valid JSON arrays, no explanations or markdown."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0,
      max_tokens: 1500
    });

    const extractedData = completion.choices[0]?.message?.content?.trim() || '[]';
    
    // Clean the response to ensure it's valid JSON
    let cleanData = extractedData;
    if (cleanData.startsWith('```json')) {
      cleanData = cleanData.replace(/```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleanData.startsWith('```')) {
      cleanData = cleanData.replace(/```\s*/, '').replace(/```\s*$/, '');
    }

    // Validate JSON
    try {
      JSON.parse(cleanData);
    } catch (parseError) {
      console.error('Invalid JSON from OpenAI:', cleanData);
      return res.status(200).json({ extractedData: '[]' });
    }

    return res.status(200).json({ 
      extractedData: cleanData,
      tokensUsed: completion.usage?.total_tokens || 0
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    return res.status(500).json({ 
      error: 'Failed to process with AI',
      details: error.message 
    });
  }
}
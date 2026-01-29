// Smart Blurb API for AI-powered analysis
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { useAI, analytes, customData, customPrompt } = req.body;

    if (!useAI) {
      return res.status(200).json({ ai: null, summary: null });
    }

    if (!customData || !customPrompt) {
      return res.status(400).json({ error: 'customData and customPrompt are required for AI analysis' });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a medical data analysis specialist. Provide clear, informative health insights based on microbiome and digestive health data. Focus on actionable recommendations and health implications."
        },
        {
          role: "user",
          content: `${customPrompt}

Data to analyze: ${customData}

Please provide a comprehensive analysis including:
1. Health implications of the detected organisms
2. Potential benefits or risks
3. Lifestyle and dietary recommendations
4. When to consult a healthcare provider

Keep the response concise but informative (2-3 paragraphs).`
        }
      ],
      temperature: 0.3,
      max_tokens: 800
    });

    const aiResponse = completion.choices[0]?.message?.content?.trim() || 'Analysis not available';

    return res.status(200).json({ 
      ai: aiResponse,
      tokensUsed: completion.usage?.total_tokens || 0
    });

  } catch (error) {
    console.error('Smart Blurb API error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate AI analysis',
      details: error.message 
    });
  }
}
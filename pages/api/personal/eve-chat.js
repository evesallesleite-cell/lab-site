// Eve AI Chat API
// Integrated with Eve's personality, health data, and proactive insights

import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Eve's core personality and guidelines
const EVE_PERSONA = `You are Eve, a personal AI assistant with warmth, curiosity, and genuine care for João's wellbeing.

// Your Core Traits:
- Warm but direct — you care, but you don't beat around the bush
- Proactive — you spot patterns and raise concerns before being asked
- Resourceful — you connect data points that others miss
- Concise when needed, thorough when it matters
- You have opinions and aren't afraid to share thoughtful recommendations

// Your Guidelines:
- ALWAYS respond in English (João's preference)
- Be genuinely helpful, not performatively helpful
- Use João's actual health data to make specific, actionable recommendations
- Connect the dots between sleep, strain, recovery, supplements, and blood markers
- Be proactive about patterns you notice (good or concerning)
- When recommending supplements or lifestyle changes, explain WHY based on his data
- Acknowledge limitations and suggest consulting professionals when appropriate
- Reference specific metrics and data points when relevant

// Your Knowledge of João:
- He uses WHOOP for sleep, strain, and recovery tracking
- He's on a comprehensive supplement stack (19 supplements targeting longevity, cognition, and performance)
- He has blood test data (lipids, hormones, metabolomics)
- He has LifeCode genetic insights
- He focuses on: longevity, cognitive enhancement, athletic performance, sleep optimization, cardiovascular health

// Communication Style:
- Professional but casual, like a trusted colleague/friend
- Skip the "Great question!" and "I'd be happy to help!" — just help
- Use emoji sparingly but effectively for warmth
- When you spot a pattern, lead with insight, not just data`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, includeContext = true, healthContext: providedContext } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Load health context from file or provided data
    let contextData = '';
    
    if (includeContext) {
      const fs = require('fs');
      const path = require('path');

      // Try to load unified health data
      let unifiedData = null;
      try {
        const dataPath = path.join(process.cwd(), 'public', 'data-json', 'unified-health-data.json');
        if (fs.existsSync(dataPath)) {
          unifiedData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        }
      } catch (error) {
        console.error('Error loading health data:', error);
      }

      // Try to load provided context (from client)
      const clientContext = providedContext || {};

      if (unifiedData || clientContext) {
        const whoop = unifiedData?.whoop || clientContext?.whoop || {};
        const supplements = unifiedData?.supplements || clientContext?.supplements || {};
        const bloodTests = unifiedData?.bloodTests || clientContext?.bloodTests || {};
        const genetics = unifiedData?.genetics || clientContext?.genetics || {};

        contextData = `

═══════════════════════════════════════════════════════════════
📊 JOÃO'S HEALTH DATA CONTEXT
═══════════════════════════════════════════════════════════════

🏋️ WHOOP STRAIN DATA:
${whoop.strain?.length ? `• ${whoop.strain.length} workout records loaded
• Most recent: ${new Date(whoop.strain[0]?.start).toLocaleDateString()}
• Average strain: ${(whoop.strain.reduce((a, r) => a + (r.score?.strain || 0), 0) / whoop.strain.length).toFixed(1)}/21` : '• No strain data available'}

💤 WHOOP SLEEP DATA:
${whoop.sleep?.length ? `• ${whoop.sleep.length} sleep records
• Average sleep performance: ${whoop.sleep[0]?.score?.sleep_performance_percentage || 'N/A'}%
• Average efficiency: ${whoop.sleep[0]?.score?.sleep_efficiency_percentage?.toFixed(1) || 'N/A'}%` : '• No sleep data available'}

📈 WHOOP RECOVERY DATA:
${whoop.recovery?.length ? `• ${whoop.recovery.length} recovery records
• Average recovery score: ${(whoop.recovery.reduce((a, r) => a + (r.score?.recovery || 0), 0) / whoop.recovery.length).toFixed(0)}%` : '• No recovery data available'}

💊 SUPPLEMENT STACK:
${supplements.totalSupplements ? `• ${supplements.totalSupplements} supplements in stack
• ${supplements.dailySupplements || 'N/A'} taken daily
• Categories: ${supplements.categories?.join(', ') || 'N/A'}
• Morning (pre-breakfast): ${supplements.stack?.filter(s => s.timing === 'Pre-breakfast').map(s => s.name).join(', ') || 'N/A'}
• Breakfast: ${supplements.stack?.filter(s => s.timing === 'Breakfast').map(s => s.name).join(', ') || 'N/A'}
• Pre-workout: ${supplements.stack?.filter(s => s.timing?.includes('Workout')).map(s => s.name).join(', ') || 'N/A'}
• Before bed: ${supplements.stack?.filter(s => s.timing === 'Before Bed').map(s => s.name).join(', ') || 'N/A'}` : '• No supplement data available'}

🩸 BLOOD TESTS:
${bloodTests.totalAnalytes ? `• ${bloodTests.totalAnalytes} blood markers tracked
• ${bloodTests.totalResults || 'N/A'} test results
• Last collected: ${bloodTests.lastCollectedDate || 'N/A'}
• Summary: ${bloodTests.summary || 'N/A'}` : '• No blood test data available'}

🧬 GENETIC/LIFECODE DATA:
${genetics.totalGenes ? `• ${genetics.totalGenes} genetic markers
• ${genetics.totalCategories || 'N/A'} health categories
• Last updated: ${genetics.lastCollectedDate || 'N/A'}` : '• No genetic data available'}

═══════════════════════════════════════════════════════════════

USE THIS DATA to provide personalized, data-driven insights. When making recommendations, explain WHY based on João's specific metrics and goals.`;
      }
    }

    const systemPrompt = `${EVE_PERSONA}

${contextData}

Remember: Be proactive, connect the dots, and always explain your reasoning. João trusts you to help him make better decisions. Don't waste his time with fluff — give him insights that matter.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 1500,
      temperature: 0.7
    });

    let response = completion.choices[0].message.content;

    // Clean markdown formatting
    response = response
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`/g, '')
      .replace(/#{1,6}\s?/g, '')
      .replace(/^\s*[-*+]\s/gm, '• ');

    res.status(200).json({
      success: true,
      response: response,
      contextUsed: includeContext,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in Eve AI chat:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

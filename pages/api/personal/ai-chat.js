import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, includeContext = true } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let systemPrompt = `You are a personal health AI assistant with access to comprehensive health data. You provide personalized insights, recommendations, and analysis based on the user's actual health metrics, supplement stack, and lifestyle data.

Key guidelines:
- Be conversational but professional
- Provide specific insights based on the actual data
- Make connections between different health metrics
- Suggest actionable recommendations
- Always mention when you're referencing specific data points
- Be honest about limitations and suggest consulting healthcare providers for medical decisions
- Pay attention to temporal context in questions (e.g., "this year", "2024", "recently")
- When users ask about "this year" or current timeframes, use the current year data
- When users specify a particular year, use that year's data
- When no timeframe is specified, you can reference either timeframe but clarify which you're using`;

    let contextData = "";

    if (includeContext) {
      // Load full strain data for the AI
      const fs = require('fs');
      const path = require('path');
      
      let strainData = null;
      try {
        // Load the complete strain JSON data
        const strainDataPath = path.join(process.cwd(), 'data/strain-data.json');
        strainData = JSON.parse(fs.readFileSync(strainDataPath, 'utf8'));
      } catch (error) {
        console.error('Error loading strain data:', error);
        strainData = { records: [] };
      }

      // Calculate comprehensive analytics
      const totalRecords = strainData.records.length;
      const yearStats = {};
      const dayStats = {};
      const sportStats = {};
      const gymStats = { totalSessions: 0, totalStrain: 0, strainScores: [] };
      
      strainData.records.forEach(record => {
        const startDate = new Date(record.start);
        const year = startDate.getFullYear();
        const dayOfWeek = startDate.toLocaleDateString('en-US', { weekday: 'long' });
        const sportId = record.sport_id;
        const strain = record.score?.strain || 0;
        
        // Year stats
        if (!yearStats[year]) {
          yearStats[year] = { total: 0, sports: {} };
        }
        yearStats[year].total += 1;
        yearStats[year].sports[sportId] = (yearStats[year].sports[sportId] || 0) + 1;
        
        // Day of week stats
        if (!dayStats[dayOfWeek]) {
          dayStats[dayOfWeek] = { total: 0, gym: 0 };
        }
        dayStats[dayOfWeek].total += 1;
        
        // Sport stats
        sportStats[sportId] = (sportStats[sportId] || 0) + 1;
        
        // Gym-specific analytics (sport_id 45)
        if (sportId === 45) {
          dayStats[dayOfWeek].gym += 1;
          gymStats.totalSessions += 1;
          gymStats.totalStrain += strain;
          gymStats.strainScores.push(strain);
        }
      });
      
      // Calculate gym averages
      const avgGymStrain = gymStats.totalSessions > 0 ? (gymStats.totalStrain / gymStats.totalSessions).toFixed(2) : 0;
      
      // Sort days by gym frequency
      const gymDaysSorted = Object.entries(dayStats)
        .sort((a, b) => b[1].gym - a[1].gym)
        .map(([day, stats]) => ({ day, gymSessions: stats.gym, totalWorkouts: stats.total }));

      contextData = `

COMPLETE WHOOP STRAIN DATA:
==========================

You have access to ${totalRecords} complete workout records from the WHOOP API.

SPORT ID REFERENCE:
- 45 = Weightlifting (gym)
- 34 = Tennis
- 52 = Hiking/Rucking  
- 59 = Walking
- 66 = Padel

YEARLY BREAKDOWN:
${Object.entries(yearStats).map(([year, stats]) => {
  const gymSessions = stats.sports[45] || 0;
  const tennisSessions = stats.sports[34] || 0;
  const hikingSessions = stats.sports[52] || 0;
  return `${year}: ${stats.total} total workouts (${gymSessions} gym, ${tennisSessions} tennis, ${hikingSessions} hiking)`;
}).join('\n')}

GYM DAY-OF-WEEK ANALYSIS:
Most Frequent Gym Day: ${gymDaysSorted[0]?.day || 'N/A'} (${gymDaysSorted[0]?.gymSessions || 0} sessions)
Complete Gym Schedule:
${gymDaysSorted.map(({ day, gymSessions }) => `${day}: ${gymSessions} gym sessions`).join('\n')}

GYM PERFORMANCE METRICS:
Total Gym Sessions: ${gymStats.totalSessions}
Average Gym Strain Score: ${avgGymStrain} (out of 21)
Total Strain from Gym: ${gymStats.totalStrain.toFixed(1)}

SAMPLE RECORDS (showing data structure):
${JSON.stringify(strainData.records.slice(0, 2), null, 2)}

ANALYSIS CAPABILITIES:
You can analyze the complete ${totalRecords} workout records including:
- Exact workout counts by year, month, day of week  
- Heart rate patterns (average_heart_rate, max_heart_rate fields)
- Strain scores and intensity analysis (strain field 0-21 scale)
- Workout duration and timing patterns (start/end timestamps)
- Specific sport analysis and trends (sport_id field)
- Caloric expenditure (kilojoule field - multiply by 0.239 for calories)

ANALYSIS INSTRUCTIONS:
Use the PRE-CALCULATED analytics above to answer questions directly:
- Day patterns: Reference the "GYM DAY-OF-WEEK ANALYSIS" section
- Gym performance: Use the "GYM PERFORMANCE METRICS" section  
- Yearly trends: Reference the "YEARLY BREAKDOWN" section
- The data shows ${gymDaysSorted[0]?.day || 'N/A'} is your most frequent gym day with ${gymDaysSorted[0]?.gymSessions || 0} sessions
- Your average gym strain score is ${avgGymStrain} out of 21

Answer questions with the specific calculated numbers provided above.

Use this data to provide personalized insights and recommendations. Reference specific metrics when relevant.`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt + contextData
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    let response = completion.choices[0].message.content;
    
    // Clean markdown formatting (remove asterisks and other markdown symbols)
    response = response
      .replace(/\*\*/g, '') // Remove bold markdown
      .replace(/\*/g, '')   // Remove italic markdown
      .replace(/`/g, '')    // Remove code markdown
      .replace(/#{1,6}\s?/g, '') // Remove header markdown
      .replace(/^\s*[-*+]\s/gm, '• '); // Convert markdown lists to bullet points

    res.status(200).json({
      success: true,
      response: response,
      contextUsed: includeContext,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
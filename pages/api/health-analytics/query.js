// Main analytics query endpoint that uses OpenAI to translate natural language to tool calls
import OpenAI from 'openai';
import { 
  runTimeSeries, 
  runCohortCompare, 
  runCorrelation, 
  runSqlQuery, 
  getAvailableMetrics 
} from '../../../lib/health-analytics-tools';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const SYSTEM_PROMPT = `You are a health analytics assistant. You analyze personal health data from WHOOP devices, including sleep, recovery, strain, and supplement data.

Your role is to translate natural language questions into structured tool calls. You have access to these tools:

1. **timeseries** - Get metric values over time periods
   - Parameters: metric (string), start_date (YYYY-MM-DD), end_date (YYYY-MM-DD), group_by ('day'|'week'|'month')
   - Use for: trends, patterns over time, "show my weekly HRV"

2. **cohort_compare** - Compare average metric between two groups
   - Parameters: metric (string), condition_a (description), condition_b (description)
   - Use for: A/B comparisons, "did X improve Y?", supplement effects

3. **correlation** - Calculate correlation between two metrics
   - Parameters: metric_x (string), metric_y (string), lag_days (number, 0-7)
   - Use for: "is X correlated with Y?", relationship analysis

4. **sql_query** - Run custom SQL for complex analysis
   - Parameters: query (string), description (string)
   - Use for: complex queries that don't fit other tools

Available metrics include:
- strain, kilojoules, average_heart_rate, max_heart_rate
- sleep_efficiency, respiratory_rate, sleep_performance, restorative_sleep
- time_in_bed, light_sleep, deep_sleep, rem_sleep
- recovery_score, resting_heart_rate, hrv, spo2, skin_temp

CRITICAL RULES:
1. ALWAYS respond with exactly ONE tool call - never plain text responses
2. Choose the most appropriate tool for the question
3. Use realistic date ranges (data spans 2024-2025)
4. For supplement questions, use cohort_compare to compare days with/without supplements
5. For trends, use timeseries with appropriate grouping
6. For relationships, use correlation
7. Be specific with metric names - use exact names from the list above

Example mappings:
- "Show weekly HRV last 3 months" → timeseries(metric="hrv", start_date="2024-06-16", end_date="2024-09-16", group_by="week")
- "Did magnesium improve sleep?" → cohort_compare(metric="sleep_efficiency", condition_a="took magnesium", condition_b="no magnesium")
- "Is strain related to recovery?" → correlation(metric_x="strain", metric_y="recovery_score", lag_days=1)`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get available metrics for context
    const availableMetrics = await getAvailableMetrics();

    // Call OpenAI to get structured tool call
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "timeseries",
            description: "Get time series data for a metric over a date range",
            parameters: {
              type: "object",
              properties: {
                metric: { 
                  type: "string",
                  enum: availableMetrics
                },
                start_date: { 
                  type: "string",
                  pattern: "^\\d{4}-\\d{2}-\\d{2}$"
                },
                end_date: { 
                  type: "string", 
                  pattern: "^\\d{4}-\\d{2}-\\d{2}$"
                },
                group_by: { 
                  type: "string", 
                  enum: ["day", "week", "month"] 
                }
              },
              required: ["metric", "start_date", "end_date", "group_by"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "cohort_compare",
            description: "Compare average metric between two conditions/cohorts",
            parameters: {
              type: "object",
              properties: {
                metric: { 
                  type: "string",
                  enum: availableMetrics
                },
                condition_a: { 
                  type: "string",
                  description: "Description of first condition (e.g., 'took magnesium')"
                },
                condition_b: { 
                  type: "string",
                  description: "Description of second condition (e.g., 'no magnesium')"
                }
              },
              required: ["metric", "condition_a", "condition_b"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "correlation",
            description: "Calculate correlation between two metrics",
            parameters: {
              type: "object",
              properties: {
                metric_x: { 
                  type: "string",
                  enum: availableMetrics
                },
                metric_y: { 
                  type: "string",
                  enum: availableMetrics
                },
                lag_days: { 
                  type: "number",
                  minimum: 0,
                  maximum: 7,
                  description: "Days to lag metric_y (0 = same day)"
                }
              },
              required: ["metric_x", "metric_y", "lag_days"]
            }
          }
        }
      ],
      tool_choice: "required"
    });

    const toolCall = completion.choices[0].message.tool_calls[0];
    const functionName = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);

    let result;
    let sql = null;

    // Execute the appropriate tool
    switch (functionName) {
      case 'timeseries':
        result = await runTimeSeries(args.metric, args.start_date, args.end_date, args.group_by);
        break;
      case 'cohort_compare':
        result = await runCohortCompare(args.metric, args.condition_a, args.condition_b);
        break;
      case 'correlation':
        result = await runCorrelation(args.metric_x, args.metric_y, args.lag_days);
        break;
      default:
        throw new Error(`Unknown function: ${functionName}`);
    }

    // Generate response text based on results
    let responseText = generateResponseText(functionName, args, result);

    res.json({
      success: true,
      response: responseText,
      data: result.data,
      sql: result.sql,
      toolUsed: functionName
    });

  } catch (error) {
    console.error('Error in health analytics query:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

function generateResponseText(functionName, args, result) {
  switch (functionName) {
    case 'timeseries':
      if (result.data && result.data.length > 0) {
        const latest = result.data[result.data.length - 1];
        const earliest = result.data[0];
        return `Here's your ${args.metric} trend from ${args.start_date} to ${args.end_date}, grouped by ${args.group_by}:\n\n` +
               `Latest ${args.group_by}: ${latest.value}\n` +
               `Earliest ${args.group_by}: ${earliest.value}\n` +
               `Total data points: ${result.data.length}`;
      }
      return `No data found for ${args.metric} in the specified time range.`;

    case 'cohort_compare':
      if (result.data && result.data.length >= 2) {
        const cohortA = result.data.find(d => d.cohort === 'A');
        const cohortB = result.data.find(d => d.cohort === 'B');
        const diff = cohortA.avg_metric - cohortB.avg_metric;
        const percentDiff = ((diff / cohortB.avg_metric) * 100).toFixed(1);
        
        return `Comparing ${args.metric} between conditions:\n\n` +
               `${args.condition_a}: ${cohortA.avg_metric.toFixed(2)} (${cohortA.n} days)\n` +
               `${args.condition_b}: ${cohortB.avg_metric.toFixed(2)} (${cohortB.n} days)\n\n` +
               `Difference: ${diff > 0 ? '+' : ''}${diff.toFixed(2)} (${percentDiff}%)`;
      }
      return `Insufficient data for comparison.`;

    case 'correlation':
      if (result.data) {
        const strength = Math.abs(result.data.correlation);
        let strengthDesc = '';
        if (strength > 0.7) strengthDesc = 'strong';
        else if (strength > 0.3) strengthDesc = 'moderate';
        else strengthDesc = 'weak';

        return `Correlation analysis between ${args.metric_x} and ${args.metric_y}` +
               (args.lag_days > 0 ? ` (${args.lag_days} day lag)` : '') + ':\n\n' +
               `Correlation coefficient: ${result.data.correlation.toFixed(3)} (${strengthDesc})\n` +
               `Statistical significance: ${result.data.p_value < 0.05 ? 'Significant' : 'Not significant'} (p=${result.data.p_value.toFixed(3)})\n` +
               `Sample size: ${result.data.n} data points`;
      }
      return `Could not calculate correlation.`;

    default:
      return 'Analysis complete.';
  }
}
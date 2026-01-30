import fs from "fs";
import path from "path";

const WHOOP_DATA_PATH = process.env.WHOOP_DATA_PATH || path.join(process.cwd(), "..", "clawd", "health-data", "whoop");

// Simple CSV parser
function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const record = {};
    headers.forEach((header, i) => {
      record[header] = values[i] || '';
    });
    return record;
  });
}

export default async function handler(req, res) {
  try {
    const sleepsPath = path.join(WHOOP_DATA_PATH, "sleeps.csv");
    
    // Check if file exists
    if (!fs.existsSync(sleepsPath)) {
      return res.json([]);
    }

    const fileContent = fs.readFileSync(sleepsPath, "utf-8");
    const records = parseCSV(fileContent);

    // Parse dates and format data
    const sleepData = records.map((record, index) => {
      const parseDate = (dateStr) => {
        if (!dateStr) return null;
        try {
          return new Date(dateStr).toISOString();
        } catch {
          return null;
        }
      };

      const parseInt = (val) => {
        if (!val) return null;
        const num = parseFloat(val);
        return isNaN(num) ? null : Math.round(num);
      };

      const parseFloat = (val) => {
        if (!val) return null;
        const num = parseFloat(val);
        return isNaN(num) ? null : num;
      };

      return {
        id: index,
        cycleStartTime: parseDate(record["Cycle start time"]),
        sleepOnset: parseDate(record["Sleep onset"]),
        wakeOnset: parseDate(record["Wake onset"]),
        sleepPerformance: parseFloat(record["Sleep performance %"]),
        respiratoryRate: parseFloat(record["Respiratory rate (rpm)"]),
        asleepDuration: parseInt(record["Asleep duration (min)"]),
        inBedDuration: parseInt(record["In bed duration (min)"]),
        lightDuration: parseInt(record["Light sleep duration (min)"]),
        deepDuration: parseInt(record["Deep (SWS) duration (min)"]),
        remDuration: parseInt(record["REM duration (min)"]),
        awakeDuration: parseInt(record["Awake duration (min)"]),
        sleepNeed: parseInt(record["Sleep need (min)"]),
        sleepDebt: parseInt(record["Sleep debt (min)"]),
        sleepEfficiency: parseFloat(record["Sleep efficiency %"]),
        sleepConsistency: parseFloat(record["Sleep consistency %"]),
        isNap: record["Nap"] === "true"
      };
    });

    // Sort by date (newest first)
    sleepData.sort((a, b) => {
      const dateA = a.cycleStartTime ? new Date(a.cycleStartTime).getTime() : 0;
      const dateB = b.cycleStartTime ? new Date(b.cycleStartTime).getTime() : 0;
      return dateB - dateA;
    });

    res.json(sleepData);
  } catch (error) {
    console.error("Whoop sleep API error:", error);
    res.status(500).json({ error: "Failed to load sleep data" });
  }
}

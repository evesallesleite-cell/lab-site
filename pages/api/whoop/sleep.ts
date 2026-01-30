import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const WHOOP_DATA_PATH = process.env.WHOOP_DATA_PATH || path.join(process.cwd(), "..", "clawd", "health-data", "whoop");

export default async function handler(req, res) {
  try {
    const sleepsPath = path.join(WHOOP_DATA_PATH, "sleeps.csv");
    
    // Check if file exists
    if (!fs.existsSync(sleepsPath)) {
      return res.json([]);
    }

    const fileContent = fs.readFileSync(sleepsPath, "utf-8");
    
    // Parse CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });

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

      return {
        id: index,
        cycleStartTime: parseDate(record["Cycle start time"]),
        sleepOnset: parseDate(record["Sleep onset"]),
        wakeOnset: parseDate(record["Wake onset"]),
        sleepPerformance: record["Sleep performance %"] ? parseFloat(record["Sleep performance %"]) : null,
        respiratoryRate: record["Respiratory rate (rpm)"] ? parseFloat(record["Respiratory rate (rpm)"]) : null,
        asleepDuration: record["Asleep duration (min)"] ? parseInt(record["Asleep duration (min)"]) : null,
        inBedDuration: record["In bed duration (min)"] ? parseInt(record["In bed duration (min)"]) : null,
        lightDuration: record["Light sleep duration (min)"] ? parseInt(record["Light sleep duration (min)"]) : null,
        deepDuration: record["Deep (SWS) duration (min)"] ? parseInt(record["Deep (SWS) duration (min)"]) : null,
        remDuration: record["REM duration (min)"] ? parseInt(record["REM duration (min)"]) : null,
        awakeDuration: record["Awake duration (min)"] ? parseInt(record["Awake duration (min)"]) : null,
        sleepNeed: record["Sleep need (min)"] ? parseInt(record["Sleep need (min)"]) : null,
        sleepDebt: record["Sleep debt (min)"] ? parseInt(record["Sleep debt (min)"]) : null,
        sleepEfficiency: record["Sleep efficiency %"] ? parseFloat(record["Sleep efficiency %"]) : null,
        sleepConsistency: record["Sleep consistency %"] ? parseFloat(record["Sleep consistency %"]) : null,
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

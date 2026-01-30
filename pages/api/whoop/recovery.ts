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
    const cyclesPath = path.join(WHOOP_DATA_PATH, "physiological_cycles.csv");
    
    if (!fs.existsSync(cyclesPath)) {
      return res.json([]);
    }

    const fileContent = fs.readFileSync(cyclesPath, "utf-8");
    const records = parseCSV(fileContent);

    // Parse dates and format data
    const recoveryData = records.map((record, index) => {
      const parseDate = (dateStr) => {
        if (!dateStr) return null;
        try {
          return new Date(dateStr).toISOString();
        } catch {
          return null;
        }
      };

      const parseFloat = (val) => {
        if (!val) return null;
        const num = parseFloat(val);
        return isNaN(num) ? null : num;
      };

      return {
        id: index,
        cycleStartTime: parseDate(record["Cycle start time"]),
        cycleEndTime: parseDate(record["Cycle end time"]),
        recoveryScore: parseFloat(record["Recovery score %"]),
        rhr: parseFloat(record["Resting heart rate (bpm)"]),
        hrv: parseFloat(record["Heart rate variability (ms)"]),
        skinTemp: parseFloat(record["Skin temp (celsius)"]),
        bloodOxygen: parseFloat(record["Blood oxygen %"]),
        strain: record["Day Strain"] ? parseFloat(record["Day Strain"]) : null,
        energyBurned: record["Energy burned (cal)"] ? parseFloat(record["Energy burned (cal)"]) : null,
        maxHR: parseFloat(record["Max HR (bpm)"]),
        avgHR: parseFloat(record["Average HR (bpm)"])
      };
    });

    // Sort by date (newest first)
    recoveryData.sort((a, b) => {
      const dateA = a.cycleStartTime ? new Date(a.cycleStartTime).getTime() : 0;
      const dateB = b.cycleStartTime ? new Date(b.cycleStartTime).getTime() : 0;
      return dateB - dateA;
    });

    res.json(recoveryData);
  } catch (error) {
    console.error("Whoop recovery API error:", error);
    res.status(500).json({ error: "Failed to load recovery data" });
  }
}

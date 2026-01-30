import fs from "fs";
import path from "path";

const HEALTH_DATA_PATH = process.env.HEALTH_DATA_PATH || path.join(process.cwd(), "..", "clawd", "health-data", "unified", "unified-health.json");

export default async function handler(req, res) {
  try {
    // For production (Vercel), try environment variable first
    let dataPath = HEALTH_DATA_PATH;
    
    // If file doesn't exist or we're in production, return sample data structure
    if (!fs.existsSync(dataPath)) {
      // Return empty structure for production
      return res.json({
        appleHealth: null,
        whoop: null,
        note: "Health data not configured. Set HEALTH_DATA_PATH environment variable or run locally."
      });
    }

    const fileContent = fs.readFileSync(dataPath, "utf-8");
    const healthData = JSON.parse(fileContent);

    // Return the relevant sections
    res.json({
      appleHealth: healthData.apple_health || null,
      whoop: healthData.whoop || null,
      meta: healthData.meta || null
    });
  } catch (error) {
    console.error("Health data API error:", error);
    res.status(500).json({ error: "Failed to load health data" });
  }
}

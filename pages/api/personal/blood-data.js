// API to fetch blood test data from Supabase
import { createOptionalClient, isSupabaseConfigured } from '../../../lib/supabase-optional';

const supabase = createOptionalClient();

export default async function handler(req, res) {
  try {
    console.log("[/api/personal/blood-data] start");
    
    // Return demo data if Supabase not configured
    if (!isSupabaseConfigured()) {
      return res.status(200).json({
        demo: true,
        message: 'Supabase not configured - showing demo data',
        recentResults: [],
        analyteGroups: {},
        summary: {
          totalRecords: 0,
          analytes: [],
          dateRange: null
        }
      });
    }
    
    // Fetch blood test results
    const { data, error } = await supabase
      .from("blood")
      .select("*")
      .order("collected_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    // Group by analyte and get recent results
    const analyteGroups = {};
    const recentResults = [];

    for (const record of data || []) {
      const analyte = record.analyte?.trim();
      if (!analyte) continue;

      if (!analyteGroups[analyte]) {
        analyteGroups[analyte] = [];
      }
      analyteGroups[analyte].push(record);
    }

    // Get most recent result for each analyte
    Object.entries(analyteGroups).forEach(([analyte, records]) => {
      const latest = records.sort((a, b) => new Date(b.collected_at) - new Date(a.collected_at))[0];
      recentResults.push({
        analyte,
        value: latest.value,
        unit: latest.unit,
        reference_range: latest.reference_range,
        collected_at: latest.collected_at,
        reported_at: latest.reported_at
      });
    });

    // Calculate summary stats
    const totalAnalytes = Object.keys(analyteGroups).length;
    const totalResults = data?.length || 0;
    const lastCollectedDate = data?.[0]?.collected_at || null;

    const summary = {
      totalAnalytes,
      totalResults,
      lastCollectedDate,
      recentResults: recentResults.slice(0, 20), // Top 20 most recent
      allResults: data || []
    };

    console.log("[/api/personal/blood-data] ok, analytes:", totalAnalytes);
    res.status(200).json({ success: true, data: summary });
    
  } catch (e) {
    console.error("[/api/personal/blood-data] ERROR:", e);
    res.status(500).json({ success: false, error: String(e?.message || e) });
  }
}
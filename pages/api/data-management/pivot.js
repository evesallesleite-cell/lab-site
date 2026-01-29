// pages/api/pivot.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  try {
    // Read full analyte_matrix rows (analyte + date columns named d_YYYY_MM_DD)
    const { data, error } = await supabase
      .from("analyte_matrix")
      .select("*")
      .order("analyte", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    // Discover date columns (keys that start with "d_") and convert to ISO date strings YYYY-MM-DD
    const datesSet = new Set();
    for (const r of data) {
      for (const k of Object.keys(r || {})) {
        if (k && k.startsWith("d_")) {
          // column name like d_2025_08_15 -> 2025-08-15
          const iso = k.slice(2).replace(/_/g, "-");
          datesSet.add(iso);
        }
      }
    }
    const dates = Array.from(datesSet).sort();

    // Build rows: for each analyte, collect values for each discovered date
    const rows = (data || []).map(r => {
      const values = {};
      for (const k of Object.keys(r || {})) {
        if (k.startsWith("d_")) {
          const iso = k.slice(2).replace(/_/g, "-");
          values[iso] = r[k] ?? null;
        }
      }
      return {
        analyte: r.analyte,
        units: r.units ?? null,
        ref_low: r.ref_low ?? null,
        ref_high: r.ref_high ?? null,
        cols: dates.map(d => values[d] ?? null)
      };
    });

    res.status(200).json({ dates, rows });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
}

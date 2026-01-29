// pages/api/explore.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    const analytesCsv = (req.query.analytes || "").toString();
    const from = req.query.from ? String(req.query.from) : null;
    const to   = req.query.to   ? String(req.query.to)   : null;

    console.log("[/api/explore] params:", { analytesCsv, from, to });

    const analytes = analytesCsv
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    if (analytes.length === 0) {
      return res.status(400).json({ error: "No analytes selected" });
    }

    let q = supabase
      .from("blood")
      .select("analyte, collected_at, value_numeric")
      .not("value_numeric", "is", null);

    if (from) q = q.gte("collected_at", from);
    if (to)   q = q.lte("collected_at", to);

    const { data, error } = await q;
    if (error) throw error;

    const wanted = new Set(analytes.map(a => a.toLowerCase()));
    const filtered = (data || []).filter(r =>
      wanted.has((r.analyte || "").toLowerCase())
    );

    // average by day per analyte
    const byKey = new Map(); // analyte|day -> {sum,n,analyte,day}
    for (const r of filtered) {
      if (!r.collected_at) continue;
      const day = new Date(r.collected_at).toISOString().slice(0, 10);
      const key = `${(r.analyte || "").toLowerCase()}|${day}`;
      const prev = byKey.get(key) || { sum: 0, n: 0, analyte: r.analyte, day };
      prev.sum += Number(r.value_numeric);
      prev.n += 1;
      byKey.set(key, prev);
    }

    const rows = Array.from(byKey.values()).map(v => ({
      analyte: v.analyte,
      day: v.day,
      value: v.sum / v.n
    }));

    console.log("[/api/explore] ok, rows:", rows.length);
    res.status(200).json({ rows });
  } catch (e) {
    console.error("[/api/explore] ERROR:", e);
    res.status(500).json({ error: String(e?.message || e) });
  }
}

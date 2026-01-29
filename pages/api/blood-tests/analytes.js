// pages/api/analytes.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    console.log("[/api/analytes] start");
    const { data, error } = await supabase
      .from("blood")
      .select("analyte")
      .not("analyte", "is", null);

    if (error) throw error;

    const set = new Set();
    for (const r of data || []) {
      const name = (r.analyte || "").trim();
      if (name) set.add(name);
    }
    const list = Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );

    console.log("[/api/analytes] ok, count:", list.length);
    res.status(200).json({ analytes: list });
  } catch (e) {
    console.error("[/api/analytes] ERROR:", e);
    res.status(500).json({ error: String(e?.message || e) });
  }
}

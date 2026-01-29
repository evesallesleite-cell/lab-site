export default async function handler(req, res) {
  try {
    const jobId = (req.query?.jobId || req.body?.jobId || "").toString();
    if (!jobId) return res.status(400).json({ error: "missing jobId" });

    const JOBS = global.JOBS || new Map();
    const job = JOBS.get(jobId);
    if (!job) return res.status(404).json({ error: "job not found" });

    if (!job.done) return res.status(409).json({ error: "job not finished" });

    // If CSV was stored in job.csv send it, otherwise attempt to build minimal CSV from rows
    if (job.csv) {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="lab_results_${jobId}.csv"`);
      return res.status(200).send(job.csv);
    }

    // fallback: build CSV from job.rows if available
    const rows = Array.isArray(job.rows) ? job.rows : [];
    if (!rows.length) return res.status(204).end();

    // derive date columns and pivot same as ingest logic (simple fallback)
    const slugify = s => String(s || "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    const toDateKey = d => (d || "").slice(0,10).replace(/-/g,"_");

    const datesSet = new Set();
    for (const r of rows) {
      const dateIso = (r.collected_at || r.reported_at || "").slice(0,10);
      if (dateIso) datesSet.add(toDateKey(dateIso));
    }
    const dateCols = Array.from(datesSet).sort((a,b)=>a.localeCompare(b));
    const matrix = new Map();
    for (const r of rows) {
      const key = slugify(r.analyte || "");
      if (!key) continue;
      const dateIso = (r.collected_at || r.reported_at || "").slice(0,10);
      if (!dateIso) continue;
      const col = `d_${toDateKey(dateIso)}`;
      const obj = matrix.get(key) || { analyte_key: key, units: r.units || null };
      if (obj[col] == null) {
        if (r.value_numeric != null) obj[col] = r.value_numeric;
        else if (r.value_text) obj[col] = r.value_text;
      }
      if (!obj.units && r.units) obj.units = r.units;
      matrix.set(key, obj);
    }

    const header = ["analyte_key","units", ...dateCols.map(d=>`d_${d}`)];
    const escapeCsv = f => {
      if (f == null) return "";
      const s = String(f);
      if (s.includes('"')||s.includes(",")||s.includes("\n")) return `"${s.replace(/"/g,'""')}"`;
      return s;
    };
    const rowsCsv = [header.join(",")];
    for (const key of Array.from(matrix.keys()).sort()) {
      const rowObj = matrix.get(key);
      const row = [
        escapeCsv(rowObj.analyte_key),
        escapeCsv(rowObj.units),
        ...dateCols.map(d => escapeCsv(rowObj[`d_${d}`]))
      ];
      rowsCsv.push(row.join(","));
    }
    const csv = rowsCsv.join("\r\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="lab_results_${jobId}.csv"`);
    return res.status(200).send(csv);
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
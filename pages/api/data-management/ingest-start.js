import formidable from "formidable";
import fs from "fs";
import pdf from "pdf-parse";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = { api: { bodyParser: false } };

// in-memory jobs (resets when dev server restarts)
const JOBS = global.JOBS || new Map();
global.JOBS = JOBS;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* ---------------- helpers ---------------- */
function cleanJson(str) {
  const s = String(str || "").trim();
  if (s.startsWith("```")) return s.replace(/```json\s*/i, "").replace(/```$/, "").trim();
  return s;
}

function slugify(s = "") {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normUnits(units, valueNum) {
  const u = (units || "").toLowerCase().trim();
  if (u.includes("/mm3")) {
    if (u.includes("milh")) return { units: "10^6/µL", value: valueNum };
    return { units: "cells/µL", value: valueNum };
  }
  if (u === "g/dl") return { units: "g/dL", value: valueNum };
  if (u === "fl") return { units: "fL", value: valueNum };
  if (u === "%") return { units: "%", value: valueNum };
  if (u === "pg") return { units: "pg", value: valueNum };
  return { units, value: valueNum };
}

function decimalCommaToDot(s) {
  if (!s) return null;
  return String(s).replace(/(\d),(\d)/g, "$1.$2").trim();
}

// prefer sample date terms; avoid release/print dates
function extractDates(ptText) {
  const text = String(ptText || "");
  const ddmmyyyy = /([0-3]\d)\/([01]\d)\/(\d{4})/g;
  const goodHints = [
    "RECEBIDO/COLETADO EM",
    "COLETADO EM",
    "RECEBIDO EM",
    "DATA DA FICHA",
    "COLETA",
    "COLETADO:"
  ];
  const badHints = ["LIBERADO EM", "EXAME LIBERADO EM", "IMPRESSO EM"];

  let collected = null, reported = null;
  for (const line of text.split(/\r?\n/)) {
    const L = line.toUpperCase();
    const dates = [...line.matchAll(ddmmyyyy)].map(m => `${m[3]}-${m[2]}-${m[1]}`); // ISO
    if (!dates.length) continue;
    if (goodHints.some(h => L.includes(h))) collected = collected || dates[0];
    else if (badHints.some(h => L.includes(h))) reported = reported || dates[0];
  }
  if (!collected) {
    const m = text.match(ddmmyyyy);
    if (m) {
      const x = m[0].match(/([0-3]\d)\/([01]\d)\/(\d{4})/);
      if (x) collected = `${x[3]}-${x[2]}-${x[1]}`;
    }
  }
  return { collected_at: collected, reported_at: reported };
}

function normalizeRow(r, collected_hint, reported_hint) {
  const analyte = (r.analyte || "").toLowerCase();

  const n = normUnits(r.units, r.value_numeric);
  const ref_low =
    typeof r.ref_low === "string" ? Number(r.ref_low.replace(",", ".")) : r.ref_low ?? null;
  const ref_high =
    typeof r.ref_high === "string" ? Number(r.ref_high.replace(",", ".")) : r.ref_high ?? null;

  const collected_at = collected_hint || r.collected_at || null;
  const reported_at = reported_hint || r.reported_at || collected_at || null;

  return {
    collected_at,
    reported_at,
    panel: r.panel || null,
    analyte: analyte || null,
    value_numeric: typeof n.value === "number" ? n.value : null,
    value_text: decimalCommaToDot(r.value_text),
    units: n.units || null,
    ref_low,
    ref_high,
    flag: r.flag || null,
    source_filename: r.source_filename || null
  };
}

/* ---------------- job helpers ---------------- */
function ensureJob(jobId, base = {}) {
  const existing = JOBS.get(jobId) || {};
  const job = {
    jobId,
    processed: existing.processed ?? 0,
    total: existing.total ?? 1,
    done: existing.done ?? false,
    rows: existing.rows ?? [],
    error: existing.error ?? null,
    source: existing.source ?? base.source ?? null,
    status: existing.status ?? base.status ?? "created",
    logs: existing.logs ?? [],
    lastLog: existing.lastLog ?? null,
    ...base
  };
  JOBS.set(jobId, job);
  return job;
}

function appendLog(jobId, message, status = undefined) {
  const job = JOBS.get(jobId) || { jobId, logs: [] };
  const logs = (job.logs || []).concat([`${new Date().toISOString()} ${message}`]);
  const updated = {
    ...job,
    logs,
    lastLog: logs[logs.length - 1],
    status: status ?? job.status
  };
  JOBS.set(jobId, updated);
  console.log(`[JOB ${jobId}] ${message}`);
}

/* ---------------- PDF processing ---------------- */
async function processPdfIntoRows(filePath, sourceFileName, jobId = null, onPage = null) {
  if (jobId) appendLog(jobId, "Reading PDF from disk");
  const buf = fs.readFileSync(filePath);
  const parsed = await pdf(buf);
  const pages = (parsed.text || "").split("\f");
  const total = Math.max(1, pages.length);

  let allRows = [];

  for (let i = 0; i < total; i++) {
    const pageText = pages[i] || "";
    if (jobId) appendLog(jobId, `Starting processing page ${i + 1} / ${total}`, "processing");
    const { collected_at, reported_at } = extractDates(pageText);

    const sys = [
      "You extract clinical lab results from raw report text. Return ONLY a JSON array (no markdown).",
      "Each item is an object with fields:",
      "- collected_at (YYYY-MM-DD)",
      "- reported_at (YYYY-MM-DD)",
      "- panel",
      "- analyte (write EXACTLY as appears in the report — keep language, accents, and casing)",
      "- value_numeric",
      "- value_text",
      "- units",
      "- ref_low",
      "- ref_high",
      "- flag (H/L/N if provided)",
      "",
      "Rules:",
      "1) Emit one object per measured analyte. If both TOTAL and FREE/‘livre’ variants appear (e.g., ‘Testosterona’ and ‘Testosterona livre’), output BOTH as separate items.",
      "2) Prefer absolute counts over percentages when both are shown (e.g., leukocytes subgroup lines that show % and /mm3: use the absolute /mm3 number as value_numeric; keep the % out of value_numeric).",
      "3) For qualitative results (negative/positive, absent/present, detected/not detected, reactive/non-reactive etc.), set value_numeric to 0 for negative/absent/not detected/non-reactive and 1 for positive/present/detected/reactive. Also keep the original wording in value_text.",
      "4) For numeric results, set value_numeric to the number. Always use a dot as decimal separator (e.g., 1.27). Do not place ranges in value_numeric.",
      "5) If a line contains a reference range, put its lower/upper bounds into ref_low/ref_high as numbers (dot decimals).",
      "6) Keep units exactly as shown near the result (e.g., mg/dL, U/L, fL, /mm3, pmol/L, ng/dL).",
      "7) Use sample dates on page for collected_at/reported_at when present; do not invent dates.",
      "8) Output must be valid JSON with an array at top level."
    ].join("\n");

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: pageText }
      ]
    });

    let content = cleanJson(resp.choices[0]?.message?.content || "[]");
    let rows = [];
    try {
      const j = JSON.parse(content);
      if (Array.isArray(j)) rows = j;
    } catch (err) {
      rows = [];
      if (jobId) appendLog(jobId, `JSON parse failed on page ${i + 1}: ${String(err?.message || err)}`, "warning");
    }

    const normalized = rows.map(r => normalizeRow(r, collected_at, reported_at));
    allRows = allRows.concat(normalized);

    // report progress: prefer caller-provided callback; otherwise update local job progress
    if (typeof onPage === "function") {
      try { onPage(); } catch (e) {}
    } else if (jobId) {
      const job = JOBS.get(jobId) || {};
      JOBS.set(jobId, { ...job, processed: (job.processed || 0) + 1, total, done: false });
      appendLog(jobId, `Completed page ${i + 1} / ${total}`);
    }
  }

  // DEDUPE by (analyte(lowercase), collected_at)
  const unique = new Map();
  for (const row of allRows) {
    if (!row.analyte || !row.collected_at) continue;
    const key = `${row.analyte}__${row.collected_at}`;
    if (!unique.has(key)) unique.set(key, row); // keep first occurrence
  }
  const uniqueRows = Array.from(unique.values());
  return { uniqueRows, totalPages: total };
}

// add canonical mapping and helper so it's available where used (e.g. background processing)
const KNOWN = new Set([
  "eritrocitos","hemoglobina","hematocrito",
  "ldl_colesterol","colesterol_total","hdl_colesterol","triglicerides",
  "vldl_colesterol","nao_hdl_colesterol","glicose",
  "tgo","tgp","t4_livre","tsh","testosterona","testosterona_livre","vitamina_d_25oh",
  "creatinina"
]);

const SYN = new Map([
  ["ldl-colesterol", "ldl_colesterol"],
  ["25_hidroxi_vitamina_d", "vitamina_d_25oh"],
  ["25_oh_vitamina_d", "vitamina_d_25oh"],
  ["hormonio_tiroestimulante_tsh", "tsh"],
  ["creatinina_soro", "creatinina"],
  ["creatinina_serum", "creatinina"],
  ["creatinine", "creatinina"],
  ["creatinine_serum", "creatinina"],
  ["creatinina_urina", "creatinina"]
]);

function toAnalyteKey(raw) {
  const base = slugify(raw || "");
  if (!base) return null;
  if (KNOWN.has(base)) return base;
  if (SYN.has(base)) return SYN.get(base);
  if (base.includes("hdl")) return "hdl_colesterol";
  if (base.includes("ldl")) return "ldl_colesterol";
  if (base.includes("vldl")) return "vldl_colesterol";
  if (base.includes("nao") && base.includes("hdl")) return "nao_hdl_colesterol";
  return base;
}

/* ------------------------- API handler ------------------------- */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    // add an optional onPage callback so caller can track global progress
    async function processPdfIntoRows(filePath, sourceFileName, jobId = null, onPage = null) {
      if (jobId) appendLog(jobId, "Reading PDF from disk");
      const buf = fs.readFileSync(filePath);
      const parsed = await pdf(buf);
      const pages = (parsed.text || "").split("\f");
      const total = Math.max(1, pages.length);

      let allRows = [];

      for (let i = 0; i < total; i++) {
        const pageText = pages[i] || "";
        if (jobId) appendLog(jobId, `Starting processing page ${i + 1} / ${total}`, "processing");
        const { collected_at, reported_at } = extractDates(pageText);

        const sys = [
          "You extract clinical lab results from raw report text. Return ONLY a JSON array (no markdown).",
          "Each item is an object with fields:",
          "- collected_at (YYYY-MM-DD)",
          "- reported_at (YYYY-MM-DD)",
          "- panel",
          "- analyte (write EXACTLY as appears in the report — keep language, accents, and casing)",
          "- value_numeric",
          "- value_text",
          "- units",
          "- ref_low",
          "- ref_high",
          "- flag (H/L/N if provided)",
          "",
          "Rules:",
          "1) Emit one object per measured analyte. If both TOTAL and FREE/‘livre’ variants appear (e.g., ‘Testosterona’ and ‘Testosterona livre’), output BOTH as separate items.",
          "2) Prefer absolute counts over percentages when both are shown (e.g., leukocytes subgroup lines that show % and /mm3: use the absolute /mm3 number as value_numeric; keep the % out of value_numeric).",
          "3) For qualitative results (negative/positive, absent/present, detected/not detected, reactive/non-reactive etc.), set value_numeric to 0 for negative/absent/not detected/non-reactive and 1 for positive/present/detected/reactive. Also keep the original wording in value_text.",
          "4) For numeric results, set value_numeric to the number. Always use a dot as decimal separator (e.g., 1.27). Do not place ranges in value_numeric.",
          "5) If a line contains a reference range, put its lower/upper bounds into ref_low/ref_high as numbers (dot decimals).",
          "6) Keep units exactly as shown near the result (e.g., mg/dL, U/L, fL, /mm3, pmol/L, ng/dL).",
          "7) Use sample dates on page for collected_at/reported_at when present; do not invent dates.",
          "8) Output must be valid JSON with an array at top level."
        ].join("\n");

        const resp = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0,
          messages: [
            { role: "system", content: sys },
            { role: "user", content: pageText }
          ]
        });

        let content = cleanJson(resp.choices[0]?.message?.content || "[]");
        let rows = [];
        try {
          const j = JSON.parse(content);
          if (Array.isArray(j)) rows = j;
        } catch (err) {
          rows = [];
          if (jobId) appendLog(jobId, `JSON parse failed on page ${i + 1}: ${String(err?.message || err)}`, "warning");
        }

        const normalized = rows.map(r => normalizeRow(r, collected_at, reported_at));
        allRows = allRows.concat(normalized);

        // report progress: prefer caller-provided callback; otherwise update local job progress
        if (typeof onPage === "function") {
          try { onPage(); } catch (e) {}
        } else if (jobId) {
          const job = JOBS.get(jobId) || {};
          JOBS.set(jobId, { ...job, processed: (job.processed || 0) + 1, total, done: false });
          appendLog(jobId, `Completed page ${i + 1} / ${total}`);
        }
      }

      // DEDUPE by (analyte(lowercase), collected_at)
      const unique = new Map();
      for (const row of allRows) {
        if (!row.analyte || !row.collected_at) continue;
        const key = `${row.analyte}__${row.collected_at}`;
        if (!unique.has(key)) unique.set(key, row); // keep first occurrence
      }
      const uniqueRows = Array.from(unique.values());
      return { uniqueRows, totalPages: total };
    }

    // replace single-file synchronous handling with immediate jobId return and background processing
    const form = formidable({ multiples: true });
    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(400).json({ error: "Upload parse failed" });

      const uploaded = Array.isArray(files?.file) ? files.file : files?.file ? [files.file] : [];
      if (!uploaded.length) return res.status(400).json({ error: "No file uploaded" });

      const jobId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      // pre-scan to compute total pages across all PDFs
      let totalPages = 0;
      for (const f of uploaded) {
        const path = f.filepath || f.path || f.file;
        try {
          const buf = fs.readFileSync(path);
          const parsed = await pdf(buf);
          // prefer explicit page count if provided by pdf-parse, fallback to splitting text
          const pages = (parsed.numpages || (parsed.text || "").split("\f").length || 1);
          totalPages += pages;
        } catch (e) {
          // if we can't parse now, conservatively count 1 page so we don't divide by zero
          totalPages += 1;
        }
      }

      ensureJob(jobId, {
        processed: 0,
        total: totalPages || 1,
        done: false,
        rows: [],
        error: null,
        source: uploaded.map(x => x.originalFilename || x.filename || x.name).join(","),
        status: "received"
      });
      appendLog(jobId, `Upload received: ${uploaded.map(x => x.originalFilename || x.filename || x.name).join(", ")}`, "received");

      // immediately respond with jobId so client can poll progress
      res.status(202).json({ jobId });

      // background processing
      (async () => {
        try {
          appendLog(jobId, "Starting background PDF -> rows processing", "processing");
          let allRows = [];

          // incremental updater for job processed count
          function incrementProcessed() {
            const job = JOBS.get(jobId) || {};
            const newProcessed = (job.processed || 0) + 1;
            JOBS.set(jobId, { ...job, processed: newProcessed, total: job.total || totalPages, done: false });
          }

          for (const f of uploaded) {
            const path = f.filepath || f.path || f.file;
            const name = f.originalFilename || f.filename || f.name || "upload.pdf";
            appendLog(jobId, `Processing file ${name}`, "processing");

            const { uniqueRows } = await processPdfIntoRows(path, name, jobId, incrementProcessed);
            allRows = allRows.concat(uniqueRows);
            try { fs.unlinkSync(path); } catch {}
          }

          appendLog(jobId, `Extraction complete. ${allRows.length} rows collected across files`, "extracted");

          // existing pivot/merge logic (KNOWN, SYN, toAnalyteKey) and CSV building...
          // Build set of date columns (d_YYYY_MM_DD) across allRows
          const datesSet = new Set();
          for (const r of allRows) {
            const dateIso = (r.collected_at || r.reported_at || "").slice(0, 10);
            if (!dateIso) continue;
            datesSet.add(dateIso.replace(/-/g, "_"));
          }
          // sort ascending (oldest -> newest)
          const dateCols = Array.from(datesSet).sort((a, b) => a.localeCompare(b));

          // Pivot rows into analyte-key -> row with date columns (same merging logic as before)
          const matrix = new Map();
          for (const r of allRows) {
            const keyCandidate = toAnalyteKey(r.analyte);
            const key = keyCandidate || slugify(r.analyte || "");
            if (!key) continue;

            const dateIso = (r.collected_at || r.reported_at || "").slice(0, 10);
            if (!dateIso) continue;
            const colbase = dateIso.replace(/-/g, "_");
            const colName = `d_${colbase}`;

            const existing = matrix.get(key) || {
              analyte_key: key,
              units: r.units || null
            };

            if (existing[colName] == null) {
              if (r.value_numeric != null) existing[colName] = r.value_numeric;
              else if (r.value_text) existing[colName] = r.value_text;
            } else {
              if (typeof existing[colName] !== "number" && r.value_numeric != null) {
                existing[colName] = r.value_numeric;
              }
            }

            if (!existing.units && r.units) existing.units = r.units;
            matrix.set(key, existing);
          }

          // Build CSV headers ordered least->greatest by date
          const header = ["analyte_key", "units", ...dateCols.map(d => `d_${d}`)];
          function escapeCsv(field) {
            if (field == null) return "";
            const s = String(field);
            if (s.includes('"') || s.includes(",") || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
            return s;
          }

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

          // after building csv string:
          const csv = rowsCsv.join("\r\n");

          // store csv in job so client can fetch it
          const existingJob = JOBS.get(jobId) || { logs: [] };
          const finalJob = {
            ...existingJob,
            processed: existingJob.total || totalPages,
            total: existingJob.total || totalPages,
            done: true,
            rows: allRows,
            csv, // store CSV
            error: null,
            status: "done"
          };
          JOBS.set(jobId, finalJob);
          appendLog(jobId, "CSV ready", "done");
        } catch (e) {
          const errMsg = String(e?.message || e);
          const existingLogs = JOBS.get(jobId)?.logs || [];
          JOBS.set(jobId, { ...(JOBS.get(jobId) || {}), error: errMsg, done: true, logs: existingLogs.concat([`${new Date().toISOString()} ${errMsg}`]) });
          appendLog(jobId, `Background processing failed: ${errMsg}`, "error");
        }
      })();
    });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
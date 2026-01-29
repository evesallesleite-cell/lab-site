import { createClient } from "@supabase/supabase-js";
import { SMART_BLURB_PROMPT, GENETIC_ANALYSIS_MAX_TOKENS, GUT_HEALTH_MAX_TOKENS } from "../../lib/ai-prompts";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Metabase configuration
const METABASE_URL = process.env.METABASE_URL;
const METABASE_SESSION = process.env.METABASE_SESSION;

// OpenAI configuration
const OPENAI_KEY = process.env.OPENAI_API_KEY;

export default async function handler(req, res) {
  try {
    // ensure callers don't get cached/old responses
    res.setHeader("Cache-Control", "no-store");

    if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
    const { cardId } = req.body || {};
    const debug = (req.query && req.query.debug === "1") || (req.body && req.body.debug);
    
    // Handle custom genetic data and prompt early - skip all database lookups
    if (req.body && req.body.customData && req.body.customPrompt) {
      const customData = req.body.customData;
      const customPrompt = req.body.customPrompt;
      let promptText = customPrompt;
      
      console.log(`[smart-blurb] Processing custom analysis for: ${customData?.categoryName || customData?.testType || 'unknown'}`);
      console.log(`[smart-blurb] OpenAI API key configured: ${OPENAI_KEY ? 'Yes' : 'No'}`);
      
      // Detect analysis type and set appropriate limits
      const isGutHealth = customPrompt?.includes('gastroenterologist') || 
                         customPrompt?.includes('intestinal') || 
                         customData?.testType === 'gut_health';
      const maxTokens = isGutHealth ? GUT_HEALTH_MAX_TOKENS : GENETIC_ANALYSIS_MAX_TOKENS;
      const analysisType = isGutHealth ? 'gut health' : 'genetic';
      
      console.log(`[smart-blurb] Analysis type: ${analysisType}, max tokens: ${maxTokens}`);
      
      // Call OpenAI with custom data
      let aiRewrite = null;
      if (OPENAI_KEY) {
        try {
          const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${OPENAI_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "gpt-4",
              messages: [
                { 
                  role: "system", 
                  content: `You are a health expert providing comprehensive, actionable analysis. Use plain text formatting only - no markdown, no bold/italic text, no bullet points with special characters. Write in clear paragraphs. Do not repeat exact values or reference ranges as they are already displayed to the user. Focus on health implications and actionable recommendations. Keep responses concise, around ${maxTokens} tokens.` 
                },
                { role: "user", content: promptText }
              ],
              max_tokens: maxTokens,
              temperature: 0.7
            })
          });
          
          if (response.ok) {
            const result = await response.json();
            aiRewrite = result.choices?.[0]?.message?.content?.trim() || null;
            console.log(`[smart-blurb] Generated AI analysis for ${customData?.categoryName}: ${aiRewrite ? 'Success' : 'Failed - no content'}`);
          } else {
            const errorText = await response.text();
            console.error("[smart-blurb] OpenAI error:", response.status, errorText);
          }
        } catch (e) {
          console.error("[smart-blurb] OpenAI exception:", e);
        }
      } else {
        console.warn("[smart-blurb] No OpenAI API key configured");
      }
      
      // If AI analysis failed, provide a fallback summary based on the genetic data
      if (!aiRewrite && customData) {
        const { categoryName, totalMarkers, highRiskCount, moderateRiskCount, lowRiskCount, markers } = customData;
        
        const apiKeyStatus = OPENAI_KEY ? "configured but request failed" : "not configured";
        
        aiRewrite = `${categoryName} Genetic Analysis

This genetic profile reveals important insights about your predispositions in this health category.

Your genetic profile shows ${totalMarkers} relevant markers with varying levels of influence on your health risks. The distribution includes ${highRiskCount || 0} high-impact variants, ${moderateRiskCount || 0} moderate-impact variants, and ${lowRiskCount || 0} lower-impact variants.

General Recommendations:
Given these genetic predispositions, it would be beneficial to discuss personalized monitoring and intervention strategies with a healthcare provider. Consider focusing on lifestyle modifications that can positively influence the expression of these genetic variants.

Note: Advanced AI analysis is currently unavailable (OpenAI API ${apiKeyStatus}). Use the refresh button to try again, or ensure your OpenAI API key is properly configured in your environment variables.`;
      }
      
      return res.json({ 
        ai: aiRewrite, 
        data: customData, 
        debug: debug ? { customData, promptText, aiGenerated: !!aiRewrite } : null 
      });
    }
    
    // small debug helper to parse dates robustly
    function parseDateVal(raw) {
      if (!raw) return null;
      // handle ISO / RFC strings and epoch seconds
      const asNum = Number(raw);
      if (Number.isFinite(asNum)) {
        // if it's 10 digits, assume seconds -> ms
        return new Date(asNum && String(raw).length === 10 ? asNum * 1000 : asNum);
      }
      const d = new Date(raw);
      return isNaN(d.getTime()) ? null : d;
    }
    
    // helper to safely convert values to numbers
    function safeNum(val) {
      if (val === null || val === undefined || val === "") return null;
      const num = Number(val);
      return Number.isFinite(num) ? num : null;
    }
    console.log(`[smart-blurb] debug=${debug} cardId=${cardId}`);
    let rows = [];
    // extracted reference range for the requested analyte (if present in rows)
    let refRange = { low: null, high: null };
    let debugInfo = { rawRowsSample: null, parsedDatesSample: null, maxDate: null, minDate: null };
 
    // Try Metabase first if configured — can be skipped with FORCE_SUPABASE=1 or request body { forceSupabase: true }
    const forceReqSupabase = !!(req.body && req.body.forceSupabase);
    if (!forceReqSupabase && ! (process.env.FORCE_SUPABASE === "1") && METABASE_URL && METABASE_SESSION && cardId) {
      try {
        const mb = await fetch(`${METABASE_URL}/api/card/${cardId}/query/json`, {
          headers: { "X-Metabase-Session": METABASE_SESSION }
        });
        if (mb.ok) {
          rows = await mb.json();
        } else {
          const txt = await mb.text().catch(()=>"");
          console.warn("[smart-blurb] Metabase returned", mb.status, txt);
        }
      } catch (err) {
        console.warn("[smart-blurb] Metabase fetch failed:", String(err));
      }
    }

    // compute requested analytes early so supabase fallback can use it (allow null -> infer later)
    let requested = (req.body && (req.body.analytes || (req.body.analyte ? [req.body.analyte] : null))) || null;
    // regex helper will be built after requested is finalized
    const esc = s => String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    let requestedRegex = requested ? new RegExp(requested.map(esc).join("|"), "i") : null;

    // If Metabase didn't return usable rows, try Supabase fallback
    if ((!Array.isArray(rows) || rows.length === 0) && supabase) {
      // Prefer real tables/views on your DB
      const tableCandidates = ["blood", "blood_long_v"];
      let sbData = null;
      let sbError = null;
      for (const tbl of tableCandidates) {
        try {
          // use select('*') so we don't rely on exact column names (views may differ)
          const { data, error } = await supabase
            .from(tbl)
            .select("*")
            .limit(1000);
          if (error) {
            sbError = { table: tbl, message: String(error.message || error) };
            console.warn("[smart-blurb] Supabase query error on", tbl, sbError.message);
            continue;
          }
          if (!data || data.length === 0) {
            console.warn("[smart-blurb] Supabase: no rows in", tbl);
            continue;
          }

          // filter rows by requested analytes (match any string field)
          let filtered = data.filter(row =>
            Object.values(row).some(v => typeof v === "string" && requestedRegex.test(v))
          );

          // If nothing matched, try tokenized fallback: ignore words like "cholesterol"/"colesterol"/"total"
          if (!filtered.length) {
            const tokens = requested.map(s => String(s || "").toLowerCase().replace(/cholesterol|colesterol|total|triglycerides|triglicerides|\s+/g,"").trim()).filter(Boolean);
            if (tokens.length) {
              const tokenRe = new RegExp(tokens.map(t => esc(t)).join("|"), "i");
              filtered = data.filter(row =>
                Object.values(row).some(v => typeof v === "string" && tokenRe.test(v))
              );
              if (filtered.length) console.log("[smart-blurb] Supabase: matched by token fallback", tbl, tokens);
            }
          }

          if (filtered.length === 0) {
            console.warn("[smart-blurb] Supabase: no rows matching requested analytes in", tbl);
            continue;
          }
          sbData = { table: tbl, rows: filtered };
          break;
        } catch (err) {
          sbError = { table: tbl, message: String(err) };
          console.warn("[smart-blurb] Supabase fetch exception on", tbl, sbError.message);
        }
      }

      if (!sbData) {
        const errMsg = sbError ? `Supabase (${sbError.table}) error: ${sbError.message}` : "No requested analyte rows found in candidate tables";
        console.warn("[smart-blurb] Supabase fallback failed:", errMsg);
        if (!rows || rows.length === 0) {
          if (process.env.NODE_ENV === "production") {
            return res.status(500).json({ error: "Metabase query failed and Supabase fallback errored. Check server logs." });
          } else {
            return res.status(500).json({ error: `Supabase fallback error: ${errMsg}` });
          }
        }
      } else {
        // don't assume column names — keep raw rows and let the downstream heuristics find time/value keys
        rows = sbData.rows;
        console.log(`[smart-blurb] using Supabase table ${sbData.table}, candidate rows=${rows.length}`);
        // debug: log any progesterone rows we see (server console)
        try {
          const prog = rows.filter(r => JSON.stringify(r).toLowerCase().includes("progesterone"));
          if (prog && prog.length) console.log("[smart-blurb] progesterone sample:", JSON.stringify(prog.slice(0,10), null, 2));
        } catch(e) {}
        // try to extract reference low/high from returned rows (common key names)
        try {
          const lowKeys = ["ref_low","reference_low","low","ref_lo","lower_limit","ref_lower"];
          const highKeys = ["ref_high","reference_high","high","ref_hi","upper_limit","ref_upper"];
          for (const r of rows) {
            for (const k of lowKeys) if (k in r && r[k] != null) { refRange.low = safeNum(r[k]) ?? refRange.low; }
            for (const k of highKeys) if (k in r && r[k] != null) { refRange.high = safeNum(r[k]) ?? refRange.high; }
            // check for a string like "0.1-3.3"
            if ((!refRange.low || !refRange.high)) {
              for (const v of Object.values(r)) {
                if (typeof v === "string") {
                  const m = v.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/);
                  if (m) { refRange.low = refRange.low ?? Number(m[1]); refRange.high = refRange.high ?? Number(m[2]); break; }
                }
              }
            }
            if (refRange.low != null || refRange.high != null) break;
          }
        } catch(e) { /* ignore */ }
      }
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      console.log("[smart-blurb] no rows returned from Metabase/Supabase");
      if (debug || process.env.NODE_ENV !== "production") {
        return res.json({ summary: "No data returned.", debug: { rowsSample: rows.slice(0, 20), note: "No rows from Metabase or Supabase" } });
      }
      return res.json({ summary: "No data returned." });
    }

    // 2) Prefer rows where analyte column equals/starts-with requested analytes (or default to LDL)
    const requestedAnalytes = (req.body && (req.body.analytes || (req.body.analyte ? [req.body.analyte] : null))) || ["Cholesterol LDL"];
    // build regex to match any requested analyte (escape)
    const analyteEsc = s => String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const analyteRegex = new RegExp(requestedAnalytes.map(analyteEsc).join("|"), "i");
    const analyteCandidates = rows.filter(r =>
      (typeof r.analyte === "string" && analyteRegex.test(r.analyte)) ||
      Object.values(r).some(v => typeof v === "string" && analyteRegex.test(v))
    );
    const useRows = analyteCandidates.length ? analyteCandidates : rows;

    const sample = useRows[0] || {};
    const keys = Object.keys(sample);

    // detect pivoted date columns (e.g. "06/08/2011", "2024-01-31", etc.)
    const isDateHeader = (h) => /^\d{1,4}[\/\-]\d{1,2}[\/\-]\d{1,4}$/.test(String(h).trim());
    const dateKeys = keys.filter(k => isDateHeader(k));

    function parseDateHeader(h) {
      const s = String(h).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s);
      const parts = s.split(/[\/\-]/).map(p => parseInt(p, 10));
      if (parts.length !== 3) return new Date(s);
      let [a, b, c] = parts;
      // normalize year
      let year = c;
      if (year < 100) year += 2000;
      // Heuristic: if middle part > 12 it's day-month-year (a = day)
      if (b > 12) { // a = day, b = month
        return new Date(year, b - 1, a);
      }
      // otherwise assume day/month/year (DD/MM/YYYY)
      return new Date(year, b - 1, a);
    }

    // Unpivot date columns into points grouped by analyte
    const pointsByAnalyte = new Map();
    for (const r of useRows) {
      const aName = (r.analyte || "").toString().trim() || "unknown";
      for (const dk of dateKeys) {
        const raw = r[dk];
        const v = safeNum(raw);
        if (v == null) continue;
        const t = parseDateHeader(dk);
        if (!(t instanceof Date) || isNaN(t.getTime())) continue;
        const arr = pointsByAnalyte.get(aName) || [];
        arr.push({ t, v, row: r, rawDateHeader: dk });
        pointsByAnalyte.set(aName, arr);
      }
    }

    if (Array.from(pointsByAnalyte.values()).some(a=>a && a.length>0)) {
      // build per-analyte series map
      const seriesByAnalyte = {};
      for (const [aName, pts] of pointsByAnalyte.entries()) {
        seriesByAnalyte[aName] = pts.sort((a,b)=>a.t.getTime()-b.t.getTime());
      }
      // convert to rawData array: [{ analyte, unit, points: [{date,value}, ...] }, ...]
      const rawData = Object.entries(seriesByAnalyte).map(([aName, pts]) => ({
        analyte: aName,
        unit: (useRows.find(r=> (r.analyte||"").toString().trim()===aName) || {}).unit || null,
        points: pts.map(p => ({ date: p.t.toISOString().slice(0,10), value: p.v }))
      }));
      // prepare prompt and call AI below using rawData
      // ask for ~double length: 4-6 concise sentences, and increase max tokens
      const analyteName = (Array.isArray(requested) ? requested.join(", ") : requested);
      const defaultMultiPrompt = (req.body && req.body.aiPrompt) || SMART_BLURB_PROMPT || process.env.SMART_BLURB_PROMPT || `This is my health data for analytes ${analyteName}. The data is a JSON array (analyte -> points):\n\n{data}\n\nProvide your conclusions in 4-6 concise sentences (about double the usual length), mentioning trends and notable changes.`;
      
      const promptTemplate = (req.body && req.body.aiPrompt) || SMART_BLURB_PROMPT || process.env.SMART_BLURB_PROMPT || defaultMultiPrompt;
      let promptText = promptTemplate.replace("{data}", JSON.stringify(rawData)).replace("{analyte}", analyteName);
      // include detected reference range in the prompt to ensure AI uses the correct limits
      try {
        const unitText = (rawData && rawData[0] && rawData[0].unit) ? ` ${rawData[0].unit}` : "";
        if (refRange && (refRange.low != null || refRange.high != null)) {
          promptText += `\n\nReference range: ${refRange.low != null ? refRange.low : "—"} — ${refRange.high != null ? refRange.high : "—"}${unitText}.`;
        }
      } catch(e) {}
 
       // DEBUG: log progesterone payload/prompt if present
       if (/progesterone/i.test(String(analyteName || ""))) {
         console.log("[smart-blurb] DEBUG progesterone rawData:", JSON.stringify(rawData, null, 2));
         console.log("[smart-blurb] DEBUG progesterone refRange:", JSON.stringify(refRange, null, 2));
         console.log("[smart-blurb] DEBUG progesterone promptText:", promptText);
       }
      // call OpenAI (same code as below) and return
      let aiRewrite = null;
      if (OPENAI_KEY) {
        try {
          const r = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${OPENAI_KEY}`
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                { role: "system", content: "You are a concise clinical data summarizer. Keep answers factual and concise." },
                { role: "user", content: promptText }
              ],
              max_tokens: 440,
              temperature: 0.6
            })
          });
          if (r.ok) {
            const jr = await r.json();
            aiRewrite = jr?.choices?.[0]?.message?.content?.trim() || null;
          } else {
            console.warn("[smart-blurb] OpenAI error", r.status, await r.text().catch(()=>""));
          }
        } catch (err) {
          console.warn("[smart-blurb] OpenAI request failed:", String(err));
        }
      }

      const resp = { data: rawData };
      if (refRange && (refRange.low != null || refRange.high != null)) resp.refRange = refRange;
      if (aiRewrite) resp.ai = aiRewrite;
      if (debug) resp.debug = { usedAI: !!aiRewrite };
      return res.status(200).json(resp);
    } else {
      // detect simple time/value columns
      const timeCandidates = ["collected_at","collectedAt","date","day","timestamp","time","reported_at"];
      let timeKey = timeCandidates.find(k => k in sample) || keys.find(k => /date|time|collected|reported|day|specimen|visit/i.test(k));
      if (!timeKey) {
        const looksLikeDate = (k) => {
          let good = 0, total = 0;
          for (let i = 0; i < Math.min(50, useRows.length); i++) {
            const v = useRows[i][k];
            if (v == null) continue;
            total++;
            const d = (typeof v === "number") ? new Date(v) : new Date(String(v));
            if (d instanceof Date && !isNaN(d.getTime())) good++;
          }
          return total > 0 && good / total >= 0.5;
        };
        timeKey = keys.find(looksLikeDate) || keys[0];
      }

      // detect numeric/value column
      const preferValueNames = ["value_numeric","value","result_numeric","result","numeric_value","measurement","value_number","value_text","reported_value","amount"];
      let numericCol = keys.find(k => preferValueNames.includes(k));
      if (!numericCol) {
        const isNumericCol = (col) => {
          let good = 0, total = 0;
          for (let i = 0; i < Math.min(100, useRows.length); i++) {
            const v = useRows[i][col];
            if (v == null) continue;
            total++;
            if (!Number.isNaN(Number(v)) && Number.isFinite(Number(v))) good++;
          }
          return total > 0 && good / total >= 0.5 && total >= 2;
        };
        numericCol = keys.find(isNumericCol);
      }

      // build series from detected time & numeric columns
      let series = [];
      if (numericCol) {
        series = useRows
          .map(r => {
            const rawT = r[timeKey];
            const rawV = r[numericCol];
            let t = null;
            if (rawT == null) t = null;
            else if (typeof rawT === "number") t = new Date(rawT);
            else if (/^\d{10,}$/.test(String(rawT))) t = new Date(Number(rawT));
            else t = new Date(String(rawT));
            const v = safeNum(rawV);
            return { t, v, row: r };
          })
          .filter(p => p.t instanceof Date && !isNaN(p.t.getTime()) && p.v != null)
          .sort((a, b) => a.t.getTime() - b.t.getTime());
      }

      // attach series to outer scope by reusing variable name if needed
      // (fallthrough continues below)
    } // end else (pivot vs fallback)

    // At this point either 'series' (single-analyte fallback) exists or multi-analyte path already returned.
    // If series was declared inside the else-block above, ensure we retrieve it from that scope:
    // (recompute a safe reference)
    // Try to find 'series' in local scope; if not present, build an empty array.
    // (This guard prevents reference errors)
    let finalSeries = typeof series !== "undefined" ? series : [];

    if (!finalSeries || finalSeries.length === 0) {
      const debugPayload = { keys, dateKeys, sampleRows: useRows.slice(0,10) };
      if (debug || process.env.NODE_ENV !== "production") {
        return res.json({ summary: "No numeric LDL points found.", debug: debugPayload });
      }
      return res.json({ summary: "No numeric LDL points found." });
    }

    // Build raw data payload for AI: list of {date, value}
    const analyteName = (sample.analyte && String(sample.analyte).trim()) || (requested ? requested.join(", ") : "LDL");
    const unit = sample.unit || sample.units || sample.unit_of_measure || null;
    const rawData = finalSeries.map(s => ({ date: s.t.toISOString().slice(0,10), value: s.v }));

    // Prepare prompt and call AI
    const defaultPrompt = `This is my health data for the analyte "${analyteName}"${unit ? ` (unit: ${unit})` : ""}. The data is a JSON array of {date, value}:\n\n{data}\n\nProvide your conclusions in 4-6 concise sentences (about double the usual length) about trends, notable changes, and what stands out.`;
    const promptTemplateSingle = (req.body && req.body.aiPrompt) || SMART_BLURB_PROMPT || process.env.SMART_BLURB_PROMPT || defaultPrompt;
    let promptTextSingle = promptTemplateSingle.replace("{data}", JSON.stringify(rawData)).replace("{analyte}", analyteName).replace("{unit}", unit || "");
    // include detected ref range (single-analyte)
    if (refRange && (refRange.low != null || refRange.high != null)) {
      promptTextSingle += `\n\nReference range: ${refRange.low != null ? refRange.low : "—"} — ${refRange.high != null ? refRange.high : "—"}${unit ? ` ${unit}` : ""}.`;
    }
 
     // DEBUG: log progesterone payload/prompt if present
     if (/progesterone/i.test(String(analyteName || ""))) {
       console.log("[smart-blurb] DEBUG progesterone rawData (single):", JSON.stringify(rawData, null, 2));
       console.log("[smart-blurb] DEBUG progesterone refRange (single):", JSON.stringify(refRange, null, 2));
       console.log("[smart-blurb] DEBUG progesterone promptTextSingle:", promptTextSingle);
     }
    let aiRewrite = null;
    if (OPENAI_KEY) {
      try {
        const r = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "You are a concise clinical data summarizer. Keep answers factual and concise." },
              { role: "user", content: promptTextSingle }
            ],
            max_tokens: 440,
            temperature: 0.6
          })
        });
        if (r.ok) {
          const jr = await r.json();
          aiRewrite = jr?.choices?.[0]?.message?.content?.trim() || null;
        } else {
          console.warn("[smart-blurb] OpenAI error", r.status, await r.text().catch(()=>""));
        }
      } catch (err) {
        console.warn("[smart-blurb] OpenAI request failed:", String(err));
      }
    }

    const resp = { data: rawData };
    if (refRange && (refRange.low != null || refRange.high != null)) resp.refRange = refRange;
    if (aiRewrite) resp.ai = aiRewrite;
    if (debug) resp.debug = { usedAI: !!aiRewrite, analyte: analyteName, unit };
    return res.status(200).json(resp);
  } catch (err) {
    console.error("[smart-blurb] handler error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
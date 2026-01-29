// pages/api/body-ingest.js
import formidable from "formidable";
import fs from "fs";
import pdf from "pdf-parse";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export const config = { api: { bodyParser: false } };

const openai=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
const supabase=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);

function cleanJson(s){s=String(s||"").trim();return s.startsWith("```")?s.replace(/```json\s*/i,"").replace(/```$/,"").trim():s;}
function extractDates(ptText){
  const text=String(ptText||""); const ddmmyyyy=/([0-3]\d)\/([01]\d)\/(\d{4})/g;
  let collected=null;
  const m=text.match(ddmmyyyy);
  if(m){ const x=m[0].match(/([0-3]\d)\/([01]\d)\/(\d{4})/); if(x) collected=`${x[3]}-${x[2]}-${x[1]}`; }
  return collected;
}

export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  try{
    const form=formidable({multiples:false});
    form.parse(req, async (err,fields,files)=>{
      if(err) return res.status(400).json({error:"Upload parse failed"});
      const f=files?.file?.[0]||files?.file; if(!f?.filepath) return res.status(400).json({error:"No file uploaded"});

      const buf=fs.readFileSync(f.filepath);
      const parsed=await pdf(buf); const text=parsed.text||"";
      const collected_at=extractDates(text);

      const sys=[
        "From this PDF, extract the body measurements per date.",
        "Return ONLY a JSON array of objects.",
        "Each object:",
        "- collected_at (YYYY-MM-DD) required if present",
        "- weight_kg (number or null)",
        "- body_fat_percent (number or null)",
        "If there are multiple dates in the PDF, return multiple objects.",
        "Normalize decimal commas to dots."
      ].join("\n");

      const resp=await openai.chat.completions.create({
        model:"gpt-4o-mini",
        temperature:0,
        messages:[{role:"system",content:sys},{role:"user",content:text}]
      });

      let content=cleanJson(resp.choices[0]?.message?.content||"[]");
      let rows=[];
      try{ const j=JSON.parse(content); if(Array.isArray(j)) rows=j; }catch{ rows=[]; }

      // fallback date if model omitted it
      rows = rows.map(r=>({
        collected_at: r.collected_at || collected_at || null,
        weight_kg: typeof r.weight_kg==="string" ? Number(r.weight_kg.replace(",", ".")) : (r.weight_kg ?? null),
        body_fat_percent: typeof r.body_fat_percent==="string" ? Number(r.body_fat_percent.replace(",", ".")) : (r.body_fat_percent ?? null),
        source_filename: f.originalFilename
      })).filter(r=>r.collected_at);

      // upsert by collected_at (one row per date)
      if(rows.length){
        // dedupe same date in same request
        const uniq=new Map();
        for(const r of rows){ uniq.set(r.collected_at, r); }
        const uniqueRows=Array.from(uniq.values());

        const { error } = await supabase
          .from("body_metrics")
          .upsert(uniqueRows, { onConflict: "collected_at" });
        if(error) return res.status(500).json({error:error.message});
      }

      try{ fs.unlinkSync(f.filepath); }catch{}
      return res.status(200).json({ inserted: rows.length });
    });
  }catch(e){ return res.status(500).json({error:String(e?.message||e)}); }
}

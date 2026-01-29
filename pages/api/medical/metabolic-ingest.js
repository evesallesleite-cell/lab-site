// pages/api/metabolic-ingest.js
import formidable from "formidable";
import fs from "fs";
import pdf from "pdf-parse";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export const config = { api: { bodyParser: false } };

const openai=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
const supabase=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);

function cleanJson(s){s=String(s||"").trim();return s.startsWith("```")?s.replace(/```json\s*/i,"").replace(/```$/,"").trim():s;}
function commaDot(x){return typeof x==="string"?Number(x.replace(",", ".")):x??null;}
function extractDates(t){
  const ddmmyyyy=/([0-3]\d)\/([01]\d)\/(\d{4})/g; const good=["RECEBIDO/COLETADO EM","COLETADO EM","RECEBIDO EM","DATA DA FICHA","COLETA","COLETADO:"]; const bad=["LIBERADO EM","EXAME LIBERADO EM","IMPRESSO EM"]; let coll=null, rep=null;
  for(const line of String(t||"").split(/\r?\n/)){ const L=line.toUpperCase(); const dates=[...line.matchAll(ddmmyyyy)].map(m=>`${m[3]}-${m[2]}-${m[1]}`); if(!dates.length) continue; if(good.some(h=>L.includes(h))) coll=coll||dates[0]; else if(bad.some(h=>L.includes(h))) rep=rep||dates[0]; }
  if(!coll){ const m=String(t||"").match(ddmmyyyy); if(m){ const x=m[0].match(/([0-3]\d)\/([01]\d)\/(\d{4})/); if(x) coll=`${x[3]}-${x[2]}-${x[1]}`; } }
  return { collected_at: coll, reported_at: rep };
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
      const { collected_at, reported_at } = extractDates(text);

      const sys=[
        "Extract metabolic test items from this report.",
        "Return ONLY a JSON array (no markdown).",
        "Each item:",
        "- collected_at (YYYY-MM-DD) if known",
        "- reported_at (YYYY-MM-DD) if known",
        "- section (string or null)",
        "- item (original name; do not translate)",
        "- value_numeric (number or null)",
        "- value_text (string or null)",
        "- units (string or null)",
        "- ref_low (number or null)",
        "- ref_high (number or null)"
      ].join("\n");

      const resp=await openai.chat.completions.create({
        model:"gpt-4o-mini",
        temperature:0,
        messages:[{role:"system",content:sys},{role:"user",content:text}]
      });

      let content=cleanJson(resp.choices[0]?.message?.content||"[]"); let items=[];
      try{ const j=JSON.parse(content); if(Array.isArray(j)) items=j; }catch{ items=[]; }

      const rows=items.map(r=>({
        collected_at: r.collected_at || collected_at || null,
        reported_at: r.reported_at || reported_at || (r.collected_at||collected_at)||null,
        section: r.section || null,
        item: r.item || null,
        value_text: r.value_text || null,
        value_numeric: commaDot(r.value_numeric),
        units: r.units || null,
        ref_low: commaDot(r.ref_low),
        ref_high: commaDot(r.ref_high),
        source_filename: f.originalFilename
      })).filter(r=>r.item);

      if(rows.length){
        const {error}=await supabase.from("metabolic_items").insert(rows);
        if(error) return res.status(500).json({error:error.message});
      }

      try{ fs.unlinkSync(f.filepath); }catch{}
      return res.status(200).json({ inserted: rows.length });
    });
  }catch(e){ return res.status(500).json({error:String(e?.message||e)}); }
}

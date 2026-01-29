import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Avoid SSR issues for the small AI blurb
const SmartBlurb = dynamic(() => import("../../components/SmartBlurb"), { ssr: false });

export default function Dashboard() {
  const [embedUrls, setEmbedUrls] = useState({});
  const [error, setError] = useState("");
  const [progRef, setProgRef] = useState(null);

  // Metabase question IDs (use type: "question" for published questions)
  const CARDS = {
    lipids: { id: 42, type: "question" },
    hdl:   { id: 40, type: "question" },
    ldl:   { id: 45, type: "question" },
    triglycerides: { id: 44, type: "question" }, // updated to question/44-triglycerides
    vldl: { id: 41, type: "question" } // updated to question/41-vldl
  };

  useEffect(() => {
    let mounted = true;
    async function loadCards() {
      try {
        const out = {};
        for (const [key, meta] of Object.entries(CARDS)) {
          const r = await fetch(`/api/metabase-embed?id=${encodeURIComponent(meta.id)}&type=${encodeURIComponent(meta.type)}`);
          const text = await r.text().catch(()=>"");
          if (!r.ok) throw new Error(`embed API ${meta.id} -> ${r.status} ${text}`);
          const j = text ? JSON.parse(text) : {};
          out[key] = j.iframeUrl;
        }
        if (mounted) setEmbedUrls(out);
      } catch (err) {
        if (mounted) setError(String(err?.message || err));
      }
    }
    loadCards();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadProgRef() {
      try {
        const r = await fetch("/api/smart-blurb", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardId: 53, analyte: "Progesterone", debug: true })
        });
        const j = await r.json();
        if (!mounted) return;
        // prefer returned refRange, fallback to docket/debug if present
        if (j.refRange) setProgRef(j.refRange);
        else if (j.docket && (j.docket.refLow || j.docket.refHigh)) setProgRef({ low: j.docket.refLow || null, high: j.docket.refHigh || null });
      } catch (e) { /* ignore */ }
    }
    loadProgRef();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        {progRef && (
          <div className="mt-2 rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2 text-sm text-yellow-800">
            Progesterone reference range: {progRef.low != null ? progRef.low : "—"} — {progRef.high != null ? progRef.high : "—"}
          </div>
        )}

        {error && <div className="text-red-600 my-4">Error loading embeds: {error}</div>}

        {/* Top: combined lipids chart with AI blurb */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="col-span-2 rounded-2xl border bg-white shadow overflow-hidden" style={{ height: 360 }}>
            {embedUrls.lipids ? (
              <iframe src={embedUrls.lipids} title="Lipids chart" className="w-full h-full" style={{ border: 0 }} />
            ) : <div className="p-6 text-sm text-gray-600">Loading lipids chart…</div>}
          </div>

          <div className="col-span-1">
            <div className="rounded-lg border bg-white p-3 text-sm shadow h-full flex flex-col">
              <strong>Lipids - AI Analysis</strong>
              <div className="mt-3 flex-1 overflow-auto">
                <SmartBlurb
                  cardId={CARDS.lipids.id}
                  analytes={["Cholesterol LDL","Cholesterol VLDL","Cholesterol HDL","Total cholesterol"]}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Second row: HDL and LDL each with their chart and blurb */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          {/* HDL column: chart (fixed height) then blurb below */}
          <div>
            <div className="rounded-2xl border bg-white shadow overflow-hidden" style={{ height: 320 }}>
              {embedUrls.hdl ? (
                <iframe
                  src={embedUrls.hdl}
                  title="HDL chart"
                  className="w-full h-full"
                  style={{ border: 0, height: "320px", display: "block" }}
                />
              ) : (
                <div className="p-6 text-sm text-gray-600">Loading HDL chart…</div>
              )}
            </div>
            <div className="mt-3 rounded-lg border bg-white p-3 text-sm shadow h-60 overflow-auto">
               <SmartBlurb cardId={CARDS.hdl.id} title="HDL - AI Analysis" analytes={["Cholesterol HDL"]} />
             </div>
           </div>
 
           {/* LDL column: chart (fixed height) then blurb below */}
           <div>
             <div className="rounded-2xl border bg-white shadow overflow-hidden" style={{ height: 320 }}>
               {embedUrls.ldl ? (
                 <iframe
                   src={embedUrls.ldl}
                   title="LDL chart"
                   className="w-full h-full"
                   style={{ border: 0, height: "320px", display: "block" }}
                 />
               ) : (
                 <div className="p-6 text-sm text-gray-600">Loading LDL chart…</div>
               )}
             </div>
            <div className="mt-3 rounded-lg border bg-white p-3 text-sm shadow h-60 overflow-auto">
               <SmartBlurb cardId={CARDS.ldl.id} title="LDL - AI Analysis" analytes={["Cholesterol LDL"]} />
             </div>
           </div>
         </div>
 
         {/* Third row: Triglycerides and VLDL (same format as HDL/LDL) */}
         <div className="mt-6 grid grid-cols-2 gap-4">
           {/* Triglycerides */}
           <div>
             <div className="rounded-2xl border bg-white shadow overflow-hidden" style={{ height: 320 }}>
               {embedUrls.triglycerides ? (
                 <iframe
                   src={embedUrls.triglycerides}
                   title="Triglycerides chart"
                   className="w-full h-full"
                   style={{ border: 0, height: "320px", display: "block" }}
                 />
               ) : (
                 <div className="p-6 text-sm text-gray-600">Loading Triglycerides chart…</div>
               )}
             </div>
            <div className="mt-3 rounded-lg border bg-white p-3 text-sm shadow h-60 overflow-auto">
               <SmartBlurb cardId={CARDS.triglycerides.id} title="Triglycerides - AI Analysis" analytes={["Triglycerides"]} />
             </div>
           </div>
 
           {/* VLDL */}
           <div>
             <div className="rounded-2xl border bg-white shadow overflow-hidden" style={{ height: 320 }}>
               {embedUrls.vldl ? (
                 <iframe
                   src={embedUrls.vldl}
                   title="VLDL chart"
                   className="w-full h-full"
                   style={{ border: 0, height: "320px", display: "block" }}
                 />
               ) : (
                 <div className="p-6 text-sm text-gray-600">Loading VLDL chart…</div>
               )}
             </div>
            <div className="mt-3 rounded-lg border bg-white p-3 text-sm shadow h-60 overflow-auto">
               <SmartBlurb cardId={CARDS.vldl.id} title="VLDL - AI Analysis" analytes={["Cholesterol VLDL","VLDL"]} />
             </div>
           </div>
         </div>
       </div>
     </div>
   );
 }

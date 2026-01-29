import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getBloodTestStore } from "../../lib/blood-test-store";

// Avoid SSR issues for the small AI blurb
const SmartBlurb = dynamic(() => import("../../components/SmartBlurb"), { ssr: false });

export default function LipidsPage() {
  const [embedUrls, setEmbedUrls] = useState({});
  const [error, setError] = useState("");
  const [progRef, setProgRef] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Metabase question IDs (use type: "question" for published questions)
  const CARDS = {
    lipids: { id: 42, type: "question" },
    hdl: { id: 40, type: "question" },
    ldl: { id: 45, type: "question" },
    triglycerides: { id: 44, type: "question" },
    vldl: { id: 41, type: "question" }
  };

  useEffect(() => {
    // Load stored data immediately without authentication
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    const store = getBloodTestStore();
    if (!store) return;

    // First load from cache
    setEmbedUrls({
      lipids: store.getEmbedUrl('lipids'),
      hdl: store.getEmbedUrl('hdl'),
      ldl: store.getEmbedUrl('ldl'),
      triglycerides: store.getEmbedUrl('triglycerides'),
      vldl: store.getEmbedUrl('vldl')
    });
    
    setProgRef(store.getProgRef());
    setLastUpdated(store.getLastUpdated());

    // If no data exists, load it once (but don't reload on every page visit)
    if (!store.hasAnyData() && !store.isDataLoading()) {
      try {
        console.log('No cached embed data found, loading initial data...');
        await store.refreshData('embeds');
        
        // Update the UI with the fresh data
        setEmbedUrls({
          lipids: store.getEmbedUrl('lipids'),
          hdl: store.getEmbedUrl('hdl'),
          ldl: store.getEmbedUrl('ldl'),
          triglycerides: store.getEmbedUrl('triglycerides'),
          vldl: store.getEmbedUrl('vldl')
        });
        
        setProgRef(store.getProgRef());
        setLastUpdated(store.getLastUpdated());
      } catch (error) {
        console.error('Error loading initial data:', error);
        setError(String(error?.message || error));
      }
    }
  };

  const handleRefreshData = async () => {
    try {
      setIsRefreshing(true);
      setError("");
      
      const store = getBloodTestStore();
      if (!store) return;

      await store.refreshData();
      loadStoredData();
      
    } catch (err) {
      setError(String(err?.message || err));
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatLastUpdated = (timestamp) => {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Lipids</h1>
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span className="text-sm text-gray-600">
                Last updated: {formatLastUpdated(lastUpdated)}
              </span>
            )}
            <button
              onClick={handleRefreshData}
              disabled={isRefreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRefreshing ? "Updating..." : "Update Data"}
            </button>
          </div>
        </div>
        
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
                  useCache={true}
                  cacheKey="bloodTest"
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
               <SmartBlurb 
                 cardId={CARDS.hdl.id} 
                 title="HDL - AI Analysis" 
                 analytes={["Cholesterol HDL"]} 
                 useCache={true}
                 cacheKey="bloodTest"
               />
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
               <SmartBlurb 
                 cardId={CARDS.ldl.id} 
                 title="LDL - AI Analysis" 
                 analytes={["Cholesterol LDL"]} 
                 useCache={true}
                 cacheKey="bloodTest"
               />
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
               <SmartBlurb 
                 cardId={CARDS.triglycerides.id} 
                 title="Triglycerides - AI Analysis" 
                 analytes={["Triglycerides"]} 
                 useCache={true}
                 cacheKey="bloodTest"
               />
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
               <SmartBlurb 
                 cardId={CARDS.vldl.id} 
                 title="VLDL - AI Analysis" 
                 analytes={["Cholesterol VLDL","VLDL"]} 
                 useCache={true}
                 cacheKey="bloodTest"
               />
             </div>
           </div>
         </div>
       </div>
     </div>
   );
 }

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getBloodTestStore } from "../../lib/blood-test-store";

// Avoid SSR issues for the small AI blurb
const SmartBlurb = dynamic(() => import("../../components/SmartBlurb"), { ssr: false });

export default function HormonesPage() {
  const [embedUrls, setEmbedUrls] = useState({});
  const [error, setError] = useState("");
  const [progRef, setProgRef] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Metabase question IDs for hormones
  const CARDS = {
    // Adrenal hormones
    dhea: { id: 49, type: "question" },     // http://localhost:3001/question/49-dhea
    dhea_s: { id: 48, type: "question" },   // http://localhost:3001/question/48-dhea-s
    cortisol: { id: 46, type: "question" }, // http://localhost:3001/question/46-cortisol

    // Sex hormones
    progesterone: { id: 53, type: "question" }, // http://localhost:3001/question/53-progesterone
    estradiol: { id: 55, type: "question" },    // http://localhost:3001/question/55-estradiol
    lh: { id: 51, type: "question" },           // http://localhost:3001/question/51-lh
    fsh: { id: 54, type: "question" }           // http://localhost:3001/question/54-fsh
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
      dhea: store.getEmbedUrl('dhea'),
      dhea_s: store.getEmbedUrl('dhea_s'),
      cortisol: store.getEmbedUrl('cortisol'),
      progesterone: store.getEmbedUrl('progesterone'),
      estradiol: store.getEmbedUrl('estradiol'),
      lh: store.getEmbedUrl('lh'),
      fsh: store.getEmbedUrl('fsh')
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
          dhea: store.getEmbedUrl('dhea'),
          dhea_s: store.getEmbedUrl('dhea_s'),
          cortisol: store.getEmbedUrl('cortisol'),
          progesterone: store.getEmbedUrl('progesterone'),
          estradiol: store.getEmbedUrl('estradiol'),
          lh: store.getEmbedUrl('lh'),
          fsh: store.getEmbedUrl('fsh')
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
          <h1 className="text-2xl font-semibold">Hormones</h1>
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
        
        <div className="flex items-baseline justify-between">
          {/* quick debug badge showing expected progesterone ref range */}
          <div className="ml-4 text-sm text-gray-700">
            Progesterone ref: <span className="font-medium">0 — 33</span>
          </div>
        </div>
        {progRef && (
          <div className="mt-2 rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2 text-sm text-yellow-800">
            Progesterone reference range (from data): {progRef.low != null ? progRef.low : "—"} — {progRef.high != null ? progRef.high : "—"}
          </div>
        )}

        {error && <div className="text-red-600 my-4">Error loading embeds: {error}</div>}

        {/* Top: Adrenal (main chart) with AI blurb */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="col-span-2 rounded-2xl border bg-white shadow overflow-hidden" style={{ height: 360 }}>
            {embedUrls.dhea ? (
              <iframe src={embedUrls.dhea} title="DHEA chart" className="w-full h-full" style={{ border: 0 }} />
            ) : <div className="p-6 text-sm text-gray-600">Loading DHEA chart…</div>}
          </div>

          <div className="col-span-1">
            <div className="rounded-lg border bg-white p-3 text-sm shadow h-full flex flex-col">
              <strong>Adrenal Hormones - AI Analysis</strong>
              <div className="mt-3 flex-1 overflow-auto">
                <SmartBlurb
                  cardId={CARDS.dhea.id}
                  analytes={["DHEA","DHEA-S","Cortisol"]}
                  useCache={true}
                  cacheKey="bloodTest"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Second row: DHEA-S and Cortisol */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <div className="rounded-2xl border bg-white shadow overflow-hidden" style={{ height: 320 }}>
              {embedUrls.dhea_s ? (
                <iframe
                  src={embedUrls.dhea_s}
                  title="DHEA-S chart"
                  className="w-full h-full"
                  style={{ border: 0, height: "320px", display: "block" }}
                />
              ) : (
                <div className="p-6 text-sm text-gray-600">Loading DHEA-S chart…</div>
              )}
            </div>
            <div className="mt-3 rounded-lg border bg-white p-3 text-sm shadow h-60 overflow-auto">
              <SmartBlurb 
                cardId={CARDS.dhea_s.id} 
                title="DHEA-S - AI Analysis" 
                analytes={["DHEA-S"]} 
                useCache={true}
                cacheKey="bloodTest"
              />
            </div>
          </div>

          <div>
            <div className="rounded-2xl border bg-white shadow overflow-hidden" style={{ height: 320 }}>
              {embedUrls.cortisol ? (
                <iframe
                  src={embedUrls.cortisol}
                  title="Cortisol chart"
                  className="w-full h-full"
                  style={{ border: 0, height: "320px", display: "block" }}
                />
              ) : (
                <div className="p-6 text-sm text-gray-600">Loading Cortisol chart…</div>
              )}
            </div>
            <div className="mt-3 rounded-lg border bg-white p-3 text-sm shadow h-60 overflow-auto">
              <SmartBlurb 
                cardId={CARDS.cortisol.id} 
                title="Cortisol - AI Analysis" 
                analytes={["Cortisol"]} 
                useCache={true}
                cacheKey="bloodTest"
              />
            </div>
          </div>
        </div>

        {/* Third row: Progesterone and Estradiol */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <div className="rounded-2xl border bg-white shadow overflow-hidden" style={{ height: 320 }}>
              {embedUrls.progesterone ? (
                <iframe
                  src={embedUrls.progesterone}
                  title="Progesterone chart"
                  className="w-full h-full"
                  style={{ border: 0, height: "320px", display: "block" }}
                />
              ) : (
                <div className="p-6 text-sm text-gray-600">Loading Progesterone chart…</div>
              )}
            </div>
            <div className="mt-3 rounded-lg border bg-white p-3 text-sm shadow h-60 overflow-auto">
              <SmartBlurb 
                cardId={CARDS.progesterone.id} 
                title="Progesterone - AI Analysis" 
                analytes={["Progesterone"]} 
                useCache={true}
                cacheKey="bloodTest"
              />
            </div>
          </div>

          <div>
            <div className="rounded-2xl border bg-white shadow overflow-hidden" style={{ height: 320 }}>
              {embedUrls.estradiol ? (
                <iframe
                  src={embedUrls.estradiol}
                  title="Estradiol chart"
                  className="w-full h-full"
                  style={{ border: 0, height: "320px", display: "block" }}
                />
              ) : (
                <div className="p-6 text-sm text-gray-600">Loading Estradiol chart…</div>
              )}
            </div>
            <div className="mt-3 rounded-lg border bg-white p-3 text-sm shadow h-60 overflow-auto">
              <SmartBlurb 
                cardId={CARDS.estradiol.id} 
                title="Estradiol - AI Analysis" 
                analytes={["Estradiol"]} 
                useCache={true}
                cacheKey="bloodTest"
              />
            </div>
          </div>
        </div>

        {/* Fourth row: LH and FSH */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <div className="rounded-2xl border bg-white shadow overflow-hidden" style={{ height: 320 }}>
              {embedUrls.lh ? (
                <iframe
                  src={embedUrls.lh}
                  title="LH chart"
                  className="w-full h-full"
                  style={{ border: 0, height: "320px", display: "block" }}
                />
              ) : (
                <div className="p-6 text-sm text-gray-600">Loading LH chart…</div>
              )}
            </div>
            <div className="mt-3 rounded-lg border bg-white p-3 text-sm shadow h-60 overflow-auto">
              <SmartBlurb 
                cardId={CARDS.lh.id} 
                title="LH - AI Analysis" 
                analytes={["LH"]} 
                useCache={true}
                cacheKey="bloodTest"
              />
            </div>
          </div>

          <div>
            <div className="rounded-2xl border bg-white shadow overflow-hidden" style={{ height: 320 }}>
              {embedUrls.fsh ? (
                <iframe
                  src={embedUrls.fsh}
                  title="FSH chart"
                  className="w-full h-full"
                  style={{ border: 0, height: "320px", display: "block" }}
                />
              ) : (
                <div className="p-6 text-sm text-gray-600">Loading FSH chart…</div>
              )}
            </div>
            <div className="mt-3 rounded-lg border bg-white p-3 text-sm shadow h-60 overflow-auto">
              <SmartBlurb 
                cardId={CARDS.fsh.id} 
                title="FSH - AI Analysis" 
                analytes={["FSH"]} 
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
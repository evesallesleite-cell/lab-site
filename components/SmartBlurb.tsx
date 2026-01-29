import React, { useEffect, useState, useRef } from "react";

type Props = {
  cardId?: number;
  title?: string;
  refreshMs?: number; // ignored — polling disabled
  analytes?: string[]; // optional list of analytes to analyze
  useCache?: boolean; // whether to use localStorage caching
  cacheKey?: string; // cache key prefix (e.g., "bloodTest", "whoop")
  customData?: any; // custom data object to include in analysis
  customPrompt?: string; // custom prompt for analysis
};

export default function SmartBlurb({
  cardId,
  title = "",
  refreshMs = 0,
  analytes = [],
  useCache = false,
  cacheKey = "default",
  customData,
  customPrompt,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ai, setAi] = useState<string | null>(null);
  const [fallback, setFallback] = useState<string | null>(null);
  const [debugPayload, setDebugPayload] = useState<any>(null);
  const mounted = useRef(true);

  // Function to force refresh (clear cache and reload)
  const forceRefresh = () => {
    const cacheKeyFull = getCacheKey();
    if (cacheKeyFull) {
      localStorage.removeItem(cacheKeyFull);
      console.log(`[SmartBlurb] Cleared cache for ${customData?.categoryName || 'analysis'}`);
    }
    load();
  };

  // Create unique cache key that includes custom data context
  const getCacheKey = () => {
    if (!useCache || typeof window === 'undefined') return null;
    let baseKey = `${cacheKey}`;
    if (customData && customData.categoryName) {
      baseKey += `_${customData.categoryName.replace(/\s+/g, '_')}`;
      // Add a hash of the markers data to ensure cache is invalidated when PDF data changes
      if (customData.markers) {
        const dataHash = btoa(JSON.stringify(customData.markers)).slice(0, 8);
        baseKey += `_${dataHash}`;
      }
    }
    if (cardId) baseKey += `_${cardId}`;
    return baseKey;
  };

  useEffect(() => {
    mounted.current = true;
    
    // For genetic analysis with cache enabled, check cache first and don't reload if cached
    if (useCache && customData && customPrompt) {
      const cacheKeyFull = getCacheKey();
      if (cacheKeyFull) {
        const cached = localStorage.getItem(cacheKeyFull);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            // Check if cached AI response is incomplete/truncated
            const aiContent = parsed.ai;
            const isIncomplete = aiContent && (
              aiContent.length < 100 || // Too short
              aiContent.endsWith('with') || // Ends abruptly
              aiContent.includes('analysis shows') && !aiContent.includes('.') // Incomplete sentence
            );
            
            if (!isIncomplete) {
              console.log(`[SmartBlurb] Using cached genetic analysis for ${customData.categoryName}`);
              setAi(parsed.ai);
              setFallback(parsed.fallback);
              setDebugPayload(parsed.debugPayload);
              return; // Exit early - don't call load()
            } else {
              console.log('Cached response appears incomplete, refreshing...');
              localStorage.removeItem(cacheKeyFull); // Clear bad cache
            }
          } catch (e) {
            console.warn('Failed to parse cached AI content:', e);
          }
        }
      }
    }
    
    // Check cache for regular blood test analysis
    if (useCache && !customData && cardId) {
      const cacheKeyFull = getCacheKey();
      if (cacheKeyFull) {
        const cached = localStorage.getItem(cacheKeyFull);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setAi(parsed.ai);
            setFallback(parsed.fallback);
            setDebugPayload(parsed.debugPayload);
            return; // Exit early - don't call load()
          } catch (e) {
            console.warn('Failed to parse cached AI content:', e);
          }
        }
      }
    }
    
    // Only load if no cache or cache miss
    load();
    
    return () => {
      mounted.current = false;
    };
  }, [cardId, analytes, useCache, cacheKey]); // Removed customData and customPrompt to prevent re-runs

  function buildFallbackText(data: any): string {
    if (!data) return "";
    // data may be { analyte, points: [{date,value}, ...], unit }[] or a single list of points for single analyte
    if (Array.isArray(data)) {
      return data
        .map((d: any) => {
          const pts = Array.isArray(d.points) ? d.points : [];
          const last = pts.slice(-3).map((p: any) => `${p.date}: ${p.value}`).join("\n");
          return `${d.analyte || "unknown"} (${d.unit || ""}) — ${pts.length} points\n${last}`;
        })
        .join("\n\n");
    }
    // single analyte array of {date,value}
    if (Array.isArray(data.points)) {
      const pts = data.points;
      const last = pts.slice(-3).map((p: any) => `${p.date}: ${p.value}`).join("\n");
      return `${data.analyte || "analyte"} (${data.unit || ""}) — ${pts.length} points\n${last}`;
    }
    // fallback generic
    try {
      return JSON.stringify(data, null, 2).slice(0, 1000);
    } catch {
      return String(data);
    }
  }

  async function load() {
    setLoading(true);
    setError(null);
    setAi(null);
    setFallback(null);
    setDebugPayload(null);
    try {
      const body: any = { useAI: true };
      if (cardId) body.cardId = cardId;
      if (analytes && analytes.length) body.analytes = analytes;
      if (customData) body.customData = customData;
      if (customPrompt) body.customPrompt = customPrompt;
      const r = await fetch("/api/smart-blurb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "API error");
      // prefer AI text, fallback to summary or generated fallback from data
      const aiText = j.ai || j.summary || null;
      const fallbackText = aiText ? null : buildFallbackText(j.data || j);
      if (mounted.current) {
        setAi(aiText);
        setFallback(fallbackText);
        setDebugPayload(j.debug || null);
        
        // Save to cache if caching is enabled
        if (useCache && typeof window !== 'undefined') {
          const cacheKeyFull = getCacheKey();
          if (cacheKeyFull) {
            const cacheData = {
              ai: aiText,
              fallback: fallbackText,
              debugPayload: j.debug || null,
              timestamp: new Date().toISOString()
            };
            localStorage.setItem(cacheKeyFull, JSON.stringify(cacheData));
          }
        }
      }
    } catch (e: any) {
      setError(String(e.message || e));
      setAi(null);
      setFallback(null);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }

  return (
    <div className="p-0 text-sm">
      {title ? (
        <div className="flex items-center justify-between mb-2">
          <strong>{title}</strong>
          <button
            onClick={forceRefresh}
            disabled={loading}
            className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh AI Analysis"
          >
            {loading ? "⏳" : "🔄"}
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="text-gray-600">Loading…</div>
      ) : error ? (
        <div className="text-red-600">Error: {error}</div>
      ) : ai ? (
        <div className="whitespace-pre-wrap text-gray-800">{ai}</div>
      ) : fallback ? (
        <div className="whitespace-pre-wrap text-gray-800">{fallback}</div>
      ) : (
        <div className="text-gray-600">No summary available.</div>
      )}

      {/* small debug toggle: visible in dev -- shows payload to help tune analyte matching */}
      {debugPayload && (
        <details className="mt-2 text-xs text-gray-500">
          <summary>debug</summary>
          <pre className="text-xs">{JSON.stringify(debugPayload, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { Line, Scatter } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend } from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

function sentenceCase(s){ s=(s||"").toLowerCase(); return s? s[0].toUpperCase()+s.slice(1):""; }

function pearsonR2(x, y){
  const n = Math.min(x.length, y.length); if(n<2) return null;
  const mx = x.reduce((a,b)=>a+b,0)/n; const my = y.reduce((a,b)=>a+b,0)/n;
  let num=0, dx=0, dy=0;
  for(let i=0;i<n;i++){ const xv=x[i]-mx, yv=y[i]-my; num+=xv*yv; dx+=xv*xv; dy+=yv*yv; }
  if(dx===0||dy===0) return null; const r = num/Math.sqrt(dx*dy); return r*r;
}

export default function Explore(){
  const [options, setOptions] = useState([]);      // dropdown choices
  const [sel, setSel] = useState([]);             // selected analytes [{label,value}]
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Load analyte list for dropdown
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/analytes");
        const j = await r.json();
        if(!r.ok) throw new Error(j.error || "Failed to load analytes");
        const opts = (j.analytes || []).map(a => ({ label: sentenceCase(a), value: a }));
        setOptions(opts);
      } catch(e){ setErr(String(e.message||e)); }
    })();
  }, []);

  async function fetchData(){
    try{
      setErr(""); setLoading(true);
      const analytes = sel.map(s => s.value).join(",");
      const qs = new URLSearchParams();
      qs.set("analytes", analytes);
      if(from) qs.set("from", from);
      if(to) qs.set("to", to);
      const r = await fetch(`/api/explore?${qs.toString()}`);
      const j = await r.json();
      if(!r.ok) throw new Error(j.error || "Failed to fetch data");
      setRows(j.rows||[]);
    }catch(e){ setErr(String(e.message||e)); }
    finally{ setLoading(false); }
  }

  // Build pivot
  const { days, analyteList, pivot } = useMemo(() => {
    const p = new Map(); const aSet = new Set();
    for(const r of rows){
      aSet.add((r.analyte||"").toLowerCase());
      const m = p.get(r.day) || new Map();
      m.set((r.analyte||"").toLowerCase(), Number(r.value));
      p.set(r.day, m);
    }
    const days = Array.from(p.keys()).sort();
    return { days, analyteList: Array.from(aSet), pivot: p };
  }, [rows]);

  const lineData = useMemo(() => {
    const datasets = analyteList.map(a => ({
      label: sentenceCase(a),
      data: days.map(d => {
        const m = pivot.get(d); const v = m? m.get(a): null;
        return v==null? null : v;
      }),
      spanGaps: true
    }));
    return { labels: days, datasets };
  }, [days, analyteList, pivot]);

  const scatter = useMemo(() => {
    if(analyteList.length!==2) return null;
    const [a1, a2] = analyteList;
    const pts=[], xs=[], ys=[];
    for(const d of days){
      const m = pivot.get(d); if(!m) continue;
      const v1=m.get(a1), v2=m.get(a2);
      if(v1!=null && v2!=null){ pts.push({x:v1,y:v2}); xs.push(v1); ys.push(v2); }
    }
    return { r2: pearsonR2(xs,ys), data:{ datasets:[{ label:`${sentenceCase(a1)} vs ${sentenceCase(a2)}`, data:pts }] } };
  }, [analyteList, days, pivot]);

  return (
    <div style={{ padding: 16, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 600 }}>Explore (ad-hoc)</h1>
      <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap", marginTop: 8 }}>
        <div style={{ minWidth: 320 }}>
          <Select
            isMulti
            options={options}
            value={sel}
            onChange={setSel}
            placeholder="Search & select analytes…"
          />
        </div>
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{ padding:8, border:"1px solid #ccc", borderRadius:8 }} />
        <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{ padding:8, border:"1px solid #ccc", borderRadius:8 }} />
        <button onClick={fetchData} style={{ padding:"8px 14px", borderRadius:8, cursor:"pointer" }}>
          {loading? "Loading…" : "Plot"}
        </button>
      </div>
      {err && <div style={{ color:"#b00020", marginTop:8 }}>{err}</div>}

      <div style={{ marginTop: 20 }}>
        <h3 style={{ fontWeight:600, marginBottom:8 }}>Time series</h3>
        <Line data={lineData} options={{ responsive:true, plugins:{ legend:{ position:"bottom" }}}} />
      </div>

      {scatter && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontWeight:600, marginBottom:8 }}>
            Scatter {scatter.r2!=null && <span style={{ color:"#666", fontWeight:400 }}>(R² = {scatter.r2.toFixed(3)})</span>}
          </h3>
          <Scatter data={scatter.data} options={{ responsive:true, plugins:{ legend:{ position:"bottom" }}}} />
        </div>
      )}
    </div>
  );
}

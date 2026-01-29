// pages/body.js
import { useState } from "react";

export default function BodyPage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  async function onUpload() {
    if (!file) { alert("Choose your PDF with weight/BF first."); return; }
    setStatus("Uploading…");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/body-ingest", { method: "POST", body: form });
    const j = await res.json();
    if (res.ok) setStatus(`Saved ${j.inserted} measurements.`);
    else setStatus("Error: " + (j?.error || "Failed"));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold">Weight & Body Fat</h1>
        <div className="mt-4 flex items-center gap-3">
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-white shadow-sm cursor-pointer hover:shadow">
            <input type="file" accept="application/pdf" className="hidden" onChange={(e)=>setFile(e.target.files?.[0]||null)} />
            <span className="text-sm">Choose PDF</span>
          </label>
          <button onClick={onUpload} className="px-4 py-2 rounded-xl bg-black text-white text-sm hover:bg-gray-900 cursor-pointer" disabled={!file}>
            Upload & Process
          </button>
          {file && <span className="text-xs text-gray-500">{file.name}</span>}
        </div>
        {status && <p className="mt-4 text-sm text-gray-700">{status}</p>}
      </div>
    </div>
  );
}

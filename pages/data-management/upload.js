import React, { useState, useRef, useEffect } from "react";

export default function UploadPage() {
  const [testType, setTestType] = useState("blood");
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [showExtracted, setShowExtracted] = useState(false);
  const [extractedRows, setExtractedRows] = useState([]);
  const pollRef = useRef(null);

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  async function startUpload() {
    if (!files || files.length === 0) return alert("Pick one or more files first");
    setStatus("Uploading...");
    setProgress(0);

    const fd = new FormData();
    for (const file of files) fd.append("file", file, file.name);

    try {
      const resp = await fetch("/api/ingest-start", { method: "POST", body: fd });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Upload failed" }));
        setStatus("Error: " + (err?.error || resp.statusText));
        return;
      }
      const { jobId } = await resp.json();
      setStatus(`Job started: ${jobId}`);
      setProgress(0);

      // poll progress endpoint
      const poll = setInterval(async () => {
        try {
          const s = await fetch(`/api/ingest-status?jobId=${encodeURIComponent(jobId)}`, { cache: "no-store" });
          // tolerate 304 (not modified) from intermediaries — just skip this tick
          if (s.status === 304) return;
          if (!s.ok) throw new Error("Status fetch failed");
          const js = await s.json();
          const processed = Number(js.processed || 0);
          const total = Number(js.total || 1);
          const pct = Math.round((processed / Math.max(1, total)) * 100);
          setProgress(pct);
          setStatus(`Scanning pages: ${processed} / ${total}`);

          if (js.done) {
            clearInterval(poll);
            setStatus("Processing finished — preparing download...");
            // fetch CSV result
            const r = await fetch(`/api/ingest-result?jobId=${encodeURIComponent(jobId)}`);
            if (!r.ok) {
              const err = await r.json().catch(() => ({ error: "Result fetch failed" }));
              setStatus("Error fetching result: " + (err?.error || r.statusText));
              return;
            }
            const blob = await r.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const cd = r.headers.get("content-disposition") || "";
            const matched = cd.match(/filename="?([^"]+)"?/);
            const filename = matched ? matched[1] : `lab_results_${jobId}.csv`;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            setStatus("CSV downloaded");
            setProgress(100);
          }
        } catch (e) {
          console.error(e);
          clearInterval(poll);
          setStatus("Polling error: " + String(e?.message || e));
        }
      }, 1000);
    } catch (e) {
      setStatus("Upload error: " + String(e?.message || e));
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: "2rem auto", fontFamily: "Inter, system-ui, sans-serif" }}>
      <h2 style={{ marginBottom: 12 }}>Upload PDF for extraction</h2>

      <label
        style={{
          display: "inline-block",
          padding: "10px 16px",
          background: "#0b5fff",
          color: "#fff",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: 600
        }}
      >
        Choose file
        <input
          type="file"
          accept=".pdf"
          multiple
          onChange={(ev) => setFiles(Array.from(ev.target.files))}
          style={{ display: "none" }}
        />
      </label>

      <span style={{ marginLeft: 12, color: "#333" }}>
        {files && files.length ? files[0].name : "No file selected"}
      </span>

      <div style={{ marginTop: 16 }}>
        <button
          onClick={startUpload}
          style={{
            padding: "10px 16px",
            background: "#06b06b",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          Upload and download CSV
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ height: 12, background: "#eee", borderRadius: 6, overflow: "hidden", width: 400 }}>
          <div style={{ width: `${progress}%`, height: "100%", background: "#06b06b", transition: "width 300ms" }} />
        </div>
        <div style={{ marginTop: 6 }}>{status}</div>
      </div>
    </div>
  );
}
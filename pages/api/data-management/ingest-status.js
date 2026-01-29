// pages/api/ingest-status.js

export default async function handler(req, res) {
  try {
    const jobId = (req.query?.jobId || req.body?.jobId || "").toString();
    if (!jobId) return res.status(400).json({ error: "missing jobId" });

    const JOBS = global.JOBS || new Map();
    const job = JOBS.get(jobId);
    if (!job) return res.status(404).json({ error: "job not found" });

    // Prevent caching / 304 responses from client/proxies
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");

    return res.status(200).json({
      jobId: job.jobId,
      processed: Number(job.processed || 0),
      total: Number(job.total || 1),
      done: Boolean(job.done),
      status: job.status || null,
      error: job.error || null,
      lastLog: job.lastLog || null
    });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}

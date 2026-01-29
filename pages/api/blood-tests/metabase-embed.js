// pages/api/metabase-embed.js
import jwt from "jsonwebtoken";

export default function handler(req, res) {
  try {
    const METABASE_SITE_URL = (process.env.METABASE_SITE_URL || "").replace(/\/$/, "");
    const METABASE_SECRET_KEY = process.env.METABASE_EMBED_SECRET;
    if (!METABASE_SITE_URL || !METABASE_SECRET_KEY) {
      return res.status(500).json({ error: "Missing METABASE_SITE_URL or METABASE_EMBED_SECRET" });
    }

    const id = req.query.id || (req.body && req.body.id);
    const type = (req.query.type || (req.body && req.body.type) || "card").toString(); // "card" or "question"
    if (!id) return res.status(400).json({ error: "missing id (card or question id)" });
    if (!["card","question","dashboard"].includes(type)) return res.status(400).json({ error: "invalid type, use card|question|dashboard" });

    const payload = {
      resource: { [type]: Number(id) },
      params: {},
      exp: Math.floor(Date.now() / 1000) + (10 * 60), // 10 minutes
      iat: Math.floor(Date.now() / 1000)
    };

    const token = jwt.sign(payload, METABASE_SECRET_KEY);
    const iframeUrl = `${METABASE_SITE_URL}/embed/${type}/${token}#bordered=true&titled=true`;

    return res.status(200).json({ iframeUrl, id: Number(id), type });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}

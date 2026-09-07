const { del } = require('@vercel/blob');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');
    const { url } = body;
    if (!url) return res.status(400).json({ error: 'Missing url' });
    // Only allow deleting blobs that actually live in this project's Blob store.
    if (!url.includes('.public.blob.vercel-storage.com/')) {
      return res.status(200).json({ ok: true, skipped: true });
    }
    await del(url);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message || String(e) });
  }
};

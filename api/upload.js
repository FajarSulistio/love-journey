const { put } = require('@vercel/blob');

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const MAX_BYTES = 4 * 1024 * 1024; // stay safely under Vercel's serverless body limit

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const dateId = (req.query.dateId || 'misc').toString().replace(/[^a-zA-Z0-9_-]/g, '');
    const contentType = req.headers['content-type'] || 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      return res.status(400).json({ error: 'Only image uploads are allowed' });
    }

    const buffer = await readRawBody(req);
    if (!buffer.length) return res.status(400).json({ error: 'Empty upload' });
    if (buffer.length > MAX_BYTES) {
      return res.status(400).json({ error: `Photo too large (${(buffer.length / 1024 / 1024).toFixed(1)}MB). Please use a smaller photo.` });
    }

    const ext = (contentType.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
    const path = `love-journey/photos/date_${dateId}/${Date.now()}.${ext}`;

    const blob = await put(path, buffer, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    return res.status(200).json({ url: blob.url });
  } catch (e) {
    return res.status(500).json({ error: e.message || String(e) });
  }
};

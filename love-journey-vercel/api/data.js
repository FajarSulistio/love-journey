const { put, head } = require('@vercel/blob');

const DATA_PATH = 'love-journey/data.json';

const EMPTY_STATE = {
  extras: {},
  startDate: null,
  loveLetterText: '',
  loveLetterSig: '',
};

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      let meta;
      try {
        meta = await head(DATA_PATH);
      } catch (e) {
        // Blob doesn't exist yet -> first run, return empty state
        return res.status(200).json(EMPTY_STATE);
      }
      const r = await fetch(meta.url, { cache: 'no-store' });
      if (!r.ok) return res.status(200).json(EMPTY_STATE);
      const json = await r.json();
      return res.status(200).json({ ...EMPTY_STATE, ...json });
    } catch (e) {
      return res.status(500).json({ error: e.message || String(e) });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = req.body && typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');
      const state = {
        extras: body.extras || {},
        startDate: body.startDate || null,
        loveLetterText: body.loveLetterText || '',
        loveLetterSig: body.loveLetterSig || '',
      };
      await put(DATA_PATH, JSON.stringify(state), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message || String(e) });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
};

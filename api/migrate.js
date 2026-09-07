const { put, head } = require('@vercel/blob');

const DATA_PATH = 'love-journey/data.json';

// Old Supabase project (read-only, used once to pull existing data across).
// Safe to remove this file after migrating.
const SUPABASE_URL = 'https://wsyxuygjcdtjltjpwecy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzeXh1eWdqY2R0amx0anB3ZWN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NDA3MTEsImV4cCI6MjA5NjIxNjcxMX0.lKy3zbhrXRrepJwAe0cbP5lG0GjDFGbf95yn-MQJgMk';

module.exports = async function handler(req, res) {
  // Simple protection: require ?secret=... matching an env var, so this
  // can't be triggered by a random visitor hitting the URL.
  const secret = process.env.MIGRATE_SECRET;
  if (!secret || req.query.secret !== secret) {
    return res.status(403).json({ error: 'Forbidden. Set MIGRATE_SECRET env var and pass ?secret=... to run this once.' });
  }

  try {
    const sbFetch = async (path) => {
      const r = await fetch(SUPABASE_URL + path, {
        headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY },
      });
      if (!r.ok) throw new Error(`Supabase fetch failed (${r.status}): ${await r.text()}`);
      return r.json();
    };

    const rows = await sbFetch('/rest/v1/love_journey?select=*').catch(() => []);
    const metaRows = await sbFetch('/rest/v1/love_journey_meta?select=*&key=eq.main').catch(() => []);

    const extras = {};
    (rows || []).forEach((row) => {
      extras[row.date_id] = {
        done: row.done,
        dateStr: row.date_str || '',
        note: row.note || '',
        photos: row.photos || [], // kept as old Supabase Storage URLs
        fav: row.fav || false,
      };
    });

    let startDate = null, loveLetterText = '', loveLetterSig = '';
    if (metaRows && metaRows.length) {
      const m = JSON.parse(metaRows[0].value || '{}');
      startDate = m.startDate || null;
      loveLetterText = m.loveLetterText || '';
      loveLetterSig = m.loveLetterSig || '';
    }

    const state = { extras, startDate, loveLetterText, loveLetterSig };

    await put(DATA_PATH, JSON.stringify(state), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    return res.status(200).json({
      ok: true,
      migratedDates: Object.keys(extras).length,
      note: 'Photos still point at the old Supabase Storage URLs and will keep working as long as that project stays online. New photo uploads now go to Vercel Blob.',
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || String(e) });
  }
};

const { handleUpload } = require('@vercel/blob/client');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');

    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Only allow images, cap size at 25MB per photo
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic'],
          maximumSizeInBytes: 25 * 1024 * 1024,
          addRandomSuffix: false,
          tokenPayload: JSON.stringify({ pathname, clientPayload }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // No-op: the client saves the resulting URL into /api/data itself.
        console.log('Photo uploaded:', blob.url, tokenPayload);
      },
    });

    return res.status(200).json(jsonResponse);
  } catch (e) {
    return res.status(400).json({ error: e.message || String(e) });
  }
};

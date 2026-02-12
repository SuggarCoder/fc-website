import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from './login';

const EDGE_CONFIG_ID = process.env.EDGE_CONFIG_ID;
const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
const EDGE_CONFIG_URL = process.env.EDGE_CONFIG;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  }
  if (req.method === 'PUT') {
    return handlePut(req, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(_req: VercelRequest, res: VercelResponse) {
  if (!EDGE_CONFIG_URL) {
    return res.status(200).json({ data: null });
  }

  try {
    const { createClient } = await import('@vercel/edge-config');
    const edgeConfig = createClient(EDGE_CONFIG_URL);
    const siteData = await edgeConfig.get('siteData');
    return res.status(200).json({ data: siteData || null });
  } catch (e: any) {
    console.error('Edge Config read error:', e);
    return res.status(200).json({ data: null });
  }
}

async function handlePut(req: VercelRequest, res: VercelResponse) {
  const auth = req.headers.authorization as string | undefined;
  if (!verifyToken(auth)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!EDGE_CONFIG_ID || !VERCEL_API_TOKEN) {
    return res.status(500).json({ error: 'Edge Config not configured (EDGE_CONFIG_ID / VERCEL_API_TOKEN missing)' });
  }

  const siteData = req.body;
  if (!siteData) {
    return res.status(400).json({ error: 'Missing body' });
  }

  try {
    const response = await fetch(
      `https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${VERCEL_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              operation: 'upsert',
              key: 'siteData',
              value: siteData,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.error?.message || 'Failed to update Edge Config' });
    }

    return res.status(200).json({ success: true });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac } from 'crypto';
import { createClient } from '@vercel/edge-config';

function verifyToken(authorization: string | undefined): boolean {
  const correctPassword = process.env.adpassword;
  if (!correctPassword || !authorization) return false;

  const token = authorization.replace('Bearer ', '');
  const [timestamp, hmac] = token.split('.');
  if (!timestamp || !hmac) return false;

  const age = Date.now() - parseInt(timestamp, 10);
  if (isNaN(age) || age > 24 * 60 * 60 * 1000 || age < 0) return false;

  const expected = createHmac('sha256', correctPassword).update(timestamp).digest('hex');
  return hmac === expected;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      return await handleGet(res);
    }
    if (req.method === 'PUT') {
      return await handlePut(req, res);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}

async function handleGet(res: VercelResponse) {
  const edgeConfigUrl = process.env.EDGE_CONFIG;
  if (!edgeConfigUrl) {
    return res.status(200).json({ data: null });
  }

  const edgeConfig = createClient(edgeConfigUrl);
  const siteData = await edgeConfig.get('siteData');
  return res.status(200).json({ data: siteData || null });
}

async function handlePut(req: VercelRequest, res: VercelResponse) {
  const auth = req.headers.authorization as string | undefined;
  if (!verifyToken(auth)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const edgeConfigId = process.env.EDGE_CONFIG_ID;
  const vercelToken = process.env.VERCEL_API_TOKEN;

  if (!edgeConfigId || !vercelToken) {
    return res.status(500).json({ error: 'Edge Config not configured (EDGE_CONFIG_ID / VERCEL_API_TOKEN missing)' });
  }

  const siteData = req.body;
  if (!siteData) {
    return res.status(400).json({ error: 'Missing body' });
  }

  const response = await fetch(
    `https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${vercelToken}`,
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
    const errText = await response.text();
    return res.status(502).json({ error: `Edge Config write failed (${response.status})` });
  }

  return res.status(200).json({ success: true });
}

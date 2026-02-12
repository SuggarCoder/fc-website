import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac } from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body || {};
  const correctPassword = process.env.adpassword;

  if (!correctPassword) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (!password || password !== correctPassword) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  // Generate token: timestamp.hmac(timestamp, password)
  const timestamp = Date.now().toString();
  const hmac = createHmac('sha256', correctPassword).update(timestamp).digest('hex');
  const token = `${timestamp}.${hmac}`;

  return res.status(200).json({ token });
}

/** Verify token — export for use by other API routes */
export function verifyToken(authorization: string | undefined): boolean {
  const correctPassword = process.env.adpassword;
  if (!correctPassword || !authorization) return false;

  const token = authorization.replace('Bearer ', '');
  const [timestamp, hmac] = token.split('.');
  if (!timestamp || !hmac) return false;

  // Check token age (24 hours max)
  const age = Date.now() - parseInt(timestamp, 10);
  if (isNaN(age) || age > 24 * 60 * 60 * 1000 || age < 0) return false;

  const expected = createHmac('sha256', correctPassword).update(timestamp).digest('hex');
  return hmac === expected;
}

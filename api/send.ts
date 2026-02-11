import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstName, lastName, phone, email, company } = req.body || {};

  if (!firstName || !lastName || !email || !company) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const API_KEY = process.env.RESEND_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Float Capital <noreply@floatcapital.com>',
        to: ['addison.zhenghu@gmail.com'],
        subject: `New Contact: ${firstName} ${lastName} — ${company}`,
        html: `
          <h2>New Contact Request</h2>
          <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
            <tr><td style="padding:8px 16px;color:#888;">Name</td><td style="padding:8px 16px;">${firstName} ${lastName}</td></tr>
            <tr><td style="padding:8px 16px;color:#888;">Phone</td><td style="padding:8px 16px;">${phone || 'N/A'}</td></tr>
            <tr><td style="padding:8px 16px;color:#888;">Email</td><td style="padding:8px 16px;">${email}</td></tr>
            <tr><td style="padding:8px 16px;color:#888;">Company</td><td style="padding:8px 16px;">${company}</td></tr>
          </table>
        `,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.message || 'Failed to send email' });
    }

    const data = await response.json();
    return res.status(200).json({ success: true, id: data.id });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}

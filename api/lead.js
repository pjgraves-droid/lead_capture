// Vercel serverless function: emails the lead the PDFs in /assets via Resend.
// Env vars (set in Vercel project settings):
//   RESEND_API_KEY  - required, Resend API key with sending access
//   EMAIL_FROM      - optional, e.g. 'Cognition <hello@yourdomain.com>' (domain must be verified in Resend)
//   EMAIL_REPLY_TO  - optional

const ATTACHMENTS = [
  { path: 'assets/Devin_Overview.pdf', filename: 'Devin Overview.pdf' },
  { path: 'assets/Devin_for_Enterprise_Databricks_Migrations.pdf', filename: 'Devin for Enterprise - Databricks Migrations.pdf' },
];
const SUBJECT = 'Your Devin Max trial + resources';
const TEXT = [
  'Hi,',
  '',
  'Thanks for your interest in Devin. Attached are two resources to get you started:',
  '  - Devin Overview',
  '  - Devin for Enterprise: Databricks Migrations',
  '',
  'We will follow up shortly with your link to redeem a 2 month trial of the Devin Max plan.',
  '',
  'The Cognition team',
].join('\n');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function fetchAttachment(origin, { path, filename }) {
  const res = await fetch(`${origin}/${path}`);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return { filename, content: Buffer.from(await res.arrayBuffer()).toString('base64') };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.RESEND_API_KEY) return res.status(500).json({ error: 'RESEND_API_KEY not configured' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const email = String(body.email || '').trim();
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Invalid email' });

  const origin = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers['x-forwarded-host'] || req.headers.host}`;

  try {
    const attachments = await Promise.all(ATTACHMENTS.map((a) => fetchAttachment(origin, a)));
    const payload = {
      from: process.env.EMAIL_FROM || 'Cognition <onboarding@resend.dev>',
      to: [email],
      subject: SUBJECT,
      text: TEXT,
      attachments,
    };
    if (process.env.EMAIL_REPLY_TO) payload.reply_to = process.env.EMAIL_REPLY_TO;

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (!r.ok) {
      console.error('Resend error', data);
      return res.status(502).json({ error: data.message || 'Resend request failed' });
    }
    return res.status(200).json({ ok: true, id: data.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

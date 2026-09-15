# Cognition lead capture

Static, mobile-first lead capture page. No build step, no dependencies.

## Run

Open `index.html` directly, or serve the folder (GitHub Pages, Netlify, Vercel, `python3 -m http.server`).

## How leads are stored

- Every submission is saved in the browser's localStorage on the device running the page.
- Tap "Export CSV" in the footer to download all leads captured on that device.
- Optional: set `SLACK_WEBHOOK_URL` at the top of `app.js` to post each lead into a Slack channel. Create an Incoming Webhook (Slack app → Incoming Webhooks → Add New Webhook to Workspace, pick the channel) and paste the `https://hooks.slack.com/services/...` URL. Note the URL is visible in the page source, so anyone with it can post to that channel.
- Optional: set `WEBHOOK_URL` at the top of `app.js` to also POST each lead as JSON (Zapier, Make, HubSpot, Google Apps Script, etc.). If the request fails the lead is still kept locally.

## Send leads to a Google Sheet

Uses a Google Apps Script web app bound to a sheet — no Slack app, server or API keys required.

1. Create a new Google Sheet (https://sheets.new).
2. In the sheet, open **Extensions → Apps Script**. Replace the contents of `Code.gs` with `google-apps-script/Code.gs` from this repo and save.
3. Click **Deploy → New deployment**. Type: **Web app**. Execute as: **Me**. Who has access: **Anyone**. Click **Deploy**, then authorize the script when prompted (Advanced → Go to project if Google shows an "unverified" warning — it's your own script).
4. Copy the **Web app URL** (`https://script.google.com/macros/s/.../exec`) and paste it into `GOOGLE_SHEET_URL` at the top of `app.js`. Redeploy the page.

Each submission appends a row (header row is added automatically). If you edit `Code.gs` later, use **Deploy → Manage deployments → Edit → New version** so the same URL picks up the change.

## Email attachments to each lead (Resend, default)

`api/lead.js` is a Vercel serverless function. The page POSTs `{ email }` to `/api/lead` after saving the lead; the function fetches the PDFs in `assets/` from the same deployment and sends them via [Resend](https://resend.com).

Setup:

1. Resend: verify your sending domain at https://resend.com/domains (add the DNS records shown). Until verified, Resend only delivers to the account owner's address.
2. Resend: create an API key with *Sending access* at https://resend.com/api-keys.
3. Vercel project → Settings → Environment Variables:
   - `RESEND_API_KEY` (required)
   - `EMAIL_FROM` e.g. `Cognition <hello@yourdomain.com>` (defaults to `onboarding@resend.dev`, which only works for test sends)
   - `EMAIL_REPLY_TO` (optional)
4. Redeploy. Check delivery in https://resend.com/emails.

To edit the message or attachments, change `SUBJECT`/`TEXT`/`ATTACHMENTS` in `api/lead.js`. Set `EMAIL_API_URL = ''` in `app.js` to disable.

## Email attachments via Apps Script (alternative)

`Code.gs` can instead email the PDFs via `MailApp`, sent from the Google account that deployed the script. Set `SEND_EMAIL = true` in `Code.gs`; the outcome is recorded in the sheet's `email_status` column. Don't enable both.

To enable after updating `Code.gs`:

1. Paste the new `Code.gs` into the Apps Script editor and save. Check `SITE_URL` matches where the page is hosted.
2. Run `testSendResources` once from the editor and accept the permission prompts (Gmail send + external URL fetch). You should receive the test email.
3. **Deploy → Manage deployments → Edit → Version: New version → Deploy** so the live URL picks up the change.

Quota: 100 emails/day for a personal Gmail account, 1,500/day for Google Workspace. Total attachment size must stay under ~25 MB. To change the PDFs, replace the files in `assets/` and update `ATTACHMENTS` in `Code.gs`.

## Files

- `index.html`, `styles.css`, `app.js` - the page
- `logo.png` - Cognition glyph
- `fonts/` - NB International Pro (headings), STK Bureau Serif (body). Geist Mono falls back to the system monospace unless you add it.

# Cognition lead capture (Gartner Symposium)

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

## Files

- `index.html`, `styles.css`, `app.js` - the page
- `logo.png` - Cognition glyph
- `fonts/` - NB International Pro (headings), STK Bureau Serif (body). Geist Mono falls back to the system monospace unless you add it.

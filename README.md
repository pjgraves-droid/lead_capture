# Cognition lead capture (Gartner Symposium)

Static, mobile-first lead capture page. No build step, no dependencies.

## Run

Open `index.html` directly, or serve the folder (GitHub Pages, Netlify, Vercel, `python3 -m http.server`).

## How leads are stored

- Every submission is saved in the browser's localStorage on the device running the page.
- Tap "Export CSV" in the footer to download all leads captured on that device.
- Optional: set `SLACK_WEBHOOK_URL` at the top of `app.js` to post each lead into a Slack channel. Create an Incoming Webhook (Slack app → Incoming Webhooks → Add New Webhook to Workspace, pick the channel) and paste the `https://hooks.slack.com/services/...` URL. Note the URL is visible in the page source, so anyone with it can post to that channel.
- Optional: set `WEBHOOK_URL` at the top of `app.js` to also POST each lead as JSON (Zapier, Make, HubSpot, Google Apps Script, etc.). If the request fails the lead is still kept locally.

## Files

- `index.html`, `styles.css`, `app.js` - the page
- `logo.png` - Cognition glyph
- `fonts/` - NB International Pro (headings), STK Bureau Serif (body). Geist Mono falls back to the system monospace unless you add it.

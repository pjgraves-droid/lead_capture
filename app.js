// Optional: set to a webhook URL (Zapier, Make, Google Apps Script, HubSpot form endpoint, etc.)
// Leads are always saved locally in the browser, so the page works offline.
const WEBHOOK_URL = '';
// Optional: Slack Incoming Webhook URL (https://api.slack.com/messaging/webhooks).
// Each lead is posted as a message to the channel the webhook is bound to.
const SLACK_WEBHOOK_URL = '';
// Optional: Google Apps Script web app URL (see README and google-apps-script/Code.gs).
// Each lead is appended as a row to the bound Google Sheet.
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbzEI22q8wm364DefQAAGID8-OwH2W5f-yZajqNfqEkEyleUb9nk98qaxZSY7gcW55J6UA/exec';
const STORAGE_KEY = 'cognition_gartner_leads';
const FIELDS = ['name', 'email', 'company', 'title', 'phone', 'notes'];

const form = document.getElementById('lead-form');
const thanks = document.getElementById('thanks');
const errorEl = document.getElementById('error');

function loadLeads() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}
function saveLeads(leads) { localStorage.setItem(STORAGE_KEY, JSON.stringify(leads)); }

function slackMessage(lead) {
  const line = (label, v) => (v ? `*${label}:* ${v}` : null);
  const fields = [
    line('Name', lead.name), line('Email', lead.email), line('Company', lead.company),
    line('Title', lead.title), line('Phone', lead.phone),
  ].filter(Boolean);
  const blocks = [
    { type: 'header', text: { type: 'plain_text', text: `New lead: ${lead.name} (${lead.company})` } },
    { type: 'section', text: { type: 'mrkdwn', text: fields.join('\n') } },
  ];
  if (lead.notes) blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `*Notes:*\n${lead.notes}` } });
  blocks.push({ type: 'context', elements: [{ type: 'mrkdwn', text: `${lead.event} · ${lead.submitted_at}` }] });
  return { text: `New lead: ${lead.name} <${lead.email}> — ${lead.company}`, blocks };
}

async function postToSlack(lead) {
  // No Content-Type header + no-cors keeps this a "simple" request, which Slack webhooks accept from a browser.
  await fetch(SLACK_WEBHOOK_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(slackMessage(lead)) });
}

async function postToSheet(lead) {
  // no-cors (and no Content-Type header) avoids the preflight that Apps Script web apps can't answer.
  await fetch(GOOGLE_SHEET_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(lead) });
}

function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
function clearError() { errorEl.hidden = true; }

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();
  form.querySelectorAll('.invalid').forEach((el) => el.classList.remove('invalid'));

  const data = { submitted_at: new Date().toISOString(), event: 'Gartner Symposium' };
  FIELDS.forEach((f) => { data[f] = form.elements[f].value.trim(); });

  let firstInvalid = null;
  for (const f of ['name', 'email', 'company']) {
    if (!data[f]) { form.elements[f].classList.add('invalid'); firstInvalid ??= form.elements[f]; }
  }
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    form.elements.email.classList.add('invalid'); firstInvalid ??= form.elements.email;
  }
  if (firstInvalid) { showError('Please fill in name, work email, and company.'); firstInvalid.focus(); return; }
  if (!form.elements.consent.checked) { showError('Please confirm you agree to be contacted.'); return; }

  const btn = form.querySelector('button[type=submit]');
  btn.disabled = true;

  const leads = loadLeads();
  leads.push(data);
  saveLeads(leads);

  if (WEBHOOK_URL) {
    try {
      await fetch(WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    } catch (err) {
      console.warn('Webhook failed; lead kept locally.', err);
    }
  }
  if (SLACK_WEBHOOK_URL) {
    try {
      await postToSlack(data);
    } catch (err) {
      console.warn('Slack post failed; lead kept locally.', err);
    }
  }
  if (GOOGLE_SHEET_URL) {
    try {
      await postToSheet(data);
    } catch (err) {
      console.warn('Google Sheet post failed; lead kept locally.', err);
    }
  }

  btn.disabled = false;
  form.reset();
  form.hidden = true;
  thanks.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.getElementById('another').addEventListener('click', () => {
  thanks.hidden = true;
  form.hidden = false;
  form.elements.name.focus();
});

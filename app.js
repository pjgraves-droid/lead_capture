// Optional: set to a webhook URL (Zapier, Make, Google Apps Script, HubSpot form endpoint, etc.)
// Leads are always saved locally in the browser and exportable as CSV, so the page works offline.
const WEBHOOK_URL = '';
const STORAGE_KEY = 'cognition_gartner_leads';
const FIELDS = ['name', 'email', 'company', 'title', 'phone', 'interest', 'notes'];

const form = document.getElementById('lead-form');
const thanks = document.getElementById('thanks');
const errorEl = document.getElementById('error');
const countEl = document.getElementById('count');

function loadLeads() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}
function saveLeads(leads) { localStorage.setItem(STORAGE_KEY, JSON.stringify(leads)); }
function updateCount() {
  const n = loadLeads().length;
  countEl.textContent = n ? `${n} lead${n === 1 ? '' : 's'} saved on this device` : 'No leads saved yet';
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
  updateCount();

  if (WEBHOOK_URL) {
    try {
      await fetch(WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    } catch (err) {
      console.warn('Webhook failed; lead kept locally.', err);
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

document.getElementById('export').addEventListener('click', () => {
  const leads = loadLeads();
  if (!leads.length) return;
  const cols = ['submitted_at', 'event', ...FIELDS];
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [cols.join(','), ...leads.map((l) => cols.map((c) => esc(l[c])).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `cognition-gartner-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
});

updateCount();

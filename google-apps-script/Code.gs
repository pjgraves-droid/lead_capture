// Google Apps Script web app that appends each lead to the bound Google Sheet
// and emails the lead the PDF attachments listed below.
// See README.md ("Send leads to a Google Sheet" / "Email attachments") for setup steps.

const COLUMNS = ['submitted_at', 'event', 'name', 'email', 'company', 'title', 'phone', 'interest', 'notes', 'email_status'];

// Set true to email the PDFs from this script instead of the Vercel/Resend function (api/lead.js).
const SEND_EMAIL = false;
// Public base URL where the page (and /assets) is hosted.
const SITE_URL = 'https://lead-capture-swart.vercel.app';
const ATTACHMENTS = [
  'assets/Devin_Overview.pdf',
  'assets/Devin_for_Enterprise_Databricks_Migrations.pdf',
];
const EMAIL_SUBJECT = 'Your Devin Max trial + resources';
const EMAIL_SENDER_NAME = 'Cognition';
const EMAIL_BODY = [
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

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const lead = JSON.parse(e.postData.contents);
  lead.email_status = SEND_EMAIL ? sendResources(lead.email) : '';
  if (sheet.getLastRow() === 0) sheet.appendRow(COLUMNS);
  sheet.appendRow(COLUMNS.map((c) => lead[c] || ''));
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}

function sendResources(email) {
  if (!email) return 'skipped: no email';
  try {
    const attachments = ATTACHMENTS.map((path) => UrlFetchApp.fetch(`${SITE_URL}/${path}`).getBlob());
    MailApp.sendEmail({ to: email, subject: EMAIL_SUBJECT, body: EMAIL_BODY, name: EMAIL_SENDER_NAME, attachments });
    return 'sent';
  } catch (err) {
    return `failed: ${err.message}`;
  }
}

// Run manually from the Apps Script editor once to grant Mail/UrlFetch permissions and check delivery.
function testSendResources() {
  Logger.log(sendResources(Session.getActiveUser().getEmail()));
}

function doGet() {
  return ContentService.createTextOutput('Lead capture endpoint is running.');
}

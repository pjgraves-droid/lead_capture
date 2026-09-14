// Google Apps Script web app that appends each lead to the bound Google Sheet.
// See README.md ("Send leads to a Google Sheet") for setup steps.

const COLUMNS = ['submitted_at', 'event', 'name', 'email', 'company', 'title', 'phone', 'interest', 'notes'];

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const lead = JSON.parse(e.postData.contents);
  if (sheet.getLastRow() === 0) sheet.appendRow(COLUMNS);
  sheet.appendRow(COLUMNS.map((c) => lead[c] || ''));
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput('Lead capture endpoint is running.');
}

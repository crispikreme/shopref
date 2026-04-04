const { google } = require('googleapis');

// Environment variables (set these in Vercel project settings):
//   GOOGLE_SHEET_ID               — 118205676371294514951
//   GOOGLE_SERVICE_ACCOUNT_JSON   — the full contents of shopref-d45cc9116f14.json

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

function getCredentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not set.');
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON.');
  }
}

// Columns (in order): Timestamp | Session | Tech | Vehicle | Query | Answer | Confidence | Correct | Notes
const COLUMNS = ['timestamp', 'session', 'tech', 'vehicle', 'query', 'answer', 'confidence', 'correct', 'notes'];

module.exports = async (req, res) => {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  if (!SHEET_ID) {
    return res.status(500).json({ error: 'GOOGLE_SHEET_ID environment variable is not set.' });
  }

  try {
    const body = req.body || {};

    // Build the row — timestamp is always server-generated
    const timestamp = new Date().toISOString();
    const row = [
      timestamp,
      body.session   ?? '',
      body.tech      ?? '',
      body.vehicle   ?? '',
      body.query     ?? '',
      body.answer    ?? '',
      body.confidence ?? '',
      body.correct   ?? '',
      body.notes     ?? '',
    ];

    // Authenticate with Google using the service account credentials
    const auth = new google.auth.GoogleAuth({
      credentials: getCredentials(),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Append the row to Sheet1 (first tab); adjust range if your tab is named differently
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A:I',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [row],
      },
    });

    return res.status(200).json({ success: true, timestamp });
  } catch (err) {
    console.error('[ShopRef log error]', err);
    return res.status(500).json({ error: 'Failed to write log entry.', detail: err.message });
  }
};

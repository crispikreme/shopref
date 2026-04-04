const { google } = require('googleapis');

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

function getCredentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not set.');
  try { return JSON.parse(raw); }
  catch { throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON.'); }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed.' });

  const body = req.body || {};
  const { session, tech, vehicle, query } = body;

  if (!query) return res.status(400).json({ error: 'No query provided.' });

  try {
    // Call Anthropic API server-side
    const prompt = `You are an automotive reference tool for shop floor technicians. Vehicle: ${vehicle}. Tech asks: "${query}"\nRespond ONLY with valid JSON, no markdown:\n{ "answer": "lookup result in as few words as possible", "detail": "1-2 sentences of essential context. Use <strong> tags for key values.", "confidence": "high|medium|low", "confidence_note": "if medium or low, brief reason. empty string if high" }`;

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const anthropicData = await anthropicRes.json();
    const raw = anthropicData.content?.[0]?.text || '{}';console.log('[ShopRef raw]', JSON.stringify(anthropicData));
    let parsed;
    try { parsed = JSON.parse(raw.replace(/^```json|```$/g, '').trim()); }
    catch { parsed = { answer: 'Parse error', detail: '', confidence: 'low', confidence_note: '' }; }

    // Log to Google Sheets
    const timestamp = new Date().toISOString();
    const row = [timestamp, session ?? '', tech ?? '', vehicle ?? '', query, parsed.answer || '', parsed.confidence || '', '', parsed.confidence_note || ''];

    const auth = new google.auth.GoogleAuth({ credentials: getCredentials(), scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth });
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A:I',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] }
    });

    return res.status(200).json({ success: true, ...parsed, _raw: raw, _anthropicData: anthropicData });

  } catch (err) {
    console.error('[ShopRef error]', err);
    return res.status(500).json({ error: 'Server error.', detail: err.message });
  }
};
export default async function handler(req, res) {
  const { year, make, model } = req.query;
  if (!make || !model) {
    return res.status(400).json({ error: 'make and model required' });
  }

  const url = `https://www.carqueryapi.com/api/0.3/?cmd=getTrims&year=${year || ''}&make=${make}&model=${model}&sold_in_us=1`;

  try {
    const response = await fetch(url);
    const text = await response.text();
    return res.status(200).json({ raw: text });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch trims', detail: e.message });
  }
}

export default async function handler(req, res) {
  const { year, make, model } = req.query;
  if (!make || !model) {
    return res.status(400).json({ error: 'make and model required' });
  }

  const url = `https://www.carqueryapi.com/api/0.3/?cmd=getTrims&year=${year || ''}&make=${make}&model=${model}&sold_in_us=1&format=json`;

  try {
    const response = await fetch(url);
    const text = await response.text();
    // CarQuery wraps response in a callback, strip it
    const json = JSON.parse(text.replace(/^\?\(/, '').replace(/\);?$/, ''));
    const trims = json.Trims.map(t => ({
      id: t.model_id,
      name: t.model_trim,
      engine: `${t.model_engine_l}L ${t.model_engine_type} ${t.model_engine_cyl}cyl`
    }));
    res.status(200).json({ trims });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch trims', detail: e.message });
  }
}

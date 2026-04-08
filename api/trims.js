const fetch = require("node-fetch");

module.exports = async (req, res) => {
  const { year, make, model } = req.query;

  if (!year || !make || !model) {
    return res.status(400).json({ error: "Missing year, make, or model" });
  }

  const url = `https://www.carqueryapi.com/api/0.3/?callback=jsonp&cmd=getTrims&year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`;

  try {
    const response = await fetch(url);
    const text = await response.text();

    // CarQuery returns JSONP: jsonp({...}) — strip the wrapper
    const jsonString = text.replace(/^[^(]+\(/, "").replace(/\);?\s*$/, "");
    const data = JSON.parse(jsonString);

    res.status(200).json(data);
  } catch (err) {
    console.error("trims.js error:", err.message);
    res.status(500).json({ error: "Failed to fetch trims", detail: err.message });
  }
};

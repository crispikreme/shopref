module.exports = async (req, res) => {
  const { year, make, model } = req.query;

  if (!make || !model) {
    return res.status(400).json({ error: "make and model required" });
  }

  const params = new URLSearchParams({ make, model });
  if (year) params.set("year", year);

  const url = `https://api.api-ninjas.com/v1/cars?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: { "X-Api-Key": process.env.API_NINJAS_KEY }
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error("trims.js error:", err.message);
    res.status(500).json({ error: "Failed to fetch trims", detail: err.message });
  }
};

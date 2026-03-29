export default async function handler(req, res) {
  try {
    const product = req.query?.product;
    if (!product || !["gairmet", "sigmet", "airsigmet", "convective_sigmet", "cwa", "taf"].includes(product)) {
      return res.status(400).json({ error: "Invalid product" });
    }

    const tryUrls = [];
    if (product === "sigmet") {
      tryUrls.push("https://aviationweather.gov/api/data/sigmet?format=geojson");
      tryUrls.push("https://aviationweather.gov/api/data/airsigmet?format=geojson");
    } else if (product === "cwa") {
      tryUrls.push("https://aviationweather.gov/api/data/cwa?format=geojson");
    } else if (product === "taf") {
      const ids = req.query?.ids || "";
      tryUrls.push(`https://aviationweather.gov/api/data/taf?ids=${encodeURIComponent(ids)}&format=json`);
    } else {
      tryUrls.push(`https://aviationweather.gov/api/data/${product}?format=geojson`);
    }

    let lastStatus = 500;
    let lastBody = "";
    let contentType = "application/json";

    for (const url of tryUrls) {
      const upstream = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      const body = await upstream.text();
      if (upstream.ok) {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Cache-Control", "public, max-age=120");
        return res.status(200).send(body);
      }
      lastStatus = upstream.status;
      lastBody = body;
      contentType = upstream.headers.get("content-type") || "text/plain";
    }

    res.setHeader("Content-Type", contentType);
    return res.status(lastStatus).send(lastBody || "Upstream fetch failed");
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

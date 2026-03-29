export default async function handler(req, res) {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).send("Missing url parameter");
    }

    const upstream = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      return res.status(upstream.status).send(text || "Failed to fetch chart");
    }

    const arrayBuffer = await upstream.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", upstream.headers.get("content-type") || "image/gif");
    res.setHeader("Cache-Control", "public, max-age=300");
    return res.status(200).send(buffer);
  } catch (e) {
    return res.status(500).send("Prog chart proxy error: " + e.message);
  }
}

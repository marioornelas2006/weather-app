export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: { message: "Method not allowed" } });
    }

    const body = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: { message: "GEMINI_API_KEY is not configured." } });
    }

    const payload = {
      ...body,
      generationConfig: {
        temperature: 0.2,
        ...(body.generationConfig || {}),
      },
    };

    const attempts = [
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey,
      "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=" + apiKey,
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey,
      "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=" + apiKey,
    ];

    let lastError = null;

    for (const url of attempts) {
      const upstream = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await upstream.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }

      const hasCandidate = !!data?.candidates?.[0]?.content?.parts?.length;
      const blocked = !!data?.promptFeedback?.blockReason;

      if (upstream.ok && (hasCandidate || blocked)) {
        res.setHeader("Content-Type", "application/json");
        return res.status(200).send(JSON.stringify(data));
      }

      lastError = {
        status: upstream.status,
        url,
        message: data?.error?.message || data?.raw || ("HTTP " + upstream.status),
      };
    }

    return res.status(502).json({
      error: {
        message: lastError?.message || "Gemini request failed.",
        status: lastError?.status || 502,
        modelAttempted: lastError?.url || null,
      },
    });
  } catch (e) {
    return res.status(500).json({ error: { message: e.message } });
  }
}

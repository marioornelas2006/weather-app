export default async function handler(req, res) {
  try {
    const idsParam = req.query?.ids || "";
    const ids = idsParam.split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
    if (!ids.length) {
      return res.status(200).json({});
    }

    const upstream = await fetch("https://davidmegginson.github.io/ourairports-data/runways.csv", {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!upstream.ok) {
      return res.status(upstream.status).send("Failed to fetch runway data");
    }

    const csv = await upstream.text();

    function parseCsvLine(line) {
      const out = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === "," && !inQuotes) {
          out.push(cur);
          cur = "";
        } else {
          cur += ch;
        }
      }
      out.push(cur);
      return out;
    }

    const lines = csv.split(/\r?\n/).filter(Boolean);
    const headers = parseCsvLine(lines[0]);
    const idx = Object.fromEntries(headers.map((h, i) => [h, i]));
    const result = {};
    ids.forEach(id => result[id] = { runways: [] });

    for (let i = 1; i < lines.length; i++) {
      const row = parseCsvLine(lines[i]);
      const ident = (row[idx.airport_ident] || "").toUpperCase();
      if (!result[ident]) continue;

      const closedRaw = (row[idx.closed] || "").toLowerCase();
      const closed = closedRaw === "1" || closedRaw === "true";
      if (closed) continue;

      const leIdent = row[idx.le_ident] || "";
      const heIdent = row[idx.he_ident] || "";
      const leHeading = row[idx.le_heading_degT] || "";
      const heHeading = row[idx.he_heading_degT] || "";

      if (leIdent) result[ident].runways.push({ ident: leIdent, heading: leHeading ? parseFloat(leHeading) : null });
      if (heIdent) result[ident].runways.push({ ident: heIdent, heading: heHeading ? parseFloat(heHeading) : null });
    }

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.status(200).send(JSON.stringify(result));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

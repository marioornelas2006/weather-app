import Busboy from "busboy";
import pdf from "pdf-parse";

export const config = {
  api: {
    bodyParser: false,
  },
};

function readFileFromMultipart(req) {
  return new Promise((resolve, reject) => {
    const bb = Busboy({ headers: req.headers });
    const fileBuffers = [];
    let gotFile = false;

    bb.on("file", (_name, file) => {
      gotFile = true;
      file.on("data", (data) => fileBuffers.push(data));
    });

    bb.on("error", reject);
    bb.on("finish", () => {
      if (!gotFile) return reject(new Error("No PDF file uploaded."));
      resolve(Buffer.concat(fileBuffers));
    });

    req.pipe(bb);
  });
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const buffer = await readFileFromMultipart(req);
    const parsed = await pdf(buffer);

    return res.status(200).json({ text: parsed.text || "" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

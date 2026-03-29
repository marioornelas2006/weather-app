export default async function handler(req, res) {
  res.status(200).json({
    key: process.env.CHECKWX_API_KEY || ""
  });
}

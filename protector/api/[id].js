export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { id } = req.query;

  // Validate ID (8 lowercase letters/numbers)
  if (!id || !/^[a-z0-9]{8}$/.test(id)) {
    return res.status(400).send("-- Invalid script ID");
  }

  const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return res.status(500).send("-- Storage not configured");
  }

  try {
    const response = await fetch(`${UPSTASH_URL}/get/${id}`, {
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
      },
    });

    const data = await response.json();
    const result = data.result;

    if (!result) {
      return res
        .status(404)
        .send(`-- Script "${id}" not found or expired`);
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");

    return res.status(200).send(result);
  } catch (err) {
    return res.status(500).send("-- Failed to fetch script");
  }
}

// api/[id].js — returns raw Lua code for a given script ID
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { id } = req.query;

  if (!id || !/^[a-z0-9]{8}$/.test(id))
    return res.status(400).send("-- Invalid script ID");

  const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!UPSTASH_URL || !UPSTASH_TOKEN)
    return res.status(500).send("-- Storage not configured");

  const response = await fetch(`${UPSTASH_URL}/get/${id}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
  });

  const { result } = await response.json();

  if (!result)
    return res
      .status(404)
      .send(`-- Script "${id}" not found or has expired (30-day TTL)`);

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).send(result);
}

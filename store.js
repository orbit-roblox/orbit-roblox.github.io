// api/store.js — saves Lua code to Upstash Redis, returns 8-char ID
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { code } = req.body;
  if (!code || typeof code !== "string" || code.trim().length === 0)
    return res.status(400).json({ error: "No code provided" });

  if (code.length > 500_000)
    return res.status(400).json({ error: "Script too large (max 500KB)" });

  const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!UPSTASH_URL || !UPSTASH_TOKEN)
    return res.status(500).json({ error: "Storage not configured" });

  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const generateId = () =>
    Array.from({ length: 8 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");

  // Find a unique ID
  let id = generateId();
  for (let attempts = 0; attempts < 5; attempts++) {
    const check = await fetch(`${UPSTASH_URL}/get/${id}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    });
    const { result } = await check.json();
    if (!result) break;
    id = generateId();
  }

  // Store with 30-day TTL (2592000 seconds)
  const stored = await fetch(`${UPSTASH_URL}/set/${id}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([code, "EX", 2592000]),
  });

  if (!stored.ok)
    return res.status(500).json({ error: "Failed to store script" });

  return res.status(200).json({ id });
}

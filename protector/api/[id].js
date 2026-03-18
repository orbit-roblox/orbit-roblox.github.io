export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { id } = req.query;

  // Validate ID
  if (!id || !/^[a-z0-9]{8}$/.test(id)) {
    return res.status(400).send("-- invalid script id");
  }

  const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return res.status(500).send('return "storage not configured"');
  }

  // 🔒 BLOCK BROWSERS (allow Roblox/executors)
  const ua = req.headers["user-agent"] || "";

  const isBrowser =
    ua.includes("Mozilla") ||
    ua.includes("Chrome") ||
    ua.includes("Safari") ||
    ua.includes("Firefox") ||
    ua.includes("Edg");

  if (isBrowser) {
    return res
      .status(403)
      // IMPORTANT: valid Lua so it doesn't crash
      .send('return "you do not have access to view this source"');
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
        .send('return "script not found or expired"');
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");

    return res.status(200).send(result);
  } catch (err) {
    return res.status(500).send('return "failed to fetch script"');
  }
}

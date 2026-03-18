export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { id } = req.query;

  if (!id || !/^[a-z0-9]{8}$/.test(id)) {
    return res.status(200).send('print("invalid id")');
  }

  const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return res.status(200).send('print("storage not configured")');
  }

  try {
    const response = await fetch(`${UPSTASH_URL}/get/${id}`, {
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
      },
    });

    const data = await response.json();
    const script = data.result;

    if (!script) {
      return res.status(200).send('print("script not found")');
    }

    // 🔒 SAFE "PROTECTION" (DOES NOT BREAK ROBLOX)
    const ua = req.headers["user-agent"] || "";

    const isBrowser =
      ua.includes("Chrome") ||
      ua.includes("Firefox") ||
      ua.includes("Safari") ||
      ua.includes("Edg");

    if (isBrowser) {
      return res.status(200).send('print("access denied")');
    }

    // ✅ ALWAYS RETURN VALID LUA FUNCTION
    return res.status(200).send(`
      return function()
        ${script}
      end
    `);

  } catch (err) {
    return res.status(200).send('print("server error")');
  }
}

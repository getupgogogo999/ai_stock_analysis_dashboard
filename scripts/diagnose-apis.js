require("dotenv").config();
const { ProxyAgent, fetch: undiciFetch } = require("undici");

function apiFetch(url, options = {}) {
  const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  if (proxy) {
    return undiciFetch(url, { ...options, dispatcher: new ProxyAgent(proxy) });
  }
  return fetch(url, options);
}

async function test(name, fn) {
  try {
    await fn();
    console.log("[OK]", name);
    return true;
  } catch (e) {
    console.log("[FAIL]", name, "-", e.cause?.code || e.message);
    return false;
  }
}

async function main() {
  await test("OpenAI", async () => {
    const res = await apiFetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.OPENAI_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 5,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error("HTTP " + res.status + ": " + t.slice(0, 150));
    }
  });

  await test("Supabase", async () => {
    const res = await fetch(
      process.env.SUPABASE_URL + "/rest/v1/stock_analyses?select=id&limit=1",
      {
        headers: {
          apikey: process.env.SUPABASE_ANON_KEY,
          Authorization: "Bearer " + process.env.SUPABASE_ANON_KEY,
        },
      }
    );
    if (!res.ok) {
      const t = await res.text();
      throw new Error("HTTP " + res.status + ": " + t.slice(0, 150));
    }
  });
}

main();

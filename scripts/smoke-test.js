#!/usr/bin/env node
/**
 * 端到端冒烟测试 — 仅使用 Node 内置模块，无需 npm install
 * 不打印任何 API 密钥内容
 */
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env");

function loadEnv() {
  if (!fs.existsSync(envPath)) throw new Error(".env 不存在");
  const env = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
  }
  return env;
}

async function testFinnhub(key) {
  const res = await fetch("https://finnhub.io/api/v1/quote?symbol=AAPL&token=" + key);
  if (!res.ok) throw new Error("Finnhub HTTP " + res.status);
  const data = await res.json();
  if (!data.c) throw new Error("Finnhub 返回数据无效");
  console.log("[OK] Finnhub — AAPL 当前价 $" + data.c);
}

async function testOpenAI(key, model) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model || "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: 'Return JSON: {"status":"ok"}' },
        { role: "user", content: "test" },
      ],
      max_tokens: 20,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error("OpenAI HTTP " + res.status + ": " + err.slice(0, 120));
  }
  console.log("[OK] OpenAI — API 连接正常");
}

async function testSupabase(url, key) {
  const res = await fetch(url + "/rest/v1/stock_analyses?select=id&limit=1", {
    headers: { apikey: key, Authorization: "Bearer " + key },
  });
  if (res.status === 404 || res.status === 406) {
    throw new Error("Supabase 表 stock_analyses 不存在，请在 SQL Editor 执行 supabase/schema.sql");
  }
  if (!res.ok) {
    const err = await res.text();
    throw new Error("Supabase HTTP " + res.status + ": " + err.slice(0, 120));
  }
  console.log("[OK] Supabase — 数据库连接正常");
}

async function main() {
  console.log("=== API 连接测试（不显示密钥）===\n");

  const env = loadEnv();
  const required = ["FINNHUB_API_KEY", "OPENAI_API_KEY", "SUPABASE_URL", "SUPABASE_ANON_KEY"];
  const placeholders = ["your_finnhub", "your_openai", "your-project", "your_supabase"];

  for (const k of required) {
    if (!env[k] || placeholders.some((p) => env[k].includes(p))) {
      console.error("[FAIL] 请先在 .env 中填入真实的 " + k + " 并保存文件");
      process.exit(1);
    }
  }

  await testFinnhub(env.FINNHUB_API_KEY);
  await testOpenAI(env.OPENAI_API_KEY, env.OPENAI_MODEL);
  await testSupabase(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

  console.log("\n[PASS] 三个 API 全部连接成功，可以启动项目了");
  console.log("下一步: npm run install:all && npm run dev:server (终端1) && npm run dev:client (终端2)");
}

main().catch((err) => {
  console.error("[FAIL]", err.message);
  process.exit(1);
});

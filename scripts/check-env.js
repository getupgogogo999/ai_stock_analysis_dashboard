#!/usr/bin/env node
/**
 * 检查 .env 是否已填入真实密钥（不打印密钥内容）
 */
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env");
const PLACEHOLDERS = [
  "your_finnhub_api_key",
  "your_openai_api_key",
  "your_supabase_anon_key",
  "your-project.supabase.co",
];

const KEYS = [
  "FINNHUB_API_KEY",
  "OPENAI_API_KEY",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
];

if (!fs.existsSync(envPath)) {
  console.error("[FAIL] .env 文件不存在，请执行: copy .env.example .env");
  process.exit(1);
}

const env = {};
for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
}

let ok = true;

for (const key of KEYS) {
  const val = env[key];
  if (!val) {
    console.error(`[FAIL] ${key} 未配置（.env 中 = 后面为空）`);
    ok = false;
  } else if (PLACEHOLDERS.some((p) => val.includes(p))) {
    console.error(`[FAIL] ${key} 仍是占位符，请在 .env 中填入真实密钥`);
    ok = false;
  } else {
    console.log(`[OK] ${key} 已配置 (${val.length} 字符)`);
  }
}

if (!ok) {
  console.error("\n请编辑 project1/.env，填入你从 Finnhub / OpenAI / Supabase 获取的密钥。");
  process.exit(1);
}

console.log("\n[PASS] 所有 API 密钥已配置");

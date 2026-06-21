/**
 * 集中管理环境变量 — 所有 API 密钥只从 .env 读取，禁止在代码中硬编码。
 * .env 文件已被 .gitignore 排除，不会上传到 GitHub。
 */
require("dotenv").config();

const SECRET_KEYS = [
  "FINNHUB_API_KEY",
  "OPENAI_API_KEY",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
];

function getRequired(key) {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(
      `Missing ${key}. Add it to your .env file (see .env.example). Never commit .env to Git.`
    );
  }
  return value;
}

function getOptional(key, fallback = "") {
  return process.env[key]?.trim() || fallback;
}

/** 启动时检查 .env 是否已配置（不打印密钥内容） */
function validateEnvOnStartup() {
  const missing = SECRET_KEYS.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    console.warn(
      `[Security] 以下环境变量未配置: ${missing.join(", ")}\n` +
        "  → 请复制 .env.example 为 .env 并填入密钥。\n" +
        "  → .env 已在 .gitignore 中，不会上传到 GitHub。"
    );
  } else {
    console.log("[LLM] 使用 OpenAI（密钥从 .env 读取，不会暴露给前端）");
  }
}

function getMlServiceUrl() {
  return getOptional("ML_SERVICE_URL", "http://127.0.0.1:8000");
}

module.exports = {
  getRequired,
  getOptional,
  validateEnvOnStartup,
  getMlServiceUrl,
  SECRET_KEYS,
};

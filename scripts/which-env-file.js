const fs = require("fs");
const path = require("path");

const PLACEHOLDERS = [
  "your_finnhub_api_key",
  "your_openai_api_key",
  "your_supabase_anon_key",
  "your-project.supabase.co",
];
const KEYS = ["FINNHUB_API_KEY", "OPENAI_API_KEY", "SUPABASE_URL", "SUPABASE_ANON_KEY"];

function status(file) {
  const full = path.join(__dirname, "..", file);
  if (!fs.existsSync(full)) return { file, state: "missing", configured: 0 };
  const env = {};
  for (const line of fs.readFileSync(full, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
  }
  let configured = 0;
  for (const k of KEYS) {
    const v = env[k];
    if (v && !PLACEHOLDERS.some((p) => v.includes(p))) configured++;
  }
  return { file, state: configured === 4 ? "ready" : configured > 0 ? "partial" : "placeholder", configured };
}

for (const f of [".env", ".env.example"]) {
  const r = status(f);
  console.log(`${r.file}: ${r.configured}/4 keys configured (${r.state})`);
}

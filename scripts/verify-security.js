#!/usr/bin/env node
/**
 * 安全检查脚本 — 不读取、不打印 .env 中的密钥内容
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const errors = [];
const warnings = [];

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

function exists(file) {
  return fs.existsSync(path.join(ROOT, file));
}

if (!exists(".env")) {
  errors.push(".env 文件不存在，请执行: copy .env.example .env 并填入密钥");
} else {
  console.log("[OK] .env 文件存在（内容不会被打印）");
}

const gitignore = read(".gitignore");
if (!gitignore.includes(".env")) {
  errors.push(".gitignore 未包含 .env，密钥可能被提交到 GitHub！");
} else {
  console.log("[OK] .gitignore 已忽略 .env");
}

if (exists(".git")) {
  try {
    const { execSync } = require("child_process");
    const tracked = execSync("git ls-files .env", { cwd: ROOT, encoding: "utf8" }).trim();
    if (tracked) {
      errors.push(".env 已被 git 追踪！请执行: git rm --cached .env");
    } else {
      console.log("[OK] .env 未被 git 追踪");
    }
  } catch {
    warnings.push("无法检查 git 追踪状态");
  }
}

const SECRET_PATTERNS = [
  { name: "OpenAI Key", regex: /sk-[a-zA-Z0-9]{20,}/ },
  { name: "JWT Token", regex: /eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]+/ },
];

const scanDirs = ["server", "client/src"];
const codeExts = [".js", ".jsx", ".ts", ".tsx"];

function scanDir(dir) {
  const full = path.join(ROOT, dir);
  if (!exists(dir)) return;
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules") {
      scanDir(rel);
    } else if (codeExts.some((ext) => entry.name.endsWith(ext))) {
      const content = read(rel);
      for (const { name, regex } of SECRET_PATTERNS) {
        if (regex.test(content)) {
          errors.push(`${rel} 中检测到疑似硬编码 ${name}`);
        }
      }
      if (/VITE_.*KEY/i.test(content)) {
        errors.push(`${rel} 中检测到 VITE_ 前缀密钥变量，前端不应持有 API Key`);
      }
    }
  }
}

scanDirs.forEach(scanDir);
console.log("[OK] 源码扫描完成");

if (exists(".env.example")) {
  const example = read(".env.example");
  for (const { name, regex } of SECRET_PATTERNS) {
    if (regex.test(example)) {
      errors.push(`.env.example 中含有真实 ${name}，请改为占位符`);
    }
  }
  console.log("[OK] .env.example 检查完成");
}

console.log("\n--- 安全检查结果 ---");
warnings.forEach((w) => console.warn("[WARN]", w));
if (errors.length > 0) {
  errors.forEach((e) => console.error("[FAIL]", e));
  process.exit(1);
}
console.log("[PASS] 所有安全检查通过");

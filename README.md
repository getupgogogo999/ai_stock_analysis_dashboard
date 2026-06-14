# AI Stock Analysis Dashboard

> AI 股票分析仪表盘（简化版）— 全栈应用，使用 LLM 分析股票数据并存储至 Supabase。

## 在线访问 URL

> Render 线上地址：
> **https://ai-stock-analysis-dashboard-qnfc.onrender.com/**

## 安全说明（API 密钥保护）

**所有 API 密钥只放在 `.env` 文件中，绝不在代码里硬编码，也不会上传到 GitHub。**

| 规则 | 说明 |
|------|------|
| `.env` | 存放真实密钥，**已被 `.gitignore` 忽略**，不会提交 |
| `.env.example` | 仅含占位符模板，**可以安全提交**到 GitHub |
| 前端 | **不包含任何 API Key**，只调用后端 `/api` 接口 |
| 后端 | 通过 `process.env` 读取密钥，仅在服务器内存中使用 |
| Render 部署 | 在 Render Dashboard 的 Environment 中配置密钥，不写入代码 |

本地首次使用时：

```bash
copy .env.example .env    # Windows
# 然后编辑 .env，填入你的真实密钥（保存后运行 npm run check:env 验证）
```

**`.env` 填写格式示例（请替换为你自己的真实密钥）：**

```env
FINNHUB_API_KEY=xxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxxxxx
```

验证密钥是否配置正确（不会打印密钥内容）：

```bash
npm run check:env
npm run smoke:test
```

推送 GitHub 前请确认：

```bash
git status   # 确认 .env 不在待提交列表中
```

## 功能概览

| 功能 | 说明 |
|------|------|
| 数据获取 | 输入股票代码（如 AAPL），调用 Finnhub 免费 API 获取实时行情 |
| AI 分析 | 点击按钮调用 OpenAI LLM，返回严格 JSON 格式分析结果 |
| 数据存储 | 分析结果自动写入 Supabase `stock_analyses` 表 |
| 历史记录 | 页面底部展示最近分析记录 |

## 技术栈

- **前端**：React + Vite
- **后端**：Node.js + Express
- **股票数据**：Finnhub API（免费）
- **LLM**：OpenAI API（`response_format: json_object` 强制 JSON 输出）
- **数据库**：Supabase (PostgreSQL)
- **部署**：Render.com

## 本地开发

### 1. 安装依赖

```bash
npm run install:all
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填入密钥：

```bash
cp .env.example .env
```

| 变量 | 获取方式 |
|------|----------|
| `FINNHUB_API_KEY` | [finnhub.io/register](https://finnhub.io/register) 免费注册 |
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `SUPABASE_URL` | [supabase.com](https://supabase.com) 创建项目后获取 |
| `SUPABASE_ANON_KEY` | Supabase 项目 Settings → API |

### 3. 初始化 Supabase 数据库

在 Supabase SQL Editor 中执行 `supabase/schema.sql`。

### 4. 启动开发服务器

```bash
# 终端 1：后端 (port 3001)
npm run dev:server

# 终端 2：前端 (port 5173，自动代理 /api)
npm run dev:client
```

浏览器访问 http://localhost:5173

## 部署到 Render

1. 将代码推送到 GitHub
2. 在 [Render Dashboard](https://dashboard.render.com) 创建 **Web Service**
3. 连接 GitHub 仓库，Render 会自动读取 `render.yaml`
4. 在 Environment 中添加所有 `.env.example` 中的密钥
5. 部署完成后将 URL 填入本文档顶部

## LLM Prompt 设计（强制 JSON 输出）

以下代码位于 `server/services/llmService.js`，通过 **System Prompt 约束字段** + **OpenAI `response_format: json_object`** 双重保障，确保 LLM 返回合法 JSON：

```javascript
const ANALYSIS_PROMPT = `You are a professional stock market analyst. Analyze the provided stock market data and return your assessment.

Rules:
1. Respond ONLY with valid JSON — no markdown, no code fences, no extra text.
2. Use exactly these three keys: "summary", "sentiment", "risk_level".
3. "summary": 2-4 sentences covering price trend, valuation context, and a brief outlook.
4. "sentiment": must be exactly one of: "Bullish", "Neutral", "Bearish".
5. "risk_level": must be exactly one of: "Low", "Medium", "High".

Example output:
{"summary":"Apple shows moderate upward momentum...","sentiment":"Bullish","risk_level":"Medium"}`;

// API 调用时强制 JSON 模式
body: JSON.stringify({
  model: "gpt-4o-mini",
  response_format: { type: "json_object" },  // ← 强制 JSON
  messages: [
    { role: "system", content: ANALYSIS_PROMPT },
    { role: "user", content: userMessage },
  ],
})
```

后端还会对返回结果做 schema 校验（`validateAnalysis`），确保 `sentiment` 和 `risk_level` 枚举值合法。

### 期望的 JSON 格式

```json
{
  "summary": "2-4 句分析摘要",
  "sentiment": "Bullish | Neutral | Bearish",
  "risk_level": "Low | Medium | High"
}
```

## Debug 记录：CORS 跨域问题

### 问题描述

本地开发时，前端运行在 `http://localhost:5173`，后端在 `http://localhost:3001`。直接在 React 中调用 `fetch('http://localhost:3001/api/stock/AAPL')` 时，浏览器控制台报错：

```
Access to fetch at 'http://localhost:3001/api/stock/AAPL' from origin 'http://localhost:5173'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present.
```

### 排查过程（使用 Cursor AI）

1. 将报错信息粘贴给 Cursor，AI 指出这是典型的 CORS 跨域问题
2. AI 建议两种方案：
   - **方案 A**：后端添加 `cors` 中间件（适合生产环境前后端同域部署）
   - **方案 B**：Vite dev server 配置 proxy 代理（适合本地开发，避免跨域）

### 最终修复

**后端**（`server/index.js`）添加 cors 中间件：

```javascript
const cors = require("cors");
app.use(cors());
```

**前端**（`client/vite.config.js`）配置开发代理：

```javascript
server: {
  proxy: {
    "/api": { target: "http://localhost:3001", changeOrigin: true },
  },
},
```

前端 API 请求统一使用相对路径 `/api/...`，开发环境走 Vite 代理，生产环境由 Express 同域服务，彻底消除 CORS 问题。

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/stock/:symbol` | 获取股票行情 |
| POST | `/api/analyze` | AI 分析并存储 `{ "symbol": "AAPL" }` |
| GET | `/api/history` | 获取历史分析记录 |

## 项目结构

```
project1/
├── client/                 # React 前端
│   └── src/
│       ├── components/     # UI 组件
│       ├── api.js          # API 调用封装
│       └── App.jsx
├── server/                 # Express 后端
│   ├── routes/api.js
│   └── services/
│       ├── stockService.js   # Finnhub 数据
│       ├── llmService.js     # OpenAI 分析
│       └── supabaseClient.js # Supabase 存储
├── supabase/schema.sql     # 数据库建表 SQL
├── render.yaml             # Render 部署配置
└── README.md
```

## License

MIT

# AI 股票分析台 · 参考手册

## 环境变量（`.env.example`）

| 变量 | 用途 |
|------|------|
| `FINNHUB_API_KEY` | 行情与 K 线（主） |
| `OPENAI_API_KEY` | GPT 分析 |
| `OPENAI_MODEL` | 默认 `gpt-4o-mini` |
| `OPENAI_BASE_URL` | 可选，兼容 OpenAI API 的代理 |
| `HTTPS_PROXY` | 可选，Node 访问 OpenAI 超时时代理 |
| `SUPABASE_URL` | 数据库 |
| `SUPABASE_ANON_KEY` | 数据库 anon key |
| `PORT` | 默认 3001 |
| `NODE_ENV` | `development` / `production` |
| `ML_SERVICE_URL` | 本地 FastAPI，默认 `http://127.0.0.1:8000` |
| `ML_AUTO_START` | 设为 `false` 可关闭本地自动起 ML |

## npm 脚本

| 命令 | 说明 |
|------|------|
| `npm run install:all` | 根目录 + client 依赖 |
| `npm run dev` | API + Vite 并发 |
| `npm run dev:server` | 仅 Express（watch） |
| `npm run dev:client` | 仅 Vite |
| `npm run dev:ml` | 仅 Python FastAPI |
| `npm run build` | 构建前端 dist |
| `npm start` | 生产启动 |
| `npm run smoke:test` | 接口冒烟测试 |
| `npm run verify:security` | 密钥安全检查 |
| `npm run check:env` | env 占位符检查 |

## 前端数据流

1. `StockInput` 触发 `handleFetch` / `handlePredict` / `handleAnalyze`
2. `api.js` → `/api/*`
3. `App.jsx` `setState` → 子组件 props 更新
4. `pipelineStep`：`data` → `ml` → `llm` → `store`

## Recharts 数据格式（StockChart）

`buildChartSeries(historical, predicted)` 产出：

```js
{ date, actual, forecast, isPredicted, trend?, momentum? }
```

- `Area` → `dataKey="actual"`
- `Line` → `dataKey="forecast"`（虚线）

## POST /api/analyze 链路

```
routes/api.js
  → fetchStockData(symbol)           // stockService
  → analyzeStock(stockData, mlPred)  // llmService
  → saveAnalysis({...})              // supabaseClient
  → res.json({ stockData, analysis, saved })
```

## 仓库与演示

- GitHub：`getupgogogo999/ai_stock_analysis_dashboard`
- Render：`ai-stock-analysis-dashboard-qnfc.onrender.com`（以实际部署为准）
- 演示建议：AAPL → 行情 → ML → AI 分析 → 历史

## Cursor Skill 安装方式

**项目内（已在本仓库）**

```
.cursor/skills/ai-stock-dashboard/SKILL.md
```

克隆仓库后，在 Cursor 中打开本项目即可作为 **Project Skill** 使用。

**复制到个人技能目录（所有项目可用）**

```bash
# Windows 示例
xcopy /E /I ".cursor\skills\ai-stock-dashboard" "%USERPROFILE%\.cursor\skills\ai-stock-dashboard"
```

在对话中 @ 提及 `ai-stock-dashboard` 或描述「AI 股票分析台项目」时 Agent 应加载本 Skill。

---
name: ai-stock-dashboard
description: >-
  维护与扩展 AI 股票分析台全栈项目（React/Vite/Recharts + Node/Express BFF + OpenAI + Supabase）。
  在用户修改行情/ML/GPT/部署、排查 API 错误、写面试材料、或询问本项目架构与代码位置时使用。
---

# AI 股票分析台 · 项目 Skill

## 产品一句话

用户输入美股代码，完成 **行情 → ML 预测 → GPT 分析 → Supabase 历史** 四步 Pipeline。线上 Render 可 demo。

## 架构（面试/改代码前先对齐）

**名称**：前后端分离 + **BFF 代理**

```
React 前端 (client/)     只请求 /api
    ↓
Express BFF (server/)    密钥、聚合、降级
    ↓
Finnhub/Yahoo · OpenAI · Supabase · ML(Cloud/PyTorch)
```

| 环境 | 前端 | 后端 | 连 API 方式 |
|------|------|------|-------------|
| 开发 | Vite `:5173` | Express `:3001` | `client/vite.config.js` proxy `/api` |
| 生产 | `client/dist` 静态文件 | 同一 Express | 同域，无 CORS |

**禁止**：在前端或 Git 中硬编码 API Key；不要用 `VITE_*_KEY` 暴露密钥。

## 关键文件地图

| 路径 | 职责 |
|------|------|
| `client/src/App.jsx` | 全局 state、三个按钮 handler、Pipeline 步骤 |
| `client/src/api.js` | 唯一前端 HTTP 层，统一 `{ success, data, error }` |
| `client/src/components/StockChart.jsx` | Recharts：历史 Area + 预测 Line |
| `server/index.js` | Express 入口、生产静态托管、全局 500 |
| `server/routes/api.js` | 7 个 REST 路由 |
| `server/services/stockService.js` | Finnhub + Yahoo K 线降级 |
| `server/services/llmService.js` | GPT Prompt、json_object、中文重试 |
| `server/services/mlService.js` | PyTorch 优先，失败 Cloud Ensemble |
| `server/services/forecastService.js` | 线上 Node ML 融合算法 |
| `server/services/supabaseClient.js` | 分析历史读写 |
| `server/config/env.js` | `process.env` 读密钥 |
| `server/mlProcess.js` | 本地 dev 自动拉起 FastAPI |
| `.env.example` | 可提交的 env 模板 |

## REST API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 存活检查 |
| GET | `/api/stock/:symbol` | 实时行情 |
| GET | `/api/stock/:symbol/chart?range=1m\|3m\|6m\|1y` | K 线 |
| GET | `/api/stock/:symbol/predict?horizon=10` | ML 预测 |
| POST | `/api/analyze` | body: `{ symbol, mlPrediction? }` → GPT + 存库 |
| GET | `/api/history` | 历史列表 |
| GET | `/api/ml/health` | ML 引擎状态 |

成功响应：`{ success: true, data: ... }`  
失败响应：`{ success: false, error: "..." }`

## LLM 约定（改 GPT 相关必读）

- 模型默认 `gpt-4o-mini`，`response_format: { type: "json_object" }`
- 输出字段：`summary`（简体中文 2–4 句）、`sentiment`（Bullish/Neutral/Bearish）、`risk_level`（Low/Medium/High）
- `validateAnalysis()` 白名单校验；`isSummaryChinese()` 不通过则自动重试一轮
- 前端 `AnalysisResult.jsx` 将英文 enum 映射为中文展示

## ML 约定

- **线上 Render**：无 Python，走 `runCloudEnsemble()`（趋势 EMA + 动量线性回归 50/50）
- **本地**：`ML_SERVICE_URL` 指向 FastAPI `ml/`，失败 fallback Cloud Ensemble
- 面试表述：链路工程 demo，**不要**说成训练了生产级量化模型

## 安全与部署

```bash
npm run check:env          # .env 是否填好
npm run verify:security    # 扫硬编码密钥、gitignore
npm run build              # 打包 client/dist
npm start                  # 生产：node server/index.js
npm run dev                # 并发 API + Vite
```

Render：`render.yaml` → `buildCommand` + `startCommand`，密钥在 Dashboard Environment（5 个：`FINNHUB_API_KEY`、`OPENAI_API_KEY`、`SUPABASE_URL`、`SUPABASE_ANON_KEY` 等）。

## 常见改动指南

### 改 UI 文案/样式
- 组件：`client/src/components/`
- 全局样式：`client/src/index.css`
- 产品名：**AI 股票分析台**

### 新增 API
1. `server/services/` 写业务
2. `server/routes/api.js` 注册路由
3. `client/src/api.js` 加封装
4. `App.jsx` 接 state 与 UI

### Finnhub 失败
- K 线已在 `fetchStockCandles` 对 403/无数据降级 Yahoo
- 勿移除 fallback，否则 demo 易断

### Supabase 401 / insert 失败
- 检查项目是否 Pause（需 Resume）
- 检查 RLS / GRANT（见仓库 SQL 脚本若存在）

### OpenAI 本地超时
- `.env` 可设 `HTTPS_PROXY=http://127.0.0.1:7890`

## 代码原则

1. **最小 diff**：只改与任务相关的文件
2. **匹配现有风格**：CommonJS 后端、`import` 前端、中文 UI
3. **密钥永不进 client 与 Git**
4. **不擅自 commit**，除非用户明确要求

## 面试速答（用户要写稿时可引用）

| 话题 | 一句 |
|------|------|
| 架构 | 前后端分离 + BFF，Express 同域托管 |
| REST | HTTP + URL 资源，GET 查 POST 提交，JSON 通信 |
| BFF 价值 | 藏密钥、聚合 API、降级兜底 |
| Agent 关系 | 固定四步 Pipeline，可扩展为多 tool Agent |

## 延伸阅读

- 详细 API 与环境变量：[reference.md](reference.md)

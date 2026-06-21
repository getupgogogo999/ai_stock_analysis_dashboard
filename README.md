# AI 股票分析台

> 全栈 AI 应用：实时行情 → ML 双模型融合预测 → GPT 结构化分析 → Supabase 持久化存储。

## 在线访问

**Render 部署地址：** https://ai-stock-analysis-dashboard-qnfc.onrender.com/

---

## 功能概览

| 功能 | 说明 |
|------|------|
| 实时行情 | 输入美股代码（如 AAPL），通过 Finnhub 获取报价与指标 |
| K 线图表 | 支持 1 月 / 3 月 / 6 月 / 1 年，历史走势 + ML 预测虚线 |
| ML 预测 | 趋势模型 + 动量模型 50/50 融合，预测未来 10 个交易日 |
| AI 分析 | 调用 OpenAI GPT-4o-mini，返回 summary / sentiment / risk_level |
| 数据存储 | 分析结果写入 Supabase `stock_analyses` 表 |
| 历史记录 | 页面底部展示最近分析记录 |

**ML 说明：**

- **Render 线上**：内置 Cloud Ensemble，打开网站即可使用 ML 预测，无需本地服务
- **本地开发**：可选启动 `ml/` 目录下的 FastAPI 服务（后端会自动拉起），或使用 Cloud Ensemble 兜底

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React + Vite + Recharts |
| 后端 | Node.js + Express（BFF 代理） |
| 行情数据 | Finnhub API（K 线失败时降级 Yahoo Finance） |
| LLM | OpenAI API（`response_format: json_object`） |
| ML | Cloud Ensemble（线上）/ 可选 FastAPI 服务（本地） |
| 数据库 | Supabase（PostgreSQL） |
| 部署 | GitHub + Render.com |

---

## 安全说明（API 密钥保护）

**所有 API 密钥只放在 `.env` 或 Render Environment 中，绝不在代码里硬编码，也不会上传到 GitHub。**

| 规则 | 说明 |
|------|------|
| `.env` | 存放真实密钥，已被 `.gitignore` 忽略 |
| `.env.example` | 仅含占位符，可安全提交 |
| 前端 | 不包含任何 API Key，只调用 `/api` |
| 后端 | 通过 `process.env` 读取密钥 |
| Render | 在 Dashboard → Environment 中配置密钥 |

推送前检查：

```bash
npm run verify:security
git status   # 确认 .env 不在待提交列表
```

---

## 本地开发

### 1. 安装依赖

```bash
npm run install:all
```

### 2. 配置环境变量

```bash
copy .env.example .env    # Windows
# 编辑 .env 填入真实密钥
npm run check:env
```

| 变量 | 获取方式 |
|------|----------|
| `FINNHUB_API_KEY` | [finnhub.io/register](https://finnhub.io/register) |
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `SUPABASE_URL` | [supabase.com](https://supabase.com) 项目 Settings → API |
| `SUPABASE_ANON_KEY` | 同上 |

### 3. 初始化 Supabase

在 Supabase SQL Editor 中执行 `supabase/schema.sql`。  
若 API 返回 401，再执行 `supabase/fix-permissions.sql`。

### 4. 启动（一键）

```bash
npm run dev
# 或 Windows 双击 start-dev.bat
```

**演示顺序：** 获取行情 → ML 预测 → AI 分析

### 5. 可选：本地 ML 服务依赖

```bash
npm run setup:ml
```

---

## 部署到 Render

1. 将代码推送到 GitHub
2. 在 [Render Dashboard](https://dashboard.render.com) 创建 Web Service
3. 连接 GitHub 仓库，Render 读取 `render.yaml`
4. 在 Environment 中配置 Finnhub / OpenAI / Supabase 密钥
5. 部署完成后访问线上 URL

---

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/ml/health` | ML 服务状态 |
| GET | `/api/stock/:symbol` | 获取股票行情 |
| GET | `/api/stock/:symbol/chart?range=3m` | K 线数据（1m/3m/6m/1y） |
| GET | `/api/stock/:symbol/predict?horizon=10` | ML 融合预测 |
| POST | `/api/analyze` | AI 分析并存储 `{ "symbol": "AAPL" }` |
| GET | `/api/history` | 历史分析记录 |

---

## LLM Prompt 设计

位于 `server/services/llmService.js`，通过 **System Prompt** + **`response_format: json_object`** 强制 JSON 输出，后端 `validateAnalysis` 校验字段合法性。

期望格式：

```json
{
  "summary": "2-4 句分析摘要",
  "sentiment": "Bullish | Neutral | Bearish",
  "risk_level": "Low | Medium | High"
}
```

---

## ML 融合预测

- **趋势模型（Trend）**：EMA + 斜率，捕捉中长期走势
- **动量模型（Momentum）**：线性回归，捕捉短期动量
- **融合方式**：50/50 加权平均，输出未来 10 日预测曲线

实现位置：

- 线上：`server/services/forecastService.js`（Cloud Ensemble）
- 本地可选：`ml/ensemble.py`（FastAPI）

---

## 项目结构

```
project1/
├── client/                      # React 前端
│   └── src/components/          # UI 组件
├── server/                      # Express 后端
│   ├── routes/api.js
│   ├── services/
│   │   ├── stockService.js      # Finnhub / Yahoo 行情
│   │   ├── llmService.js        # OpenAI 分析
│   │   ├── mlService.js         # ML 预测调度
│   │   ├── forecastService.js   # Cloud Ensemble
│   │   └── supabaseClient.js    # Supabase 存储
│   └── mlProcess.js             # 本地 ML 自动启动
├── ml/                          # 可选 FastAPI ML 服务
├── supabase/schema.sql
├── scripts/                     # 检查与安全脚本
├── render.yaml
└── README.md
```

---

## 常见问题

| 问题 | 处理 |
|------|------|
| Supabase 写入失败 | Dashboard 中 Resume project，或执行 fix-permissions.sql |
| ML 预测报错 | 线上应自动可用；本地检查 `npm run dev` 是否正常 |
| OpenAI 超时 | 本地 `.env` 配置 `HTTPS_PROXY` |
| Finnhub K 线 403 | 自动降级 Yahoo Finance |

---

## License

MIT

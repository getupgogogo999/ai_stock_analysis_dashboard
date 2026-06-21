# ML 预测服务（可选，本地开发）

FastAPI 双模型融合预测服务，本地开发时由 Node 后端自动启动。

## 安装

```bash
cd ml
pip install -r requirements.txt
# 或项目根目录：npm run setup:ml
```

## 启动

```bash
npm run dev:ml
# 或由 npm run dev 时后端自动拉起（:8000）
```

## 模型说明

- **LSTM**：趋势捕捉
- **GRU**：动量捕捉
- **融合**：0.5 × LSTM + 0.5 × GRU

> Render 线上使用 Node 内置 Cloud Ensemble，无需部署本服务。

## 接口

- `GET /health`
- `POST /predict` — `{ symbol, points: [{date, close}], horizon: 10 }`

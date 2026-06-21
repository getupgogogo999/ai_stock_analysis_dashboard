# PyTorch ML 服务（面试演示）

## 安装（首次）

```bash
cd ml
pip install -r requirements.txt
```

## 启动

```bash
# 项目根目录
npm run dev:ml
```

或 Windows 一键三端：`start-dev.bat`

## 架构

- **LSTM**：捕捉较长周期趋势
- **GRU**：捕捉短期动量
- **Fusion**：0.5 × LSTM + 0.5 × GRU（Model Stitching / Ensemble）

Node 后端 `GET /api/stock/:symbol/predict` 调用本服务，前端展示虚线预测 K 线。

## 接口

- `GET /health`
- `POST /predict` — body: `{ symbol, points: [{date, close}], horizon: 10 }`

首次预测约 15–30 秒（CPU 快速训练）。

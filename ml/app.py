"""
PyTorch ML 推理服务 — LSTM + GRU 模型融合预测 K 线
启动: uvicorn app:app --host 127.0.0.1 --port 8000
"""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from ensemble import run_ensemble_forecast

app = FastAPI(title="Stock ML Predictor", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChartPoint(BaseModel):
    date: str
    close: float
    open: float | None = None
    high: float | None = None
    low: float | None = None


class PredictRequest(BaseModel):
    symbol: str
    points: list[ChartPoint]
    horizon: int = Field(default=10, ge=5, le=20)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "pytorch-ensemble"}


@app.post("/predict")
def predict(body: PredictRequest) -> dict[str, Any]:
    if not body.points:
        raise HTTPException(status_code=400, detail="points array is required")

    closes = [p.close for p in body.points if p.close is not None]
    dates = [p.date for p in body.points if p.close is not None]

    if len(closes) < 30:
        raise HTTPException(status_code=400, detail="Need at least 30 valid close prices")

    try:
        result = run_ensemble_forecast(closes, dates, horizon=body.horizon)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return {
        "symbol": body.symbol.strip().upper(),
        **result,
    }

"""
LSTM + GRU 双模型融合预测（Model Stitching / Ensemble）
- LSTM：捕捉较长周期趋势
- GRU：捕捉短期动量
- 融合：加权平均 (0.5 / 0.5)
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

import numpy as np
import torch
import torch.nn as nn


class LSTMForecaster(nn.Module):
    def __init__(self, hidden: int = 32, layers: int = 2):
        super().__init__()
        self.lstm = nn.LSTM(1, hidden, layers, batch_first=True)
        self.head = nn.Linear(hidden, 1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        out, _ = self.lstm(x)
        return self.head(out[:, -1, :])


class GRUForecaster(nn.Module):
    def __init__(self, hidden: int = 32, layers: int = 2):
        super().__init__()
        self.gru = nn.GRU(1, hidden, layers, batch_first=True)
        self.head = nn.Linear(hidden, 1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        out, _ = self.gru(x)
        return self.head(out[:, -1, :])


def _build_sequences(values: np.ndarray, seq_len: int) -> tuple[np.ndarray, np.ndarray]:
    xs, ys = [], []
    for i in range(len(values) - seq_len):
        xs.append(values[i : i + seq_len])
        ys.append(values[i + seq_len])
    return np.array(xs), np.array(ys)


def _train_one_step(model: nn.Module, X: torch.Tensor, y: torch.Tensor, epochs: int = 28) -> None:
    model.train()
    opt = torch.optim.Adam(model.parameters(), lr=0.003)
    loss_fn = nn.MSELoss()
    for _ in range(epochs):
        opt.zero_grad()
        pred = model(X)
        loss = loss_fn(pred.squeeze(), y)
        loss.backward()
        opt.step()


def _predict_next(model: nn.Module, window: np.ndarray) -> float:
    model.eval()
    with torch.no_grad():
        t = torch.tensor(window.reshape(1, -1, 1), dtype=torch.float32)
        return float(model(t).item())


def run_ensemble_forecast(
    closes: list[float],
    dates: list[str],
    horizon: int = 10,
    seq_len: int = 20,
) -> dict[str, Any]:
    if len(closes) < seq_len + 10:
        raise ValueError(f"Need at least {seq_len + 10} data points, got {len(closes)}")

    arr = np.array(closes[-120:], dtype=np.float32)
    vmin, vmax = float(arr.min()), float(arr.max())
    span = max(vmax - vmin, 1e-6)
    norm = (arr - vmin) / span

    X_np, y_np = _build_sequences(norm, seq_len)
    X = torch.tensor(X_np.reshape(-1, seq_len, 1), dtype=torch.float32)
    y = torch.tensor(y_np, dtype=torch.float32)

    lstm = LSTMForecaster()
    gru = GRUForecaster()
    _train_one_step(lstm, X, y, epochs=28)
    _train_one_step(gru, X, y, epochs=28)

    window = norm[-seq_len:].copy()
    last_date = datetime.strptime(dates[-1], "%Y-%m-%d")
    last_close = float(closes[-1])

    predicted: list[dict[str, Any]] = []
    lstm_preds: list[float] = []
    gru_preds: list[float] = []

    for step in range(horizon):
        lstm_n = _predict_next(lstm, window)
        gru_n = _predict_next(gru, window)
        fused_n = 0.5 * lstm_n + 0.5 * gru_n

        fused_price = float(fused_n * span + vmin)
        lstm_price = float(lstm_n * span + vmin)
        gru_price = float(gru_n * span + vmin)

        next_date = last_date + timedelta(days=step + 1)
        while next_date.weekday() >= 5:
            next_date += timedelta(days=1)

        predicted.append(
            {
                "date": next_date.strftime("%Y-%m-%d"),
                "close": round(fused_price, 2),
                "predicted": True,
                "lstm": round(lstm_price, 2),
                "gru": round(gru_price, 2),
            }
        )
        lstm_preds.append(lstm_price)
        gru_preds.append(gru_price)

        window = np.append(window[1:], fused_n)

    final_pred = predicted[-1]["close"]
    change_pct = ((final_pred - last_close) / last_close) * 100 if last_close else 0.0
    direction = "up" if change_pct >= 0 else "down"

    diffs = [abs(a - b) for a, b in zip(lstm_preds, gru_preds)]
    avg_price = max((last_close + final_pred) / 2, 1e-6)
    agreement = 1.0 - min(sum(diffs) / (len(diffs) * avg_price), 1.0)
    confidence = round(max(0.55, min(0.92, 0.55 + agreement * 0.35)), 2)

    return {
        "horizon": horizon,
        "models": ["LSTM", "GRU"],
        "fusion": "weighted_average_0.5_0.5",
        "framework": "PyTorch",
        "metrics": {
            "direction": direction,
            "expectedChangePercent": round(change_pct, 2),
            "confidence": confidence,
            "lastClose": round(last_close, 2),
            "predictedClose": round(final_pred, 2),
        },
        "predicted": predicted,
    }

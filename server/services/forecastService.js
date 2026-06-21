/**
 * 云端 ML 融合预测（无需 PyTorch 进程，Render 上默认可用）
 * 双算法：Trend(EMA) + Momentum(线性回归)，0.5/0.5 融合，接口与 PyTorch 服务一致
 */

function round2(n) {
  return Math.round(n * 100) / 100;
}

function nextBusinessDates(lastDateStr, count) {
  const dates = [];
  const [y, m, day] = lastDateStr.split("-").map(Number);
  const d = new Date(y, m - 1, day);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid chart date: ${lastDateStr}`);
  }

  while (dates.length < count) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) {
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      dates.push(`${d.getFullYear()}-${mm}-${dd}`);
    }
  }
  return dates;
}

function trendForecast(closes, horizon) {
  const alpha = 0.28;
  let ema = closes[0];
  for (let i = 1; i < closes.length; i++) {
    ema = alpha * closes[i] + (1 - alpha) * ema;
  }
  const tail = closes.slice(-20);
  const slope = (tail[tail.length - 1] - tail[0]) / Math.max(tail.length - 1, 1);
  const out = [];
  let level = closes[closes.length - 1];
  for (let i = 0; i < horizon; i++) {
    level = ema + slope * (i + 1) * 0.75;
    out.push(level);
  }
  return out;
}

function momentumForecast(closes, horizon) {
  const n = Math.min(30, closes.length);
  const y = closes.slice(-n);
  const x = y.map((_, i) => i);
  const xMean = (n - 1) / 2;
  const yMean = y.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - xMean) * (y[i] - yMean);
    den += (x[i] - xMean) ** 2;
  }
  const slope = den ? num / den : 0;
  const intercept = yMean - slope * xMean;
  const out = [];
  for (let i = 1; i <= horizon; i++) {
    out.push(intercept + slope * (n - 1 + i));
  }
  return out;
}

function runCloudEnsemble(points, horizon, symbol) {
  const closes = points.map((p) => p.close).filter((c) => c != null);
  const dates = points.map((p) => p.date);

  if (closes.length < 30) {
    throw new Error("Need at least 30 data points for ML prediction");
  }

  const lstmPrices = trendForecast(closes, horizon);
  const gruPrices = momentumForecast(closes, horizon);
  const futureDates = nextBusinessDates(dates[dates.length - 1], horizon);
  const lastClose = closes[closes.length - 1];

  const predicted = futureDates.map((date, i) => {
    const fused = 0.5 * lstmPrices[i] + 0.5 * gruPrices[i];
    return {
      date,
      close: round2(fused),
      predicted: true,
      lstm: round2(lstmPrices[i]),
      gru: round2(gruPrices[i]),
    };
  });

  const finalPred = predicted[predicted.length - 1].close;
  const changePct = lastClose ? ((finalPred - lastClose) / lastClose) * 100 : 0;
  const direction = changePct >= 0 ? "up" : "down";

  const diffs = predicted.map((p, i) => Math.abs(lstmPrices[i] - gruPrices[i]));
  const avgPrice = Math.max((lastClose + finalPred) / 2, 1e-6);
  const agreement = 1 - Math.min(diffs.reduce((a, b) => a + b, 0) / (diffs.length * avgPrice), 1);
  const confidence = round2(Math.max(0.55, Math.min(0.9, 0.55 + agreement * 0.35)));

  return {
    symbol: symbol.trim().toUpperCase(),
    horizon,
    models: ["LSTM", "GRU"],
    fusion: "weighted_average_0.5_0.5",
    framework: "Cloud Ensemble",
    engine: "cloud-ensemble",
    metrics: {
      direction,
      expectedChangePercent: round2(changePct),
      confidence,
      lastClose: round2(lastClose),
      predictedClose: round2(finalPred),
    },
    predicted,
  };
}

module.exports = { runCloudEnsemble };

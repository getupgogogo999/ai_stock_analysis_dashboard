const { getOptional } = require("../config/env");
const { fetchStockCandles } = require("./stockService");

const ML_TIMEOUT_MS = 90000;

async function fetchMlPrediction(symbol, horizon = 10) {
  const mlUrl = getOptional("ML_SERVICE_URL", "http://127.0.0.1:8000").replace(/\/$/, "");
  const chart = await fetchStockCandles(symbol, "3m");

  if (!chart.points?.length) {
    throw new Error("No chart data available for ML prediction");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);

  try {
    const res = await fetch(`${mlUrl}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol: chart.symbol,
        points: chart.points,
        horizon,
      }),
      signal: controller.signal,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || data.error || `ML service error (${res.status})`);
    }

    return {
      ...data,
      historicalPoints: chart.points,
    };
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("ML prediction timed out. First run may take ~30s while PyTorch trains.");
    }
    if (err.cause?.code === "ECONNREFUSED" || err.message.includes("fetch failed")) {
      throw new Error(
        "PyTorch ML 服务未启动。请先运行: npm run dev:ml （另开一个终端）"
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function checkMlHealth() {
  const mlUrl = getOptional("ML_SERVICE_URL", "http://127.0.0.1:8000").replace(/\/$/, "");
  try {
    const res = await fetch(`${mlUrl}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

module.exports = { fetchMlPrediction, checkMlHealth };

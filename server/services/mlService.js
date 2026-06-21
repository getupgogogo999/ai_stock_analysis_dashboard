const { getOptional } = require("../config/env");
const { fetchStockCandles } = require("./stockService");
const { runCloudEnsemble } = require("./forecastService");

const ML_TIMEOUT_MS = 90000;
const isProd = process.env.NODE_ENV === "production";

function normalizeMlUrl(raw) {
  const url = (raw || "").trim().replace(/\/$/, "");
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

function getMlServiceUrl() {
  const configured = normalizeMlUrl(getOptional("ML_SERVICE_URL", ""));
  if (configured) return configured;
  if (!isProd) return "http://127.0.0.1:8000";
  return "";
}

async function callPyTorchService(mlUrl, chart, horizon) {
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
      engine: "pytorch",
      framework: data.framework || "PyTorch",
    };
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("PyTorch prediction timed out");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchMlPrediction(symbol, horizon = 10) {
  const chart = await fetchStockCandles(symbol, "3m");

  if (!chart.points?.length) {
    throw new Error("No chart data available for ML prediction");
  }

  const mlUrl = getMlServiceUrl();

  if (mlUrl) {
    try {
      const pytorch = await callPyTorchService(mlUrl, chart, horizon);
      return { ...pytorch, historicalPoints: chart.points };
    } catch (err) {
      console.warn("[ML] PyTorch service unavailable:", err.message);
      if (!isProd) {
        console.warn("[ML] Falling back to cloud ensemble");
      }
    }
  }

  const ensemble = runCloudEnsemble(chart.points, horizon, chart.symbol);
  return { ...ensemble, historicalPoints: chart.points };
}

async function checkPyTorchHealth() {
  const mlUrl = getMlServiceUrl();
  if (!mlUrl) return false;
  try {
    const res = await fetch(`${mlUrl}/health`, { signal: AbortSignal.timeout(4000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function checkMlHealth() {
  const pytorchOnline = await checkPyTorchHealth();
  return {
    online: isProd || pytorchOnline,
    pytorchOnline,
    cloudEnsemble: true,
    engine: pytorchOnline ? "pytorch" : "cloud-ensemble",
    framework: pytorchOnline
      ? "PyTorch LSTM+GRU Ensemble"
      : "Cloud Ensemble (always available online)",
  };
}

module.exports = { fetchMlPrediction, checkMlHealth, checkPyTorchHealth };

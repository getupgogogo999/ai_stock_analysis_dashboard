const API_BASE = import.meta.env.PROD ? "" : "";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data.data;
}

export function fetchStockChart(symbol, range = "3m") {
  return request(
    `/api/stock/${encodeURIComponent(symbol)}/chart?range=${encodeURIComponent(range)}`
  );
}

export function fetchStock(symbol) {
  return request(`/api/stock/${encodeURIComponent(symbol)}`);
}

export function fetchMlPrediction(symbol, horizon = 10) {
  return request(
    `/api/stock/${encodeURIComponent(symbol)}/predict?horizon=${horizon}`
  );
}

export function fetchMlHealth() {
  return request("/api/ml/health");
}

export function analyzeStock(symbol, mlPrediction = null) {
  return request("/api/analyze", {
    method: "POST",
    body: JSON.stringify({ symbol, mlPrediction }),
  });
}

export function fetchHistory() {
  return request("/api/history");
}

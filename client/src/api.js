const API_BASE = import.meta.env.PROD ? "" : "";

// 安全：前端不持有任何 API Key，所有请求走后端 /api 代理

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

export function analyzeStock(symbol) {
  return request("/api/analyze", {
    method: "POST",
    body: JSON.stringify({ symbol }),
  });
}

export function fetchHistory() {
  return request("/api/history");
}

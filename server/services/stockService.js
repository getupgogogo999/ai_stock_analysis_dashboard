const { getRequired } = require("../config/env");
const { getFetch } = require("../utils/fetchWithProxy");
const FINNHUB_BASE = "https://finnhub.io/api/v1";

async function fetchStockData(symbol) {
  const apiKey = getRequired("FINNHUB_API_KEY");

  const normalized = symbol.trim().toUpperCase();
  const headers = { Accept: "application/json" };

  const [quoteRes, profileRes, metricsRes] = await Promise.all([
    fetch(`${FINNHUB_BASE}/quote?symbol=${normalized}&token=${apiKey}`, { headers }),
    fetch(`${FINNHUB_BASE}/stock/profile2?symbol=${normalized}&token=${apiKey}`, { headers }),
    fetch(`${FINNHUB_BASE}/stock/metric?symbol=${normalized}&metric=all&token=${apiKey}`, { headers }),
  ]);

  if (!quoteRes.ok) {
    throw new Error(`Finnhub quote API error: ${quoteRes.status}`);
  }

  const quote = await quoteRes.json();
  const profile = profileRes.ok ? await profileRes.json() : {};
  const metrics = metricsRes.ok ? await metricsRes.json() : {};

  if (!quote || quote.c === 0 && quote.h === 0 && quote.l === 0) {
    throw new Error(`No market data found for symbol "${normalized}"`);
  }

  const change = quote.c - quote.pc;
  const changePercent = quote.pc ? ((change / quote.pc) * 100).toFixed(2) : "0.00";

  return {
    symbol: normalized,
    name: profile.name || normalized,
    exchange: profile.exchange || "N/A",
    industry: profile.finnhubIndustry || "N/A",
    currentPrice: quote.c,
    previousClose: quote.pc,
    open: quote.o,
    high: quote.h,
    low: quote.l,
    change: Number(change.toFixed(2)),
    changePercent: `${changePercent}%`,
    marketCap: profile.marketCapitalization
      ? `${(profile.marketCapitalization / 1000).toFixed(2)}B`
      : "N/A",
    peRatio: metrics.metric?.peBasicExclExtraTTM ?? "N/A",
    week52High: metrics.metric?.["52WeekHigh"] ?? "N/A",
    week52Low: metrics.metric?.["52WeekLow"] ?? "N/A",
    fetchedAt: new Date().toISOString(),
  };
}

const RANGE_DAYS = { "1m": 30, "3m": 90, "6m": 180, "1y": 365 };
const YAHOO_RANGE = { "1m": "1mo", "3m": "3mo", "6m": "6mo", "1y": "1y" };

async function fetchFromYahoo(symbol, range) {
  const normalized = symbol.trim().toUpperCase();
  const yahooRange = YAHOO_RANGE[range] || YAHOO_RANGE["3m"];
  const apiFetch = getFetch();

  const res = await apiFetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${normalized}?interval=1d&range=${yahooRange}`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Chart data API error: ${res.status}`);
  }

  const json = await res.json();
  const result = json.chart?.result?.[0];
  const timestamps = result?.timestamp;
  const quotes = result?.indicators?.quote?.[0];

  if (!timestamps?.length || !quotes) {
    throw new Error(`No chart data available for "${normalized}"`);
  }

  const points = timestamps
    .map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().slice(0, 10),
      timestamp: ts,
      open: quotes.open[i],
      high: quotes.high[i],
      low: quotes.low[i],
      close: quotes.close[i],
    }))
    .filter((p) => p.close != null);

  return { symbol: normalized, range, points };
}

async function fetchFromFinnhub(symbol, range) {
  const apiKey = getRequired("FINNHUB_API_KEY");
  const normalized = symbol.trim().toUpperCase();
  const days = RANGE_DAYS[range] || RANGE_DAYS["3m"];

  const to = Math.floor(Date.now() / 1000);
  const from = to - days * 86400;

  const res = await fetch(
    `${FINNHUB_BASE}/stock/candle?symbol=${normalized}&resolution=D&from=${from}&to=${to}&token=${apiKey}`,
    { headers: { Accept: "application/json" } }
  );

  if (!res.ok) {
    throw new Error(`Finnhub chart API error: ${res.status}`);
  }

  const raw = await res.json();
  if (raw.s !== "ok" || !raw.t?.length) {
    throw new Error(`No chart data available for "${normalized}"`);
  }

  const points = raw.t.map((ts, i) => ({
    date: new Date(ts * 1000).toISOString().slice(0, 10),
    timestamp: ts,
    open: raw.o[i],
    high: raw.h[i],
    low: raw.l[i],
    close: raw.c[i],
  }));

  return { symbol: normalized, range, points };
}

async function fetchStockCandles(symbol, range = "3m") {
  try {
    return await fetchFromFinnhub(symbol, range);
  } catch (err) {
    const msg = String(err.message);
    if (msg.includes("403") || msg.includes("No chart")) {
      return fetchFromYahoo(symbol, range);
    }
    throw err;
  }
}

module.exports = { fetchStockData, fetchStockCandles };

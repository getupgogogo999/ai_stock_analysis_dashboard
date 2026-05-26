import { useState, useEffect, useCallback } from "react";
import { fetchStock, fetchStockChart, analyzeStock, fetchHistory } from "./api";
import StockInput from "./components/StockInput";
import StockDataCard from "./components/StockDataCard";
import StockChart from "./components/StockChart";
import AnalysisResult from "./components/AnalysisResult";
import HistoryList from "./components/HistoryList";

export default function App() {
  const [symbol, setSymbol] = useState("AAPL");
  const [stockData, setStockData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [chartRange, setChartRange] = useState("3m");
  const [analysis, setAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState({ fetch: false, analyze: false, chart: false });
  const [error, setError] = useState("");

  const loadChart = useCallback(async (sym, range) => {
    setLoading((s) => ({ ...s, chart: true }));
    try {
      const data = await fetchStockChart(sym, range);
      setChartData(data);
    } catch {
      setChartData(null);
    } finally {
      setLoading((s) => ({ ...s, chart: false }));
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const data = await fetchHistory();
      setHistory(data);
    } catch {
      /* history is optional when Supabase is not configured yet */
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function handleFetch() {
    setError("");
    setLoading((s) => ({ ...s, fetch: true }));
    try {
      const data = await fetchStock(symbol);
      setStockData(data);
      setAnalysis(null);
      await loadChart(symbol, chartRange);
    } catch (err) {
      setError(err.message);
      setStockData(null);
      setChartData(null);
    } finally {
      setLoading((s) => ({ ...s, fetch: false }));
    }
  }

  async function handleAnalyze() {
    setError("");
    setLoading((s) => ({ ...s, analyze: true }));
    try {
      const result = await analyzeStock(symbol);
      setStockData(result.stockData);
      setAnalysis(result.analysis);
      await loadChart(symbol, chartRange);
      await loadHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading((s) => ({ ...s, analyze: false }));
    }
  }

  async function handleRangeChange(range) {
    setChartRange(range);
    if (stockData?.symbol) {
      await loadChart(stockData.symbol, range);
    }
  }

  const isUp = (stockData?.change ?? 0) >= 0;

  return (
    <div className="app">
      <header className="header">
        <div className="header-badge">AI Powered</div>
        <h1>Stock Analysis Dashboard</h1>
        <p>输入股票代码，获取实时行情、走势图表并由 LLM 生成结构化分析</p>
      </header>

      <main className="main">
        <StockInput
          symbol={symbol}
          onSymbolChange={setSymbol}
          onFetch={handleFetch}
          onAnalyze={handleAnalyze}
          loading={loading}
          disabled={!symbol.trim()}
        />

        {error && <div className="error-banner">{error}</div>}

        {stockData && (
          <StockChart
            symbol={stockData.symbol}
            data={chartData}
            loading={loading.chart}
            range={chartRange}
            onRangeChange={handleRangeChange}
            isUp={isUp}
          />
        )}

        <div className="grid">
          {stockData && <StockDataCard data={stockData} />}
          {analysis && <AnalysisResult analysis={analysis} />}
        </div>

        {history.length > 0 && <HistoryList items={history} />}
      </main>
    </div>
  );
}

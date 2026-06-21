import { useState, useEffect, useCallback } from "react";
import {
  fetchStock,
  fetchStockChart,
  fetchMlPrediction,
  fetchMlHealth,
  analyzeStock,
  fetchHistory,
} from "./api";
import StockInput from "./components/StockInput";
import StockDataCard from "./components/StockDataCard";
import StockChart from "./components/StockChart";
import AnalysisResult from "./components/AnalysisResult";
import HistoryList from "./components/HistoryList";
import PipelineStrip from "./components/PipelineStrip";
import MLPredictionPanel from "./components/MLPredictionPanel";

export default function App() {
  const [symbol, setSymbol] = useState("AAPL");
  const [stockData, setStockData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [chartRange, setChartRange] = useState("3m");
  const [analysis, setAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [mlOnline, setMlOnline] = useState(false);
  const [pipelineStep, setPipelineStep] = useState("data");
  const [loading, setLoading] = useState({
    fetch: false,
    analyze: false,
    chart: false,
    predict: false,
  });
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
      /* optional */
    }
  }, []);

  const checkMl = useCallback(async () => {
    try {
      const data = await fetchMlHealth();
      setMlOnline(Boolean(data.online));
    } catch {
      setMlOnline(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
    checkMl();
    const timer = setInterval(checkMl, 15000);
    return () => clearInterval(timer);
  }, [loadHistory, checkMl]);

  async function handleFetch() {
    setError("");
    setPrediction(null);
    setAnalysis(null);
    setPipelineStep("data");
    setLoading((s) => ({ ...s, fetch: true }));
    try {
      const data = await fetchStock(symbol);
      setStockData(data);
      await loadChart(symbol, chartRange);
    } catch (err) {
      setError(err.message);
      setStockData(null);
      setChartData(null);
    } finally {
      setLoading((s) => ({ ...s, fetch: false }));
    }
  }

  async function handlePredict() {
    setError("");
    setLoading((s) => ({ ...s, predict: true }));
    setPipelineStep("ml");
    try {
      if (!stockData) {
        const data = await fetchStock(symbol);
        setStockData(data);
        await loadChart(symbol, chartRange);
      }
      const result = await fetchMlPrediction(symbol, 10);
      setPrediction(result);
      setMlOnline(true);
    } catch (err) {
      setError(err.message);
      setPrediction(null);
      checkMl();
    } finally {
      setLoading((s) => ({ ...s, predict: false }));
    }
  }

  async function handleAnalyze() {
    setError("");
    setLoading((s) => ({ ...s, analyze: true }));
    setPipelineStep("llm");
    try {
      const result = await analyzeStock(symbol, prediction);
      setStockData(result.stockData);
      setAnalysis(result.analysis);
      await loadChart(symbol, chartRange);
      await loadHistory();
      setPipelineStep("store");
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
    <div className="app-shell">
      <div className="bg-mesh" />
      <div className="bg-orbs" aria-hidden="true">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
        <span className="orb orb-3" />
      </div>

      <div className="app">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark">
              <span className="brand-glow" />
              AI
            </div>
            <div>
              <h1>
                AI <span className="gradient-text">股票分析台</span>
              </h1>
              <p>实时行情 · ML 融合预测 · GPT 智能分析</p>
            </div>
          </div>
          <div className="topbar-pills">
            <span className="pill pill-cyan">实时数据</span>
            <span className="pill pill-violet">ML 融合</span>
            <span className="pill pill-amber">GPT-4o-mini</span>
          </div>
        </header>

        <PipelineStrip activeStep={pipelineStep} mlOnline={mlOnline} />

        <main className="main">
          <StockInput
            symbol={symbol}
            onSymbolChange={setSymbol}
            onFetch={handleFetch}
            onPredict={handlePredict}
            onAnalyze={handleAnalyze}
            loading={loading}
            disabled={!symbol.trim()}
          />

          {error && <div className="error-banner">{error}</div>}

          {(stockData || loading.predict) && (
            <div className="dashboard-grid">
              <StockChart
                symbol={stockData?.symbol || symbol}
                data={chartData}
                prediction={prediction}
                loading={loading.chart}
                range={chartRange}
                onRangeChange={handleRangeChange}
                isUp={isUp}
              />
              <MLPredictionPanel prediction={prediction} loading={loading.predict} />
            </div>
          )}

          <div className="grid">
            {stockData && <StockDataCard data={stockData} />}
            {analysis && <AnalysisResult analysis={analysis} />}
          </div>

          {history.length > 0 && <HistoryList items={history} />}
        </main>
      </div>
    </div>
  );
}

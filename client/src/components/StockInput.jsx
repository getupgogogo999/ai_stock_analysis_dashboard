export default function StockInput({
  symbol,
  onSymbolChange,
  onFetch,
  onPredict,
  onAnalyze,
  loading,
  disabled,
}) {
  function handleSubmit(e) {
    e.preventDefault();
    onFetch();
  }

  const busy = loading.fetch || loading.analyze || loading.predict;

  return (
    <form className="glass-card stock-input premium-border" onSubmit={handleSubmit}>
      <div className="input-header">
        <label htmlFor="symbol">股票代码</label>
        <span className="input-chip">美股</span>
      </div>
      <div className="input-row">
        <input
          id="symbol"
          type="text"
          placeholder="AAPL · TSLA · MSFT · NVDA"
          value={symbol}
          onChange={(e) => onSymbolChange(e.target.value.toUpperCase())}
          disabled={busy}
        />
        <button type="submit" className="btn-ghost" disabled={disabled || busy}>
          {loading.fetch ? "加载中…" : "获取行情"}
        </button>
        <button
          type="button"
          className="btn-ml"
          onClick={onPredict}
          disabled={disabled || busy}
        >
          {loading.predict ? "预测中…" : "ML 预测"}
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={onAnalyze}
          disabled={disabled || busy}
        >
          {loading.analyze ? "分析中…" : "AI 分析"}
        </button>
      </div>
      <p className="hint">数据流：Finnhub → ML 双模型融合 → GPT-4o-mini → Supabase</p>
    </form>
  );
}

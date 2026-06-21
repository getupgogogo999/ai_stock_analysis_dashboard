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
        <label htmlFor="symbol">Ticker Symbol</label>
        <span className="input-chip">US Equities</span>
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
          {loading.fetch ? "Loading…" : "Get Quote"}
        </button>
        <button
          type="button"
          className="btn-ml"
          onClick={onPredict}
          disabled={disabled || busy}
        >
          {loading.predict ? "Forecasting…" : "ML Forecast"}
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={onAnalyze}
          disabled={disabled || busy}
        >
          {loading.analyze ? "Analyzing…" : "AI Analyze"}
        </button>
      </div>
      <p className="hint">Pipeline: Market Data → Dual-Model Fusion → GPT → Supabase</p>
    </form>
  );
}

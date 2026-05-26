export default function StockInput({
  symbol,
  onSymbolChange,
  onFetch,
  onAnalyze,
  loading,
  disabled,
}) {
  function handleSubmit(e) {
    e.preventDefault();
    onFetch();
  }

  return (
    <form className="stock-input" onSubmit={handleSubmit}>
      <label htmlFor="symbol">股票代码</label>
      <div className="input-row">
        <input
          id="symbol"
          type="text"
          placeholder="例如 AAPL, TSLA, MSFT"
          value={symbol}
          onChange={(e) => onSymbolChange(e.target.value.toUpperCase())}
          disabled={loading.fetch || loading.analyze}
        />
        <button type="submit" disabled={disabled || loading.fetch || loading.analyze}>
          {loading.fetch ? "获取中..." : "获取行情"}
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={onAnalyze}
          disabled={disabled || loading.fetch || loading.analyze}
        >
          {loading.analyze ? "分析中..." : "AI 分析"}
        </button>
      </div>
      <p className="hint">支持美股代码，如 Apple (AAPL)、Tesla (TSLA)</p>
    </form>
  );
}

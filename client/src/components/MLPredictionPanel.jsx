export default function MLPredictionPanel({ prediction, loading }) {
  if (loading) {
    return (
      <section className="glass-card ml-panel loading-panel">
        <div className="pulse-ring" />
        <h3>ML 融合预测</h3>
        <p>LSTM + GRU 双模型融合，云端/本地均可运行</p>
      </section>
    );
  }

  if (!prediction) {
    return (
      <section className="glass-card ml-panel empty-panel">
        <div className="ml-icon">🧠</div>
        <h3>ML 价格预测</h3>
        <p>获取行情后点击「ML 预测」，查看 LSTM + GRU 融合的未来 K 线</p>
      </section>
    );
  }

  const { metrics, models, fusion, framework, horizon, engine } = prediction;
  const isUp = metrics.direction === "up";

  return (
    <section className="glass-card ml-panel">
      <div className="ml-panel-header">
        <div>
          <h3>ML 融合预测</h3>
          <p className="subtitle">
            {framework}
            {engine ? ` · ${engine}` : ""} · {models?.join(" + ")} · {fusion?.replace(/_/g, " ")}
          </p>
        </div>
        <span className={`direction-badge ${isUp ? "up" : "down"}`}>
          {isUp ? "▲ Bullish" : "▼ Bearish"}
        </span>
      </div>

      <div className="ml-metrics">
        <div className="ml-metric">
          <span className="ml-metric-label">预测 horizon</span>
          <span className="ml-metric-value">{horizon} 交易日</span>
        </div>
        <div className="ml-metric">
          <span className="ml-metric-label">预期涨跌</span>
          <span className={`ml-metric-value ${isUp ? "up" : "down"}`}>
            {metrics.expectedChangePercent >= 0 ? "+" : ""}
            {metrics.expectedChangePercent}%
          </span>
        </div>
        <div className="ml-metric">
          <span className="ml-metric-label">模型一致性</span>
          <span className="ml-metric-value accent">{(metrics.confidence * 100).toFixed(0)}%</span>
        </div>
        <div className="ml-metric">
          <span className="ml-metric-label">目标价</span>
          <span className="ml-metric-value">${metrics.predictedClose}</span>
        </div>
      </div>

      <div className="model-tags">
        <span className="model-tag lstm">LSTM Trend</span>
        <span className="model-tag fuse">⊕ Fusion</span>
        <span className="model-tag gru">GRU Momentum</span>
      </div>

      <p className="disclaimer">演示用途，不构成投资建议</p>
    </section>
  );
}

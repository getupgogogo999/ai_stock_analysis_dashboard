export default function MLPredictionPanel({ prediction, loading }) {
  if (loading) {
    return (
      <section className="glass-card ml-panel loading-panel premium-border panel-violet">
        <div className="pulse-ring" />
        <h3>Running Forecast</h3>
        <p>Dual-model ensemble is computing the next 10 sessions…</p>
      </section>
    );
  }

  if (!prediction) {
    return (
      <section className="glass-card ml-panel empty-panel premium-border panel-violet">
        <div className="ml-icon-wrap">
          <span className="ml-icon">◈</span>
        </div>
        <h3>Price Forecast</h3>
        <p>Fetch a quote, then hit ML Forecast to see the fused prediction overlay.</p>
      </section>
    );
  }

  const { metrics, horizon } = prediction;
  const isUp = metrics.direction === "up";

  return (
    <section className="glass-card ml-panel premium-border panel-violet">
      <div className="ml-panel-header">
        <div>
          <h3>Ensemble Forecast</h3>
          <p className="subtitle">Trend + Momentum · 50/50 fusion · {horizon} sessions</p>
        </div>
        <span className={`direction-badge ${isUp ? "up" : "down"}`}>
          {isUp ? "▲ Bullish" : "▼ Bearish"}
        </span>
      </div>

      <div className="ml-metrics">
        <div className="ml-metric metric-cyan">
          <span className="ml-metric-label">Horizon</span>
          <span className="ml-metric-value">{horizon} days</span>
        </div>
        <div className={`ml-metric ${isUp ? "metric-green" : "metric-rose"}`}>
          <span className="ml-metric-label">Expected move</span>
          <span className={`ml-metric-value ${isUp ? "up" : "down"}`}>
            {metrics.expectedChangePercent >= 0 ? "+" : ""}
            {metrics.expectedChangePercent}%
          </span>
        </div>
        <div className="ml-metric metric-violet">
          <span className="ml-metric-label">Model agreement</span>
          <span className="ml-metric-value accent">{(metrics.confidence * 100).toFixed(0)}%</span>
        </div>
        <div className="ml-metric metric-amber">
          <span className="ml-metric-label">Target price</span>
          <span className="ml-metric-value">${metrics.predictedClose}</span>
        </div>
      </div>

      <div className="model-tags">
        <span className="model-tag tag-cyan">Trend Model</span>
        <span className="model-tag tag-fuse">⊕ Fusion</span>
        <span className="model-tag tag-rose">Momentum Model</span>
      </div>

      <p className="disclaimer">For demo purposes only · Not financial advice</p>
    </section>
  );
}

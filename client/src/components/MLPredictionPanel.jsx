export default function MLPredictionPanel({ prediction, loading }) {
  if (loading) {
    return (
      <section className="glass-card ml-panel loading-panel premium-border panel-violet">
        <div className="pulse-ring" />
        <h3>正在生成预测</h3>
        <p>双模型融合计算未来 10 个交易日走势…</p>
      </section>
    );
  }

  if (!prediction) {
    return (
      <section className="glass-card ml-panel empty-panel premium-border panel-violet">
        <div className="ml-icon-wrap">
          <span className="ml-icon">◈</span>
        </div>
        <h3>价格预测</h3>
        <p>获取行情后点击「ML 预测」，查看融合模型对未来 K 线的预测结果。</p>
      </section>
    );
  }

  const { metrics, horizon } = prediction;
  const isUp = metrics.direction === "up";

  return (
    <section className="glass-card ml-panel premium-border panel-violet">
      <div className="ml-panel-header">
        <div>
          <h3>融合预测结果</h3>
          <p className="subtitle">趋势模型 + 动量模型 · 50/50 融合 · {horizon} 个交易日</p>
        </div>
        <span className={`direction-badge ${isUp ? "up" : "down"}`}>
          {isUp ? "▲ 看涨" : "▼ 看跌"}
        </span>
      </div>

      <div className="ml-metrics">
        <div className="ml-metric metric-cyan">
          <span className="ml-metric-label">预测周期</span>
          <span className="ml-metric-value">{horizon} 天</span>
        </div>
        <div className={`ml-metric ${isUp ? "metric-green" : "metric-rose"}`}>
          <span className="ml-metric-label">预期涨跌</span>
          <span className={`ml-metric-value ${isUp ? "up" : "down"}`}>
            {metrics.expectedChangePercent >= 0 ? "+" : ""}
            {metrics.expectedChangePercent}%
          </span>
        </div>
        <div className="ml-metric metric-violet">
          <span className="ml-metric-label">模型一致性</span>
          <span className="ml-metric-value accent">{(metrics.confidence * 100).toFixed(0)}%</span>
        </div>
        <div className="ml-metric metric-amber">
          <span className="ml-metric-label">目标价</span>
          <span className="ml-metric-value">${metrics.predictedClose}</span>
        </div>
      </div>

      <div className="model-tags">
        <span className="model-tag tag-cyan">趋势模型</span>
        <span className="model-tag tag-fuse">⊕ 融合</span>
        <span className="model-tag tag-rose">动量模型</span>
      </div>

      <p className="disclaimer">仅供演示，不构成投资建议</p>
    </section>
  );
}

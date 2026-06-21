const SENTIMENT_LABEL = {
  Bullish: "看涨 Bullish",
  Neutral: "中性 Neutral",
  Bearish: "看跌 Bearish",
};

const SENTIMENT_CLASS = {
  Bullish: "sentiment-bullish",
  Neutral: "sentiment-neutral",
  Bearish: "sentiment-bearish",
};

const RISK_LABEL = {
  Low: "低 Low",
  Medium: "中 Medium",
  High: "高 High",
};

const RISK_CLASS = {
  Low: "risk-low",
  Medium: "risk-medium",
  High: "risk-high",
};

export default function AnalysisResult({ analysis }) {
  return (
    <section className="glass-card analysis-card premium-border panel-rose">
      <div className="analysis-header">
        <h2>AI 分析结果</h2>
        <span className="analysis-chip">GPT 驱动</span>
      </div>

      <div className="badges">
        <span className={`badge ${SENTIMENT_CLASS[analysis.sentiment]}`}>
          {SENTIMENT_LABEL[analysis.sentiment] || analysis.sentiment}
        </span>
        <span className={`badge ${RISK_CLASS[analysis.risk_level]}`}>
          风险：{RISK_LABEL[analysis.risk_level] || analysis.risk_level}
        </span>
      </div>

      <p className="summary">{analysis.summary}</p>
    </section>
  );
}

const SENTIMENT_CLASS = {
  Bullish: "sentiment-bullish",
  Neutral: "sentiment-neutral",
  Bearish: "sentiment-bearish",
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
        <h2>AI Insight</h2>
        <span className="analysis-chip">GPT Powered</span>
      </div>

      <div className="badges">
        <span className={`badge ${SENTIMENT_CLASS[analysis.sentiment]}`}>
          {analysis.sentiment}
        </span>
        <span className={`badge ${RISK_CLASS[analysis.risk_level]}`}>
          Risk: {analysis.risk_level}
        </span>
      </div>

      <p className="summary">{analysis.summary}</p>
    </section>
  );
}

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
    <section className="card analysis-card">
      <h2>AI 分析结果</h2>

      <div className="badges">
        <span className={`badge ${SENTIMENT_CLASS[analysis.sentiment]}`}>
          {analysis.sentiment}
        </span>
        <span className={`badge ${RISK_CLASS[analysis.risk_level]}`}>
          风险: {analysis.risk_level}
        </span>
      </div>

      <p className="summary">{analysis.summary}</p>
    </section>
  );
}

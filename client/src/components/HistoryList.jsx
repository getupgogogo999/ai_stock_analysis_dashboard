const SENTIMENT_CLASS = {
  Bullish: "sentiment-bullish",
  Neutral: "sentiment-neutral",
  Bearish: "sentiment-bearish",
};

function formatTime(iso) {
  return new Date(iso).toLocaleString("zh-CN");
}

export default function HistoryList({ items }) {
  return (
    <section className="card history-card">
      <h2>历史分析记录</h2>
      <div className="history-list">
        {items.map((item) => (
          <article key={item.id} className="history-item">
            <div className="history-top">
              <strong>{item.symbol}</strong>
              <span className={`badge ${SENTIMENT_CLASS[item.sentiment]}`}>
                {item.sentiment}
              </span>
              <span className="history-time">{formatTime(item.created_at)}</span>
            </div>
            <p>{item.summary}</p>
            <span className="risk-tag">风险: {item.risk_level}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

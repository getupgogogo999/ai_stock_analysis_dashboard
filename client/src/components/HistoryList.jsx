const SENTIMENT_CLASS = {
  Bullish: "sentiment-bullish",
  Neutral: "sentiment-neutral",
  Bearish: "sentiment-bearish",
};

function formatTime(iso) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryList({ items }) {
  return (
    <section className="glass-card history-card premium-border">
      <h2>Analysis History</h2>
      <p className="subtitle">Recent AI reports stored in Supabase</p>
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
            <span className="risk-tag">Risk level: {item.risk_level}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

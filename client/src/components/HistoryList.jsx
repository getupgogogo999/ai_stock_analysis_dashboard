const SENTIMENT_CLASS = {
  Bullish: "sentiment-bullish",
  Neutral: "sentiment-neutral",
  Bearish: "sentiment-bearish",
};

const SENTIMENT_LABEL = {
  Bullish: "看涨",
  Neutral: "中性",
  Bearish: "看跌",
};

const RISK_LABEL = { Low: "低", Medium: "中", High: "高" };

function formatTime(iso) {
  return new Date(iso).toLocaleString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
export default function HistoryList({ items }) {
  return (
    <section className="glass-card history-card premium-border">
      <h2>历史分析记录</h2>
      <p className="subtitle">由 Supabase 持久化存储的最近分析</p>
      <div className="history-list">
        {items.map((item) => (
          <article key={item.id} className="history-item">
            <div className="history-top">
              <strong>{item.symbol}</strong>
              <span className={`badge ${SENTIMENT_CLASS[item.sentiment]}`}>
                {SENTIMENT_LABEL[item.sentiment] || item.sentiment}
              </span>
              <span className="history-time">{formatTime(item.created_at)}</span>
            </div>
            <p>{item.summary}</p>
            <span className="risk-tag">风险等级：{RISK_LABEL[item.risk_level] || item.risk_level}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

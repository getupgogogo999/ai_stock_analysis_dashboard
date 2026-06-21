function Stat({ label, value, accent }) {
  return (
    <div className={`stat stat-accent-${accent || "default"}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

export default function StockDataCard({ data }) {
  const isUp = data.change >= 0;

  return (
    <section className="glass-card stock-card premium-border panel-amber">
      <div className="card-header">
        <div>
          <h2>{data.symbol}</h2>
          <p className="subtitle">{data.name}</p>
        </div>
        <span className="exchange-tag">{data.exchange}</span>
      </div>

      <div className={`price-row ${isUp ? "up" : "down"}`}>
        <span className="price">${data.currentPrice?.toFixed(2)}</span>
        <span className="change">
          {isUp ? "+" : ""}
          {data.change} ({data.changePercent})
        </span>
      </div>

      <div className="stats-grid">
        <Stat label="Open" value={`$${data.open?.toFixed(2)}`} accent="cyan" />
        <Stat label="Prev Close" value={`$${data.previousClose?.toFixed(2)}`} accent="violet" />
        <Stat label="High" value={`$${data.high?.toFixed(2)}`} accent="green" />
        <Stat label="Low" value={`$${data.low?.toFixed(2)}`} accent="rose" />
        <Stat label="Market Cap" value={data.marketCap} accent="amber" />
        <Stat label="P/E Ratio" value={data.peRatio} accent="cyan" />
        <Stat label="52W High" value={data.week52High} accent="green" />
        <Stat label="52W Low" value={data.week52Low} accent="rose" />
        <Stat label="Sector" value={data.industry} accent="violet" />
      </div>
    </section>
  );
}

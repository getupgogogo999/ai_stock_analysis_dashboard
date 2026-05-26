function Stat({ label, value, highlight }) {
  return (
    <div className={`stat ${highlight || ""}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

export default function StockDataCard({ data }) {
  const isUp = data.change >= 0;

  return (
    <section className="card stock-card">
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
        <Stat label="开盘价" value={`$${data.open?.toFixed(2)}`} />
        <Stat label="昨收" value={`$${data.previousClose?.toFixed(2)}`} />
        <Stat label="最高" value={`$${data.high?.toFixed(2)}`} />
        <Stat label="最低" value={`$${data.low?.toFixed(2)}`} />
        <Stat label="市值" value={data.marketCap} />
        <Stat label="市盈率" value={data.peRatio} />
        <Stat label="52周高" value={data.week52High} />
        <Stat label="52周低" value={data.week52Low} />
        <Stat label="行业" value={data.industry} />
      </div>
    </section>
  );
}

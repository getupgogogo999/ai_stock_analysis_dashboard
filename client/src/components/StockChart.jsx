import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const RANGES = [
  { key: "1m", label: "1\u6708" },
  { key: "3m", label: "3\u6708" },
  { key: "6m", label: "6\u6708" },
  { key: "1y", label: "1\u5e74" },
];

function formatPrice(value) {
  return `$${Number(value).toFixed(2)}`;
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-date">{p.date}</div>
      <div className="chart-tooltip-row">
        {"\u6536\u76d8 "}
        {formatPrice(p.close)}
      </div>
      <div className="chart-tooltip-row muted">
        {"\u9ad8 "}
        {formatPrice(p.high)}
        {" / \u4f4e "}
        {formatPrice(p.low)}
      </div>
    </div>
  );
}

export default function StockChart({
  symbol,
  data,
  loading,
  range,
  onRangeChange,
  isUp,
}) {
  const stroke = isUp ? "#22c55e" : "#ef4444";
  const fillId = isUp ? "chartFillUp" : "chartFillDown";

  return (
    <section className="card chart-card">
      <div className="chart-header">
        <div>
          <h2>
            {symbol} {"\u4ef7\u683c\u8d70\u52bf"}
          </h2>
          <p className="subtitle">{"\u6536\u76d8\u4ef7\u8d8b\u52bf\u56fe"}</p>
        </div>
        <div className="range-tabs">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              className={`range-tab ${range === r.key ? "active" : ""}`}
              onClick={() => onRangeChange(r.key)}
              disabled={loading}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-container">
        {loading ? (
          <div className="chart-placeholder">{"\u52a0\u8f7d\u8d70\u52bf\u6570\u636e..."}</div>
        ) : !data?.points?.length ? (
          <div className="chart-placeholder">{"\u6682\u65e0\u8d70\u52bf\u6570\u636e"}</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="chartFillUp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="chartFillDown" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#243049" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "#8b95a8", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "#243049" }}
                minTickGap={40}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fill: "#8b95a8", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="close"
                stroke={stroke}
                strokeWidth={2}
                fill={`url(#${fillId})`}
                dot={false}
                activeDot={{ r: 4, fill: stroke }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

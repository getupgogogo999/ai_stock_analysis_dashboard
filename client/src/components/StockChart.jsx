import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const RANGES = [
  { key: "1m", label: "1月" },
  { key: "3m", label: "3月" },
  { key: "6m", label: "6月" },
  { key: "1y", label: "1年" },
];

function formatPrice(value) {
  if (value == null) return "—";
  return `$${Number(value).toFixed(2)}`;
}

function buildChartSeries(historical, predicted) {
  if (!historical?.length) return [];

  const series = historical.map((p) => ({
    date: p.date,
    actual: p.close,
    forecast: null,
    isPredicted: false,
  }));

  if (predicted?.length) {
    const last = series[series.length - 1];
    last.forecast = last.actual;

    predicted.forEach((p) => {
      series.push({
        date: p.date,
        actual: null,
        forecast: p.close,
        isPredicted: true,
        trend: p.lstm,
        momentum: p.gru,
      });
    });
  }

  return series;
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-date">
        {p.date}
        {p.isPredicted && <span className="forecast-tag"> 预测</span>}
      </div>
      {p.actual != null && (
        <div className="chart-tooltip-row">收盘 {formatPrice(p.actual)}</div>
      )}
      {p.forecast != null && p.isPredicted && (
        <>
          <div className="chart-tooltip-row forecast">融合 {formatPrice(p.forecast)}</div>
          <div className="chart-tooltip-row muted">
            趋势 {formatPrice(p.trend)} · 动量 {formatPrice(p.momentum)}
          </div>
        </>
      )}
    </div>
  );
}

export default function StockChart({
  symbol,
  data,
  prediction,
  loading,
  range,
  onRangeChange,
  isUp,
}) {
  const stroke = isUp ? "#2dd4bf" : "#fb7185";
  const series = buildChartSeries(data?.points, prediction?.predicted);
  const splitDate = prediction?.predicted?.[0]?.date;

  return (
    <section className="glass-card chart-card premium-border panel-cyan">
      <div className="chart-header">
        <div>
          <h2>
            {symbol} <span className="gradient-text-sm">价格走势</span>
          </h2>
          <p className="subtitle">实线 = 历史收盘 · 虚线 = ML 融合预测</p>
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

      <div className="chart-legend">
        <span><i className="dot actual" /> 历史</span>
        {prediction && <span><i className="dot forecast" /> 预测</span>}
      </div>

      <div className="chart-container">
        {loading ? (
          <div className="chart-placeholder">
            <div className="spinner" />
            加载走势数据…
          </div>
        ) : !series.length ? (
          <div className="chart-placeholder">暂无走势数据</div>
        ) : (
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="chartFillUp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="chartFillDown" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fb7185" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#fb7185" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="forecastStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="50%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#f472b6" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                minTickGap={36}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={58}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip content={<ChartTooltip />} />
              {splitDate && (
                <ReferenceLine
                  x={splitDate}
                  stroke="#c084fc"
                  strokeDasharray="4 4"
                  label={{ value: "预测 →", fill: "#e9d5ff", fontSize: 11, position: "insideTopRight" }}
                />
              )}
              <Area
                type="monotone"
                dataKey="actual"
                stroke={stroke}
                strokeWidth={2.5}
                fill={`url(#${isUp ? "chartFillUp" : "chartFillDown"})`}
                dot={false}
                connectNulls={false}
                activeDot={{ r: 5, fill: stroke, stroke: "#fff", strokeWidth: 1 }}
              />
              {prediction && (
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="url(#forecastStroke)"
                  strokeWidth={3}
                  strokeDasharray="8 5"
                  dot={{ r: 4, fill: "#a78bfa", strokeWidth: 0 }}
                  connectNulls
                  activeDot={{ r: 6, fill: "#f0abfc", stroke: "#fff", strokeWidth: 1 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

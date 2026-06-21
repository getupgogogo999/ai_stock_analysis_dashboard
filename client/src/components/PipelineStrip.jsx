const STEPS = [
  { key: "data", label: "行情数据", sub: "Finnhub / Yahoo", color: "cyan" },
  { key: "ml", label: "ML 融合", sub: "双模型加权融合", color: "violet" },
  { key: "llm", label: "GPT 分析", sub: "结构化 JSON", color: "amber" },
  { key: "store", label: "Supabase", sub: "历史存储", color: "rose" },
];

export default function PipelineStrip({ activeStep = "data", mlOnline = false }) {
  return (
    <section className="pipeline-strip glass-card premium-border">
      <div className="pipeline-title">
        <span className="pipeline-icon">⚡</span>
        <div>
          <h3>智能分析流水线</h3>
          <p>数据 → ML 融合 → LLM → 持久化存储</p>
        </div>
        <span className={`ml-status ${mlOnline ? "online" : "offline"}`}>
          {mlOnline ? "● ML 就绪" : "○ ML 不可用"}
        </span>
      </div>
      <div className="pipeline-steps">
        {STEPS.map((step, i) => {
          const active = step.key === activeStep;
          const done =
            STEPS.findIndex((s) => s.key === activeStep) > i ||
            (activeStep === "store" && step.key !== "store");
          return (
            <div
              key={step.key}
              className={`pipeline-step step-${step.color} ${active ? "active" : ""} ${done ? "done" : ""}`}
            >
              <div className="step-node">{i + 1}</div>
              <div className="step-text">
                <strong>{step.label}</strong>
                <span>{step.sub}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

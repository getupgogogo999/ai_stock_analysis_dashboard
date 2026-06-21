const STEPS = [
  { key: "data", label: "Market Data", sub: "Finnhub / Yahoo", color: "cyan" },
  { key: "ml", label: "ML Ensemble", sub: "Dual-model fusion", color: "violet" },
  { key: "llm", label: "GPT Analysis", sub: "Structured JSON", color: "amber" },
  { key: "store", label: "Supabase", sub: "History store", color: "rose" },
];

export default function PipelineStrip({ activeStep = "data", mlOnline = false }) {
  return (
    <section className="pipeline-strip glass-card premium-border">
      <div className="pipeline-title">
        <span className="pipeline-icon">⚡</span>
        <div>
          <h3>Intelligence Pipeline</h3>
          <p>Data → ML Fusion → LLM → Persistent Storage</p>
        </div>
        <span className={`ml-status ${mlOnline ? "online" : "offline"}`}>
          {mlOnline ? "● ML Ready" : "○ ML Unavailable"}
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

const STEPS = [
  { key: "data", label: "Market Data", sub: "Finnhub / Yahoo" },
  { key: "ml", label: "PyTorch Ensemble", sub: "LSTM + GRU Fusion" },
  { key: "llm", label: "GPT Analysis", sub: "Structured JSON" },
  { key: "store", label: "Supabase", sub: "History Store" },
];

export default function PipelineStrip({ activeStep = "data", mlOnline = false }) {
  return (
    <section className="pipeline-strip glass-card">
      <div className="pipeline-title">
        <span className="pipeline-icon">⚡</span>
        <div>
          <h3>AI Pipeline</h3>
          <p>Data → PyTorch Model Stitching → LLM → Storage</p>
        </div>
        <span className={`ml-status ${mlOnline ? "online" : "offline"}`}>
          {mlOnline ? "ML Engine Online" : "ML Engine Offline"}
        </span>
      </div>
      <div className="pipeline-steps">
        {STEPS.map((step, i) => {
          const active = step.key === activeStep;
          const done =
            STEPS.findIndex((s) => s.key === activeStep) > i ||
            (activeStep === "store" && step.key !== "store");
          return (
            <div key={step.key} className={`pipeline-step ${active ? "active" : ""} ${done ? "done" : ""}`}>
              <div className="step-node">{i + 1}</div>
              <div className="step-text">
                <strong>{step.label}</strong>
                <span>{step.sub}</span>
              </div>
              {i < STEPS.length - 1 && <div className="step-connector" />}
            </div>
          );
        })}
      </div>
    </section>
  );
}

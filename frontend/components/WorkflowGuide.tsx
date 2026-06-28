const steps = [
  {
    number: "01",
    icon: "⬡",
    title: "Threats Detected",
    body: "The AI monitors incoming email, SMS, and voice for phishing, smishing, and vishing patterns in real time.",
    action: null,
  },
  {
    number: "02",
    icon: "◈",
    title: "Triage the Alert Queue",
    body: "Open each alert, review the evidence and detection confidence, then mark it as investigating or resolved.",
    action: { label: "Open queue →", href: "/alerts" },
  },
  {
    number: "03",
    icon: "◉",
    title: "Review Employee Exposure",
    body: "High-risk employees are ranked by score. Check their profile, see all linked alerts, and action the training plan.",
    action: { label: "See employees →", href: "/users" },
  },
] as const;

export function WorkflowGuide() {
  return (
    <div className="workflowGuide">
      <div className="workflowHeader">
        <span className="eyebrow" style={{ marginBottom: 0 }}>Analyst Workflow</span>
        <span className="muted" style={{ fontSize: "0.82rem" }}>
          Follow these steps to go from detection to containment
        </span>
      </div>
      <div className="workflowSteps">
        {steps.map((step, i) => (
          <div key={step.number} className="workflowStep">
            <div className="workflowStepNumber">{step.number}</div>
            <div className="workflowStepIcon">{step.icon}</div>
            <div className="workflowStepContent">
              <div className="workflowStepTitle">{step.title}</div>
              <div className="workflowStepBody">{step.body}</div>
              {step.action && (
                <a className="workflowStepLink" href={step.action.href}>
                  {step.action.label}
                </a>
              )}
            </div>
            {i < steps.length - 1 && (
              <div className="workflowArrow" aria-hidden>›</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

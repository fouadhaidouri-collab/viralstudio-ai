export default function PlanBadge({ plan }) {
  const planConfig = {
    Free: { bg: "bg-surface-container-high", text: "text-on-surface-variant" },
    Creator: { bg: "bg-secondary/10", text: "text-secondary" },
    Pro: { bg: "bg-primary/10", text: "text-primary" },
    Agency: { bg: "bg-gradient-to-r from-primary/20 to-accent-cyan/20", text: "text-white" },
  };
  const config = planConfig[plan] || planConfig.Free;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-md ${config.bg} ${config.text}`}>
      {plan === "Agency" && (
        <svg className="w-2.5 h-2.5 mr-1" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
      )}
      {plan}
    </span>
  );
}

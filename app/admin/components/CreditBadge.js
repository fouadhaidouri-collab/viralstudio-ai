export default function CreditBadge({ amount, size = "sm" }) {
  const isNegative = amount < 0;
  const isZero = amount === 0;
  const sizeClasses = size === "sm" ? "text-[11px] px-2 py-0.5" : "text-sm px-2.5 py-1";

  let bg, textColor;
  if (isZero) { bg = "bg-surface-container-high"; textColor = "text-on-surface-variant"; }
  else if (isNegative) { bg = "bg-error/10"; textColor = "text-error"; }
  else { bg = "bg-yellow-500/10"; textColor = "text-yellow-400"; }

  return (
    <span className={`inline-flex items-center gap-1 font-bold rounded-md ${sizeClasses} ${bg} ${textColor}`}>
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
      {isNegative ? "" : "+"}{amount.toLocaleString()}
    </span>
  );
}

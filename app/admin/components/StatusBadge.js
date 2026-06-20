export default function StatusBadge({ status, size = "sm" }) {
  const statusConfig = {
    active: { bg: "bg-green-500/15", text: "text-green-400", dot: "bg-green-400" },
    completed: { bg: "bg-green-500/15", text: "text-green-400", dot: "bg-green-400" },
    paid: { bg: "bg-green-500/15", text: "text-green-400", dot: "bg-green-400" },
    resolved: { bg: "bg-green-500/15", text: "text-green-400", dot: "bg-green-400" },
    processing: { bg: "bg-secondary/15", text: "text-secondary", dot: "bg-secondary" },
    pending: { bg: "bg-yellow-500/15", text: "text-yellow-400", dot: "bg-yellow-400" },
    open: { bg: "bg-secondary/15", text: "text-secondary", dot: "bg-secondary" },
    inactive: { bg: "bg-surface-container-high", text: "text-on-surface-variant", dot: "bg-on-surface-variant" },
    failed: { bg: "bg-error/15", text: "text-error", dot: "bg-error" },
    refunded: { bg: "bg-accent-orange/15", text: "text-accent-orange", dot: "bg-accent-orange" },
    suspended: { bg: "bg-yellow-500/15", text: "text-yellow-400", dot: "bg-yellow-400" },
    banned: { bg: "bg-error/15", text: "text-error", dot: "bg-error" },
    cancelled: { bg: "bg-on-surface-variant/15", text: "text-on-surface-variant", dot: "bg-on-surface-variant" },
    error: { bg: "bg-error/15", text: "text-error", dot: "bg-error" },
    warning: { bg: "bg-yellow-500/15", text: "text-yellow-400", dot: "bg-yellow-400" },
    info: { bg: "bg-secondary/15", text: "text-secondary", dot: "bg-secondary" },
    success: { bg: "bg-green-500/15", text: "text-green-400", dot: "bg-green-400" },
    low: { bg: "bg-surface-container-high", text: "text-on-surface-variant", dot: "bg-on-surface-variant" },
    medium: { bg: "bg-yellow-500/15", text: "text-yellow-400", dot: "bg-yellow-400" },
    high: { bg: "bg-error/15", text: "text-error", dot: "bg-error" },
  };

  const config = statusConfig[status?.toLowerCase()] || statusConfig.inactive;
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-md ${sizeClasses} ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {status}
    </span>
  );
}

"use client";
import Icon from "../../components/Icon";

export default function ConfirmModal({ open, onClose, onConfirm, title = "Confirm Action", message = "Are you sure you want to proceed?", confirmLabel = "Confirm", confirmVariant = "primary", loading = false }) {
  if (!open) return null;

  const buttonClass = confirmVariant === "danger"
    ? "bg-error/20 text-error border border-error/30 hover:bg-error/30"
    : "primary-gradient text-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-container border border-surface-border/80 rounded-2xl max-w-sm w-full mx-4 animate-dropdown-open" onClick={(e) => e.stopPropagation()}>
        <div className="p-5">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${confirmVariant === "danger" ? "bg-error/10" : "bg-primary/10"}`}>
            <Icon name={confirmVariant === "danger" ? "error" : "check_circle"} className={confirmVariant === "danger" ? "text-error" : "text-primary"} size={22} />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose} disabled={loading} className="flex-1 px-3 py-2 bg-surface-container-high border border-surface-border rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container-higher transition-all disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${buttonClass}`}>
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

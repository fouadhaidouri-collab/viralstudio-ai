import Icon from "../../components/Icon";

export default function PageHeader({ title, subtitle, breadcrumbs, actions }) {
  return (
    <div className="mb-5">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1.5 mb-2">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <Icon name="chevron_right" className="text-on-surface-variant/30" size={12} />}
              {crumb.href ? (
                <a href={crumb.href} className="text-[10px] text-on-surface-variant hover:text-primary transition-colors">{crumb.label}</a>
              ) : (
                <span className="text-[10px] text-on-surface-variant/60">{crumb.label}</span>
              )}
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-white" style={{ fontFamily: "Geist, sans-serif" }}>{title}</h1>
          {subtitle && <p className="text-xs text-on-surface-variant mt-0.5">{subtitle}</p>}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions.map((action, i) => (
              <button
                key={i}
                onClick={action.onClick}
                disabled={action.disabled}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${
                  action.variant === "primary"
                    ? "primary-gradient text-white hover:brightness-110"
                    : action.variant === "danger"
                      ? "bg-error/10 text-error border border-error/20 hover:bg-error/20"
                      : "bg-surface-container-high border border-surface-border/50 text-on-surface-variant hover:bg-surface-container-higher hover:text-white"
                }`}
              >
                {action.icon && <Icon name={action.icon} size={14} className="inline mr-1.5" />}
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

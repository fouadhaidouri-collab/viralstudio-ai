import Icon from "../../components/Icon";

export default function EmptyState({ icon = "inbox", title = "No data found", description = "There are no items to display yet.", action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-14 h-14 rounded-xl bg-surface-container-high border border-surface-border/50 flex items-center justify-center mb-4">
        <Icon name={icon} className="text-on-surface-variant/50" size={28} />
      </div>
      <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
      <p className="text-xs text-on-surface-variant text-center max-w-xs">{description}</p>
      {action && (
        <button onClick={action.onClick} className="mt-4 px-4 py-2 primary-gradient text-white rounded-lg text-xs font-semibold hover:brightness-110 transition-all">
          {action.label}
        </button>
      )}
    </div>
  );
}

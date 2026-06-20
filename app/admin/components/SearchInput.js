import Icon from "../../components/Icon";

export default function SearchInput({ value, onChange, placeholder = "Search...", className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" size={14} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-surface-container-low border border-surface-border/50 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-on-surface-variant focus:outline-none focus:border-primary/50 transition-all"
      />
      {value && (
        <button onClick={() => onChange("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-white transition-colors">
          <Icon name="close" size={14} />
        </button>
      )}
    </div>
  );
}

import Icon from "../../components/Icon";

export default function FilterSelect({ value, onChange, options, placeholder = "All" }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-surface-container-low border border-surface-border/50 rounded-lg pl-3 pr-8 py-2 text-xs text-white cursor-pointer focus:outline-none focus:border-primary/50 transition-all"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <Icon name="expand_more" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" size={14} />
    </div>
  );
}

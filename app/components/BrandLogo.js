import Icon from "./Icon";

const sizes = {
  md: {
    iconBox: "h-11 w-11 rounded-[14px]",
    icon: 20,
    title: "text-xl",
    subtitle: "text-[9px]",
    gap: "gap-3",
    dot: "h-1 w-1",
    glow: "rounded-xl",
  },
  sm: {
    iconBox: "h-8 w-8 rounded-[10px]",
    icon: 15,
    title: "text-sm",
    subtitle: "text-[8px]",
    gap: "gap-2",
    dot: "h-0.5 w-0.5",
    glow: "rounded-lg",
  },
};

export default function BrandLogo({ subtitle = "Premium Suite", size = "md", className = "" }) {
  const style = sizes[size] || sizes.md;

  return (
    <span className={`flex items-center ${style.gap} ${className}`} translate="no">
      <span className="relative shrink-0">
        <span className={`absolute inset-0 ${style.glow} bg-primary/40 blur-xl`} />
        <span
          className={`relative flex ${style.iconBox} items-center justify-center`}
          style={{
            background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 50%, #3b0764 100%)",
            boxShadow: "0 0 30px rgba(168,85,247,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
          }}
        >
          <Icon
            name="bolt"
            className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
            size={style.icon}
          />
        </span>
      </span>

      <span className="min-w-0 text-left">
        <span
          className={`block whitespace-nowrap font-extrabold leading-none tracking-tight ${style.title}`}
          style={{
            background: "linear-gradient(135deg, #fff 30%, #a855f7 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontFamily: "Geist, sans-serif",
          }}
        >
          ViralStudio AI
        </span>
        <span className="mt-1 flex items-center gap-1.5">
          <span className={`${style.dot} rounded-full bg-primary`} />
          <span
            className={`whitespace-nowrap font-bold uppercase tracking-[0.15em] text-on-surface-variant ${style.subtitle}`}
          >
            {subtitle}
          </span>
        </span>
      </span>
    </span>
  );
}

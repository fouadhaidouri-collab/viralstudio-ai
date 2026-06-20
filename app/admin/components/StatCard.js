"use client";
import Icon from "../../components/Icon";

export default function StatCard({ title, value, icon, color = "primary", prefix, suffix, trend, subtitle }) {
  const colorMap = {
    primary: { bg: "bg-primary/10", text: "text-primary", glow: "rgba(168,85,247,0.3)" },
    secondary: { bg: "bg-secondary/10", text: "text-secondary", glow: "rgba(34,211,238,0.3)" },
    tertiary: { bg: "bg-tertiary/10", text: "text-tertiary", glow: "rgba(251,146,60,0.3)" },
    accentOrange: { bg: "bg-accent-orange/10", text: "text-accent-orange", glow: "rgba(249,115,22,0.3)" },
    accentCyan: { bg: "bg-accent-cyan/10", text: "text-accent-cyan", glow: "rgba(6,182,212,0.3)" },
    accentPink: { bg: "bg-accent-pink/10", text: "text-accent-pink", glow: "rgba(236,72,153,0.3)" },
    error: { bg: "bg-error/10", text: "text-error", glow: "rgba(248,113,113,0.3)" },
    green: { bg: "bg-green-500/10", text: "text-green-400", glow: "rgba(74,222,128,0.3)" },
    yellow: { bg: "bg-yellow-500/10", text: "text-yellow-400", glow: "rgba(250,204,21,0.3)" },
  };

  const c = colorMap[color] || colorMap.primary;

  return (
    <div className="glass-card p-5 rounded-2xl flex flex-col gap-3 card-glow glass-card-hover min-h-[120px]" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.02), transparent)" }}>
      <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center ${c.text} shadow-lg icon-glow`} style={{ filter: `drop-shadow(0 0 8px ${c.glow})` }}>
        <Icon name={icon} size={24} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-on-surface-variant truncate">{title}</p>
        <p className="text-xl font-bold text-white mt-0.5" style={{ fontFamily: "Geist, sans-serif" }}>
          {prefix}{typeof value === "number" ? value.toLocaleString() : value}{suffix}
        </p>
        {(trend || subtitle) && (
          <p className={`text-[10px] mt-0.5 ${trend?.startsWith("+") ? "text-green-400" : trend?.startsWith("-") ? "text-error" : "text-on-surface-variant"}`}>
            {trend || subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

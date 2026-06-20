"use client";
import { useState } from "react";
import Icon from "../../components/Icon";

export default function ChartCard({ title, subtitle, icon, children, height = "h-48", action }) {
  return (
    <div className="glass-card rounded-xl overflow-hidden card-glow" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.02), transparent)" }}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          {icon && <Icon name={icon} className="text-primary" size={14} />}
          <div>
            <h3 className="text-xs font-semibold text-white">{title}</h3>
            {subtitle && <p className="text-[10px] text-on-surface-variant">{subtitle}</p>}
          </div>
        </div>
        {action && (
          <button onClick={action.onClick} className="text-[10px] text-primary hover:text-primary/80 font-medium transition-colors">
            {action.label}
          </button>
        )}
      </div>
      <div className={`px-4 pb-4 ${height} flex items-center justify-center`}>
        {children}
      </div>
    </div>
  );
}

export function SimpleBarChart({ data, height = 48 }) {
  if (!data || data.length === 0) return <p className="text-xs text-on-surface-variant">No data</p>;
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-1.5 w-full h-full pt-4">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
          <div
            className="w-full rounded-sm transition-all duration-500 hover:opacity-80"
            style={{
              height: `${(d.value / max) * 100}%`,
              background: d.color || "linear-gradient(180deg, #a855f7 0%, #7c3aed 100%)",
              minHeight: d.value > 0 ? "4px" : "0px",
            }}
          />
          {d.label && <span className="text-[8px] text-on-surface-variant truncate w-full text-center">{d.label}</span>}
        </div>
      ))}
    </div>
  );
}

export function SimpleLineChart({ data, height = 120 }) {
  if (!data || data.length < 2) return <p className="text-xs text-on-surface-variant">Need at least 2 data points</p>;
  const max = Math.max(...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value));
  const range = max - min || 1;
  const w = 100 / (data.length - 1);
  const points = data.map((d, i) => `${i * w},${100 - ((d.value - min) / range) * 80 - 10}`).join(" ");
  return (
    <div className="w-full h-full flex flex-col justify-center">
      <svg viewBox={`0 0 100 100`} className="w-full h-full" preserveAspectRatio="none">
        <polyline fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} className="drop-shadow-[0_0_4px_rgba(168,85,247,0.5)]" />
        <polyline fill="url(#gradient)" stroke="none" points={`0,100 ${points} 100,100`} opacity="0.15" />
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <div className="flex justify-between mt-1">
        <span className="text-[8px] text-on-surface-variant">{data[0]?.label || ""}</span>
        <span className="text-[8px] text-on-surface-variant">{data[data.length - 1]?.label || ""}</span>
      </div>
    </div>
  );
}

export function SimplePieChart({ data, size = 80 }) {
  if (!data || data.length === 0) return <p className="text-xs text-on-surface-variant">No data</p>;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let cumulative = 0;
  const segments = data.map((d) => {
    const start = cumulative;
    cumulative += (d.value / total) * 360;
    return { ...d, start, end: cumulative };
  });
  const colors = ["#a855f7", "#22d3ee", "#fb923c", "#ec4899", "#f97316", "#06b6d4", "#f87171", "#facc15"];
  const r = size / 2;
  const cx = r;
  const cy = r;
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((s, i) => {
          const startAngle = (s.start / 360) * 2 * Math.PI - Math.PI / 2;
          const endAngle = (s.end / 360) * 2 * Math.PI - Math.PI / 2;
          const x1 = cx + r * Math.cos(startAngle);
          const y1 = cy + r * Math.sin(startAngle);
          const x2 = cx + r * Math.cos(endAngle);
          const y2 = cy + r * Math.sin(endAngle);
          const largeArc = s.end - s.start > 180 ? 1 : 0;
          if (s.value === 0) return null;
          return (
            <path key={i} d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`} fill={colors[i % colors.length]} opacity="0.8" stroke="#030303" strokeWidth="1" />
          );
        })}
      </svg>
      <div className="space-y-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm" style={{ background: colors[i % colors.length] }} />
            <span className="text-[10px] text-on-surface-variant">{d.label}</span>
            <span className="text-[10px] text-white font-medium">{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

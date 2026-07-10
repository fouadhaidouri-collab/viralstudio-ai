"use client";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon";

function getVersion(label, family) {
  if (!family) return label;
  const idx = label.toLowerCase().indexOf(family.toLowerCase());
  if (idx === -1) return label;
  return label.slice(idx + family.length).trim();
}

export default function ModelSelector({ label, providers, selectedModel, onSelect, calcCredits, compact }) {
  const [open, setOpen] = useState(false);
  const [activeProvider, setActiveProvider] = useState("");
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target) && btnRef.current && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      for (const p of providers) {
        if (p.models.some(m => m.id === selectedModel.id || m.label === selectedModel.label)) {
          setActiveProvider(p.name);
          return;
        }
      }
      if (providers.length > 0) setActiveProvider(providers[0].name);
    }
  }, [open, providers, selectedModel]);

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const pw = 620;
      const l = Math.max(16, Math.min(r.left + r.width / 2 - pw / 2, window.innerWidth - pw - 16));
      setPos({ top: Math.min(r.bottom + 8, window.innerHeight - 500), left: l });
    }
    setOpen(!open);
  };

  const activeGroup = providers.find(p => p.name === activeProvider);
  const activeModels = activeGroup?.models || [];

  return (
    <div className="w-full">
      <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1.5 font-semibold" style={{ fontFamily: 'Geist, sans-serif' }}>{label}</div>
      <button
        ref={btnRef}
        onClick={toggle}
        className={`w-full flex items-center justify-between gap-1.5 bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/10 rounded-xl hover:border-primary/40 hover:from-primary/[0.08] hover:to-primary/[0.02] transition-all duration-200 shadow-sm ${compact ? 'px-2.5 py-1.5' : 'px-3.5 py-3 text-sm'}`}
      >
        <span className="flex items-center gap-1.5 truncate min-w-0">
          <Icon name={selectedModel.icon} className="text-sm flex-shrink-0" style={{ color: selectedModel.color }} />
          <span className="font-semibold text-white text-[11px] truncate">{selectedModel.label}</span>
          {calcCredits?.(selectedModel) != null && (
            <span className="text-[9px] text-yellow-400 font-medium shrink-0">({calcCredits(selectedModel)} credit)</span>
          )}
        </span>
        <Icon name="expand_more" className={`text-[10px] text-on-surface-variant shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={ref}
          className="fixed z-[99999] animate-dropdown-open flex overflow-hidden"
          style={{
            top: pos.top,
            left: pos.left,
            width: "620px",
            maxHeight: "480px",
            borderRadius: "16px",
            background: "#0e0e0e",
            border: "1px solid rgba(139,92,246,0.15)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.06)",
          }}
        >
          <div className="w-[150px] shrink-0 overflow-y-auto py-2 border-r border-white/[0.06] custom-scrollbar" style={{ background: "rgba(255,255,255,0.015)" }}>
            {providers.map((p) => {
              const isActive = p.name === activeProvider;
              return (
                <button
                  key={p.name}
                  onClick={() => setActiveProvider(p.name)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 transition-all duration-200 text-left ${
                    isActive
                      ? "text-white"
                      : "text-on-surface-variant hover:text-white"
                  }`}
                  style={{
                    background: isActive ? `linear-gradient(90deg, ${p.color}15, transparent)` : "transparent",
                    borderRight: isActive ? `2px solid ${p.color}` : "2px solid transparent",
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200"
                    style={{
                      background: `${p.color}18`,
                      transform: isActive ? "scale(1.05)" : "scale(1)",
                    }}
                  >
                    <Icon name={p.icon} size={14} style={{ color: p.color }} />
                  </div>
                  <span className="text-xs font-semibold">{p.name}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto py-3 px-3 custom-scrollbar">
            <div className="flex items-center gap-2 mb-3 px-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: activeGroup?.color || "#a855f7" }} />
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">{activeProvider}</span>
            </div>
            <div className="space-y-2">
              {activeModels.map((model) => {
                const selected = model.id ? model.id === selectedModel.id : model.label === selectedModel.label;
                const credits = calcCredits?.(model);
                const version = getVersion(model.label, model.family || activeProvider);
                const durOpts = model.options?.duration || [];
                const minDur = durOpts.length > 0 ? Math.min(...durOpts.map(d => parseInt(d))) : null;
                const maxDur = durOpts.length > 0 ? Math.max(...durOpts.map(d => parseInt(d))) : null;
                const durStr = minDur && maxDur ? (minDur === maxDur ? `${minDur}s` : `${minDur}-${maxDur}s`) : null;
                return (
                  <button
                    key={model.id || model.label}
                    onClick={() => { onSelect(model); setOpen(false); }}
                    className={`w-full flex items-start gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                      selected
                        ? "border"
                        : "border border-transparent hover:bg-white/[0.03]"
                    }`}
                    style={{
                      background: selected ? `linear-gradient(135deg, ${model.color}10, transparent)` : "transparent",
                      borderColor: selected ? `${model.color}30` : "transparent",
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200"
                      style={{
                        border: `2px solid ${selected ? model.color : "rgba(255,255,255,0.15)"}`,
                        background: selected ? `${model.color}20` : "transparent",
                      }}
                    >
                      {selected && <div className="w-2.5 h-2.5 rounded-full" style={{ background: model.color }} />}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-bold ${selected ? "text-white" : "text-white/80"}`}>
                          {version || model.label}
                        </span>
                        {model.badge && (
                          <span
                            className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-[0.08em] whitespace-nowrap"
                            style={{
                              background: `${model.badgeColor || "#facc15"}18`,
                              color: model.badgeColor || "#facc15",
                              border: `1px solid ${model.badgeColor || "#facc15"}25`,
                            }}
                          >
                            {model.badge}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        {credits != null && (
                          <span className="text-[11px] font-semibold" style={{ color: model.color + "dd" }}>
                            <Icon name="bolt" size={11} className="inline mr-0.5" style={{ color: model.color + "dd" }} />
                            {credits} credits
                          </span>
                        )}
                        {durStr && (
                          <>
                            <span className="text-[9px] text-white/20">·</span>
                            <span className="text-[10px] text-white/50 font-medium">
                              <Icon name="schedule" size={10} className="inline mr-0.5" />{durStr}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {selected && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: model.color }}>
                        <Icon name="check" className="text-white" size={12} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

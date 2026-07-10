"use client";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon";

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
      const pw = 660;
      const l = Math.max(16, Math.min(r.left + r.width / 2 - pw / 2, window.innerWidth - pw - 16));
      setPos({ top: Math.min(r.bottom + 8, window.innerHeight - 500), left: l });
    }
    setOpen(!open);
  };

  const activeModels = providers.find(p => p.name === activeProvider)?.models || [];

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
            width: "660px",
            maxHeight: "480px",
            borderRadius: "16px",
            background: "#0e0e0e",
            border: "1px solid rgba(139,92,246,0.15)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.06)",
          }}
        >
          <div className="w-[170px] shrink-0 overflow-y-auto py-2 border-r border-white/[0.06] custom-scrollbar" style={{ background: "rgba(255,255,255,0.015)" }}>
            {providers.map((p) => {
              const isActive = p.name === activeProvider;
              return (
                <button
                  key={p.name}
                  onClick={() => setActiveProvider(p.name)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 transition-all duration-200 text-left ${
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
                  <span className="text-xs font-medium">{p.name}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto py-3 px-4 custom-scrollbar">
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: providers.find(p => p.name === activeProvider)?.color || "#a855f7" }} />
              <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">{activeProvider}</span>
            </div>
            <div className="space-y-1.5">
              {activeModels.map((model) => {
                const selected = model.id ? model.id === selectedModel.id : model.label === selectedModel.label;
                const credits = calcCredits?.(model);
                return (
                  <button
                    key={model.id || model.label}
                    onClick={() => { onSelect(model); setOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 ${
                      selected
                        ? "border"
                        : "border border-transparent hover:bg-white/[0.03]"
                    }`}
                    style={{
                      background: selected ? `linear-gradient(135deg, ${model.color}12, transparent)` : "transparent",
                      borderColor: selected ? `${model.color}30` : "transparent",
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200"
                      style={{
                        background: `${model.color}18`,
                        boxShadow: selected ? `0 0 16px ${model.color}20` : "none",
                      }}
                    >
                      <Icon name={model.icon} size={18} style={{ color: model.color }} />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-semibold ${selected ? "text-white" : "text-white/90"}`}>{model.label}</span>
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
                      <div className="flex items-center gap-2 mt-0.5">
                        {credits != null && (
                          <span className="text-[10px] font-medium" style={{ color: model.color + "cc" }}>{credits} credits</span>
                        )}
                        {model.duration && (
                          <>
                            <span className="text-[9px] text-white/15">·</span>
                            <span className="text-[9px] text-white/40">{model.duration}</span>
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

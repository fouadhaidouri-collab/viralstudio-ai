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

const brandLogos = {
  Veo: (
    <svg viewBox="0 0 24 24" width="24" height="24">
      <rect x="1" y="1" width="22" height="22" rx="5" fill="#4285F4" />
      <polygon points="9,6 9,18 18,12" fill="white" />
    </svg>
  ),
  Grok: (
    <svg viewBox="0 0 24 24" width="24" height="24">
      <rect x="1" y="1" width="22" height="22" rx="5" fill="#06b6d4" />
      <circle cx="12" cy="12" r="5" fill="none" stroke="white" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="1.5" fill="white" />
    </svg>
  ),
  Seedance: (
    <svg viewBox="0 0 24 24" width="24" height="24">
      <rect x="1" y="1" width="22" height="22" rx="5" fill="#f59e0b" />
      <path d="M7,16 Q12,6 14,10 Q16,14 12,18" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="14" cy="8" r="1.2" fill="white" />
    </svg>
  ),
  Kling: (
    <svg viewBox="0 0 24 24" width="24" height="24">
      <rect x="1" y="1" width="22" height="22" rx="5" fill="#ef4444" />
      <text x="12" y="16" textAnchor="middle" fontSize="13" fontWeight="700" fill="white" fontFamily="Arial">K</text>
    </svg>
  ),
  Runway: (
    <svg viewBox="0 0 24 24" width="24" height="24">
      <rect x="1" y="1" width="22" height="22" rx="5" fill="#10b981" />
      <rect x="6" y="8" width="12" height="2" rx="1" fill="white" />
      <rect x="6" y="11" width="10" height="2" rx="1" fill="white" />
      <rect x="6" y="14" width="8" height="2" rx="1" fill="white" />
    </svg>
  ),
  Luma: (
    <svg viewBox="0 0 24 24" width="24" height="24">
      <rect x="1" y="1" width="22" height="22" rx="5" fill="#8b5cf6" />
      <polygon points="12,5 19,12 12,19 5,12" fill="none" stroke="white" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.5" fill="white" />
    </svg>
  ),
  Pika: (
    <svg viewBox="0 0 24 24" width="24" height="24">
      <rect x="1" y="1" width="22" height="22" rx="5" fill="#ec4899" />
      <polygon points="9,7 17,12 9,17" fill="white" />
    </svg>
  ),
  Hailuo: (
    <svg viewBox="0 0 24 24" width="24" height="24">
      <rect x="1" y="1" width="22" height="22" rx="5" fill="#3b82f6" />
      <path d="M5,16 C8,6 12,6 16,16" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="10.5" cy="9" r="1.2" fill="white" />
    </svg>
  ),
  "Happy Horse": (
    <svg viewBox="0 0 24 24" width="24" height="24">
      <rect x="1" y="1" width="22" height="22" rx="5" fill="#14b8a6" />
      <path d="M8,16 C8,9 16,9 16,16" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="10.5" cy="10" r="1" fill="white" />
      <path d="M16,11 L19,8 L19,14 Z" fill="white" opacity="0.8" />
    </svg>
  ),
};

const badgeEmojis = {
  "New": "🟢",
  "Popular": "🔥",
  "Fastest": "⚡",
  "Best Quality": "⭐",
  "Premium": "💎",
};

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
      const pw = 700;
      const l = Math.max(16, Math.min(r.left + r.width / 2 - pw / 2, window.innerWidth - pw - 16));
      setPos({ top: Math.min(r.bottom + 8, window.innerHeight - 520), left: l });
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
        <span className="flex items-center gap-2 truncate min-w-0">
          {brandLogos[selectedModel.family || selectedModel.provider] || (
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${selectedModel.color}20` }}>
              <Icon name={selectedModel.icon} className="text-sm" style={{ color: selectedModel.color }} />
            </div>
          )}
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
          className="fixed z-[99999] flex overflow-hidden animate-fadeIn"
          style={{
            top: pos.top,
            left: pos.left,
            width: "700px",
            maxHeight: "520px",
            borderRadius: "16px",
            background: "#0e0e0e",
            border: "1px solid rgba(139,92,246,0.15)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.06)",
          }}
        >
          <div className="w-[160px] shrink-0 overflow-y-auto py-3 border-r border-white/[0.06] custom-scrollbar" style={{ background: "rgba(255,255,255,0.015)" }}>
            {providers.map((p) => {
              const isActive = p.name === activeProvider;
              return (
                <button
                  key={p.name}
                  onClick={() => setActiveProvider(p.name)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 transition-all duration-200 text-left ${
                    isActive
                      ? "text-white"
                      : "text-on-surface-variant hover:text-white"
                  }`}
                  style={{
                    background: isActive ? `linear-gradient(90deg, ${p.color}15, transparent)` : "transparent",
                    borderRight: isActive ? `2px solid ${p.color}` : "2px solid transparent",
                  }}
                >
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0">
                    {brandLogos[p.name] || (
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${p.color}20` }}>
                        <Icon name={p.icon} size={14} style={{ color: p.color }} />
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-semibold">{p.name}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto py-3 px-3 custom-scrollbar">
            <div className="flex items-center gap-2 mb-3 px-1.5">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0">
                {brandLogos[activeProvider] || (
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${activeGroup?.color}20` }}>
                    <Icon name={activeGroup?.icon} size={14} style={{ color: activeGroup?.color }} />
                  </div>
                )}
              </div>
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">{activeProvider}</span>
            </div>
            <div className="space-y-2">
              {activeModels.map((model, idx) => {
                const selected = model.id ? model.id === selectedModel.id : model.label === selectedModel.label;
                const credits = calcCredits?.(model);
                const version = getVersion(model.label, model.family || activeProvider);
                const durOpts = model.options?.duration || [];
                const minDur = durOpts.length > 0 ? Math.min(...durOpts.map(d => parseInt(d))) : null;
                const maxDur = durOpts.length > 0 ? Math.max(...durOpts.map(d => parseInt(d))) : null;
                const durStr = minDur && maxDur ? (minDur === maxDur ? `${minDur}s` : `${minDur}-${maxDur}s`) : null;
                const badge = model.badge;
                const badgeEmoji = badgeEmojis[badge];
                return (
                  <button
                    key={model.id || model.label}
                    onClick={() => { onSelect(model); setOpen(false); }}
                    className={`w-full flex items-start gap-3 px-4 py-[14px] rounded-xl transition-all duration-200 hover:scale-[1.02] ${
                      selected
                        ? "border border-purple-500/40 shadow-[0_0_12px_-4px_rgba(139,92,246,0.3)]"
                        : "border border-transparent hover:bg-white/[0.04]"
                    }`}
                    style={{
                      background: selected ? `linear-gradient(135deg, ${model.color}08, transparent)` : "transparent",
                      animation: `slideRight ${200 + idx * 50}ms ease-out both`,
                    }}
                  >
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      {brandLogos[model.family || model.provider] || (
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${model.color}20` }}>
                          <Icon name={model.icon} size={14} style={{ color: model.color }} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-base font-semibold ${selected ? "text-white" : "text-white/80"}`}>
                          {version || model.label}
                        </span>
                        {badge && badgeEmoji && (
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded whitespace-nowrap"
                            style={{
                              background: `${model.badgeColor || "#facc15"}18`,
                              color: model.badgeColor || "#facc15",
                              border: `1px solid ${model.badgeColor || "#facc15"}25`,
                            }}
                          >
                            {badgeEmoji} {badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[13px] text-white/50 mt-1 leading-snug">{model.desc || ""}</div>
                      <div className="flex items-center gap-3 mt-2">
                        {credits != null && (
                          <span className="text-[11px] font-semibold text-yellow-400/90">
                            🪙 {credits} credits
                          </span>
                        )}
                        {durStr && (
                          <span className="text-[11px] text-white/50 font-medium flex items-center gap-1">
                            <Icon name="schedule" size={11} className="text-white/40" />{durStr}
                          </span>
                        )}
                      </div>
                    </div>
                    {selected && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: model.color }}>
                        <Icon name="check" className="text-white" size={11} />
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

      <style jsx>{`
        @keyframes slideRight {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        :global(.animate-fadeIn) {
          animation: fadeIn 200ms ease-out both;
        }
      `}</style>

    </div>
  );
}

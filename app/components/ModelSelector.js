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

const brandIcons = {
  Veo: { icon: "videocam", color: "#4285F4" },
  Grok: { icon: "psychology", color: "#06b6d4" },
  Seedance: { icon: "directions_run", color: "#f59e0b" },
  Kling: { icon: "smart_display", color: "#ef4444" },
  Runway: { icon: "run_circle", color: "#10b981" },
  Luma: { icon: "flare", color: "#8b5cf6" },
  Pika: { icon: "pets", color: "#ec4899" },
  Hailuo: { icon: "waves", color: "#3b82f6" },
  "Happy Horse": { icon: "emoji_nature", color: "#14b8a6" },
  OpenAI: { icon: "psychology", color: "#10b981" },
  "Nano Banana": { icon: "auto_awesome", color: "#f59e0b" },
  Google: { icon: "videocam", color: "#4285F4" },
};

function BrandLogo({ name, size = 24 }) {
  const brand = brandIcons[name];
  if (!brand) return null;
  return (
    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${brand.color}20` }}>
      <Icon name={brand.icon} className="text-sm" style={{ color: brand.color }} />
    </div>
  );
}

const badgeEmojis = {
  "New": "🟢",
  "Popular": "🔥",
  "Fastest": "⚡",
  "Best Quality": "⭐",
  "Premium": "💎",
};

export default function ModelSelector({ label, providers, selectedModel, onSelect, calcCredits, calcStartingCredits, compact }) {
  const [open, setOpen] = useState(false);
  const [activeProvider, setActiveProvider] = useState("");
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef(null);
  const btnRef = useRef(null);
  const hasInteracted = useRef(false);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target) && btnRef.current && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // On open: auto-select provider based on selectedModel (only if user hasn't interacted)
  useEffect(() => {
    if (open) {
      hasInteracted.current = false;
      for (const p of providers) {
        if (p.models.some(m => m.id === selectedModel.id || m.label === selectedModel.label)) {
          setActiveProvider(p.name);
          return;
        }
      }
      if (providers.length > 0) setActiveProvider(providers[0].name);
    }
  }, [open]);

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
          <BrandLogo name={selectedModel.family || selectedModel.provider} />
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
                  onClick={() => { hasInteracted.current = true; setActiveProvider(p.name); }}
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
                  <BrandLogo name={p.name} />
                  <span className="text-xs font-semibold">{p.name}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto py-3 px-3 custom-scrollbar">
            <div className="flex items-center gap-2 mb-3 px-1.5">
              <BrandLogo name={activeProvider} />
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">{activeProvider}</span>
            </div>
            <div className="space-y-2">
              {activeModels.map((model, idx) => {
                const selected = model.id ? model.id === selectedModel.id : model.label === selectedModel.label;
                const startingCredits = calcStartingCredits?.(model);
                const version = getVersion(model.label, model.family || activeProvider);
                const genTime = model.genTime;
                const badge = model.badge;
                const badgeEmoji = badgeEmojis[badge];
                return (
                  <button
                    key={model.id || model.label}
                    onClick={() => { onSelect(model); setOpen(false); }}
                    className={`w-full flex items-start gap-3 px-4 py-4 rounded-xl transition-all duration-200 hover:scale-[1.02] ${
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
                      <BrandLogo name={model.family || model.provider} />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-lg font-semibold ${selected ? "text-white" : "text-white/80"}`}>
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
                      <div className="text-sm text-white/50 mt-1 leading-snug">{model.desc || ""}</div>
                      <div className="flex items-center gap-3 mt-2">
                        {startingCredits != null && (
                          <span className="text-xs font-semibold text-yellow-400/90">
                            💳 {startingCredits} credits
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

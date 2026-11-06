"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon";

const BRAND_ASSETS = {
  OpenAI: { logo: "openai.png", color: "#10a37f" },
  Google: { logo: "google.png", color: "#4285f4" },
  ByteDance: { logo: "seedance.jpg", color: "#ec4899" },
  "Black Forest Labs": { color: "#22d3ee", icon: "auto_awesome" },
  xAI: { logo: "grok.png", color: "#06b6d4" },
};

const MODEL_DETAILS = {
  "GPT Image 2": "OpenAI image generation model. Choose the output format and resolution supported by this model.",
  "Nano Banana 2": "Google image generation model for flexible image creation across supported formats.",
  "Nano Banana Pro": "Google's Pro image model with high-resolution output options.",
  "Seedream 5.0 Pro": "ByteDance image generation model with detailed visual output options.",
  "Flux 2 Pro": "Flux Pro image generation model by Black Forest Labs.",
  "Grok Imagine": "xAI image generation model for prompt-based image creation.",
};

function BrandLogo({ provider, size = 38 }) {
  const brand = BRAND_ASSETS[provider] || {};
  if (brand.logo) {
    return <img src={`/logos/${brand.logo}`} alt={provider} width={size} height={size} className="shrink-0 rounded-xl border border-white/10 object-cover" style={{ width: size, height: size }} />;
  }
  return <span className="flex shrink-0 items-center justify-center rounded-xl border border-white/10" style={{ width: size, height: size, background: `${brand.color || "#a855f7"}18` }}><Icon name={brand.icon || "smart_toy"} className="text-lg" style={{ color: brand.color || "#a855f7" }} /></span>;
}

function Chip({ children, tone = "default" }) {
  const tones = {
    default: "border-white/10 bg-white/[0.04] text-white/55",
    purple: "border-primary/25 bg-primary/10 text-primary",
    green: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
    blue: "border-sky-400/25 bg-sky-400/10 text-sky-300",
  };
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${tones[tone] || tones.default}`}>{children}</span>;
}

export default function ImageModelCatalog({ models, selectedModel, onSelect, calcCredits, calcStartingCredits }) {
  const groups = useMemo(() => {
    const map = new Map();
    for (const model of models) {
      if (!map.has(model.provider)) map.set(model.provider, []);
      map.get(model.provider).push(model);
    }
    return Array.from(map, ([name, items]) => ({ name, models: items }));
  }, [models]);
  const [open, setOpen] = useState(false);
  const [activeProvider, setActiveProvider] = useState(selectedModel?.provider || groups[0]?.name || "");
  const activeGroup = groups.find((group) => group.name === activeProvider) || groups[0];

  useEffect(() => {
    if (!open) return;
    setActiveProvider(selectedModel?.provider || groups[0]?.name || "");
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, selectedModel, groups]);

  return (
    <div className="w-full">
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/40" style={{ fontFamily: "Geist, sans-serif" }}>Image Model</div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] px-3 py-2.5 text-left shadow-sm transition-all duration-200 hover:border-primary/40 hover:from-primary/[0.08] hover:to-primary/[0.02] active:scale-[0.99]"
      >
        <span className="flex min-w-0 items-center gap-3">
          <BrandLogo provider={selectedModel.provider} size={36} />
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold text-white">{selectedModel.label}</span>
            <span className="mt-0.5 block truncate text-[10px] text-white/40">{selectedModel.provider} · Image generation</span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="text-right"><span className="block text-xs font-bold text-yellow-300">{calcCredits?.(selectedModel)} credit</span><span className="block text-[8px] uppercase tracking-wider text-white/30">per image</span></span>
          <Icon name="expand_more" className="text-sm text-white/35 transition-colors group-hover:text-primary" />
        </span>
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-stretch justify-center bg-black/80 backdrop-blur-md sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <div className="relative flex h-full w-full flex-col overflow-hidden border border-white/10 bg-[#0c0814] shadow-[0_40px_140px_rgba(0,0,0,0.8)] sm:h-[88vh] sm:max-w-6xl sm:rounded-2xl">
            <div className="relative shrink-0 border-b border-white/[0.07] px-4 pb-4 pt-5 sm:px-6">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-70" style={{ background: "radial-gradient(ellipse at 20% 0%, rgba(168,85,247,0.24), transparent 65%)" }} />
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary"><Icon name="auto_awesome" className="text-base" /></span>
                  <div><h2 className="text-base font-semibold text-white sm:text-lg">Choose an image model</h2><p className="text-[11px] text-white/40">Explore image models and their available versions.</p></div>
                </div>
                <button type="button" onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/60 transition-all hover:border-white/20 hover:bg-white/[0.08] hover:text-white" aria-label="Close image model catalog"><Icon name="close" className="text-lg" /></button>
              </div>
              <div className="relative mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
                {groups.map((group) => {
                  const active = group.name === activeProvider;
                  return <button key={group.name} type="button" onClick={() => setActiveProvider(group.name)} aria-pressed={active} className={`relative flex min-h-[57px] items-center gap-2 overflow-hidden rounded-xl border px-2.5 py-2 text-left transition-all active:scale-[0.98] ${active ? "border-primary/50 bg-gradient-to-br from-primary/20 via-primary/[0.09] to-white/[0.025] text-white shadow-[0_0_0_1px_rgba(168,85,247,0.12),0_10px_28px_rgba(88,28,135,0.18)]" : "border-white/10 bg-white/[0.035] text-white/65 hover:border-primary/35 hover:bg-white/[0.07] hover:text-white"}`}>
                    <BrandLogo provider={group.name} size={28} />
                    <span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-bold tracking-wide">{group.name}</span><span className={`mt-0.5 block text-[9px] ${active ? "text-primary/90" : "text-white/35"}`}>{group.models.length} {group.models.length === 1 ? "model" : "models"}</span></span>
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${active ? "border-primary bg-primary text-white" : "border-white/10 bg-black/20 text-transparent"}`}><Icon name="check" className="text-[10px]" /></span>
                  </button>;
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-10 pt-5 sm:px-6">
              {activeGroup && <section>
                <div className="mb-3 flex items-center gap-2.5"><BrandLogo provider={activeGroup.name} size={32} /><div><h3 className="text-sm font-semibold text-white">{activeGroup.name}</h3><p className="text-[10px] text-white/35">{activeGroup.models.length} available {activeGroup.models.length === 1 ? "model" : "models"}</p></div><div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" /></div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {activeGroup.models.map((model) => {
                    const selected = model.label === selectedModel.label;
                    const ratios = model.options?.aspect_ratio || [];
                    const resolutions = model.options?.resolution || [];
                    return <button key={model.model_id || model.label} type="button" onClick={() => { onSelect(model); setOpen(false); }} className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 active:scale-[0.99] ${selected ? "border-primary/50 bg-primary/[0.08] shadow-[0_0_0_1px_rgba(168,85,247,0.2),0_18px_50px_rgba(88,28,135,0.25)]" : "border-white/[0.07] bg-white/[0.025] hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white/[0.045] hover:shadow-[0_18px_45px_rgba(0,0,0,0.35)]"}`}>
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 opacity-0 transition-opacity group-hover:opacity-100" style={{ background: `radial-gradient(ellipse at 20% 0%, ${BRAND_ASSETS[model.provider]?.color || "#a855f7"}18, transparent 70%)` }} />
                      <div className="relative flex items-start gap-3"><BrandLogo provider={model.provider} /><div className="min-w-0 flex-1"><h4 className="text-[13px] font-semibold text-white">{model.label}</h4><p className="mt-0.5 text-[10px] text-white/35">{model.provider}</p></div><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-primary bg-primary text-white" : "border-white/15 bg-white/[0.03] text-transparent group-hover:border-primary/40"}`}><Icon name="check" className="text-[11px]" /></span></div>
                      <p className="relative mt-3 min-h-[42px] text-[11px] leading-relaxed text-white/45">{MODEL_DETAILS[model.label] || "AI image generation model."}</p>
                      <div className="relative mt-3 flex flex-wrap gap-1.5"><Chip tone="purple">Image generation</Chip>{resolutions.map((resolution) => <Chip key={resolution}>{resolution.toUpperCase()}</Chip>)}</div>
                      <div className="relative mt-3 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3">
                        <div><div className="text-[8px] font-semibold uppercase tracking-[0.14em] text-white/30">Ratios</div><div className="mt-0.5 truncate text-[11px] font-semibold text-white/80">{ratios.length} formats</div></div>
                        <div><div className="text-[8px] font-semibold uppercase tracking-[0.14em] text-white/30">Resolution</div><div className="mt-0.5 truncate text-[11px] font-semibold text-white/80">{resolutions.map((r) => r.toUpperCase()).join(" · ")}</div></div>
                        <div><div className="text-[8px] font-semibold uppercase tracking-[0.14em] text-white/30">Credits</div><div className="mt-0.5 truncate text-[11px] font-semibold text-yellow-300">{calcStartingCredits?.(model) ?? calcCredits?.(model) ?? "—"}</div></div>
                      </div>
                    </button>;
                  })}
                </div>
              </section>}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

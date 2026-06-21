"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import Sidebar from "../components/Sidebar";
import ProfileDropdown from "../components/ProfileDropdown";
import { SidebarProvider } from "../components/SidebarContext";
import { useSidebar } from "../components/SidebarContext";
import { useAuth } from "../lib/AuthContext";
import InsufficientCreditsModal from "../components/InsufficientCreditsModal";
import Icon from "../components/Icon";

function AspectIcon({ label, size = "text-sm" }) {
  const ratioStr = label.split(" ").find(s => s.includes(":")) || label;
  const [w, h] = ratioStr.split(":").map(Number);
  if (isNaN(w) || isNaN(h)) return null;
  const max = 16;
  const ratio = w / h;
  let width, height;
  if (ratio >= 1) { width = max; height = max / ratio; }
  else { height = max; width = max * ratio; }
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={`${size} shrink-0`} style={{ minWidth: width }}>
      <rect x="0.5" y="0.5" width={width - 1} height={height - 1} rx="1.5" fill="none" stroke="currentColor" strokeOpacity="0.7" />
    </svg>
  );
}
import {
  videoModels, videoAspectRatios, videoResolutions, videoModelCapabilities
} from "../lib/capabilities";

const BASE_DURATION_SEC = 5;
const secFromDuration = (d) => {
  const n = parseInt(d, 10);
  return isNaN(n) ? BASE_DURATION_SEC : n;
};
const durationMultiplier = (d) => secFromDuration(d) / BASE_DURATION_SEC;
const resolutionMultiplier = (r) => r === "1080p" ? 1.5 : 1;

const TEMPLATE_VIDEOS = Array.from({ length: 11 }, (_, i) => `/templates/template${i + 1}.mp4`);

const calcModelCredits = (unitPrice, quantity, settings) => {
  if (unitPrice == null) return null;
  const markup = settings?.default_markup_multiplier || 2.0;
  const usdValue = settings?.credit_usd_value || 0.029;
  const minCredits = settings?.minimum_generation_credits || 1;
  const sellCost = unitPrice * quantity * markup;
  const credits = Math.ceil(sellCost / usdValue);
  return Math.max(credits, minCredits);
};

function ModelDropdown({ label, value, options, onChange, compact, pricingMap, duration, resolution, creditSettings }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ bottom: window.innerHeight - r.top + 7, left: Math.max(10, r.left) });
    }
    setOpen(!open);
  };

  return (
    <div ref={ref} className="w-full">
      <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1.5 font-semibold" style={{ fontFamily: 'Geist, sans-serif' }}>{label}</div>
      <button
        ref={btnRef}
        onClick={toggle}
        className={`w-full flex items-center justify-between gap-1.5 bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/10 rounded-xl hover:border-primary/40 hover:from-primary/[0.08] hover:to-primary/[0.02] transition-all duration-200 shadow-sm ${compact ? 'px-2.5 py-1.5' : 'px-3.5 py-3 text-sm'}`}
      >
        <span className="flex items-center gap-1.5 truncate min-w-0">
          <Icon name={value.icon} className="text-sm flex-shrink-0" style={{ color: value.color }} />
          <span className="font-semibold text-white text-[11px] truncate">{value.label}</span>
          {(() => {
            const p = pricingMap?.[value.label];
            const c = calcModelCredits(p?.unitPrice ?? 0.05, durationMultiplier(duration) * resolutionMultiplier(resolution), creditSettings);
            return c != null && <span className="text-[9px] text-yellow-400 font-medium shrink-0">({c} credit)</span>;
          })()}
        </span>
        <Icon name="expand_more" className={`text-[10px] text-on-surface-variant shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && typeof document !== "undefined" && createPortal(
          <div
            className="fixed animate-dropdown-open z-[99999]"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ bottom: pos.bottom, left: pos.left, width: "300px", borderRadius: "24px", background: "#0e0e0e", border: "1px solid rgba(139,92,246,0.15)", boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.06)" }}
        >
            <div className="py-2" style={{ maxHeight: "500px", overflowY: "auto", overflowX: "hidden" }}>
            {options.map((opt) => {
              const selected = opt.label === value.label;
              return (
                <button
                  key={opt.label}
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-5 transition-all duration-150 ${selected ? "" : "hover:bg-white/[0.04]"}`}
                  style={{ paddingTop: "12px", paddingBottom: "12px", background: selected ? "rgba(139,92,246,0.15)" : "transparent" }}
                >
                  <Icon name={opt.icon} className="text-base flex-shrink-0" style={{ color: opt.color }} />
                  <span className="text-xs font-semibold" style={{ color: selected ? "#a78bfa" : "#ffffff" }}>{opt.label}</span>
                  {(() => {
                    const p = pricingMap?.[opt.label];
                    const c = calcModelCredits(p?.unitPrice ?? 0.05, 1, creditSettings);
                    return c != null && (
                      <span className="text-[9px] text-yellow-400 shrink-0 whitespace-nowrap font-medium">({c} credit)</span>
                    );
                  })()}
                  {selected && <Icon name="check" className="text-xs ml-auto text-primary" />}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function Dropdown({ label, value, options, onChange, compact }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1.5 font-semibold" style={{ fontFamily: 'Geist, sans-serif' }}>{label}</div>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/10 rounded-xl hover:border-primary/40 hover:from-primary/[0.08] hover:to-primary/[0.02] transition-all duration-200 shadow-sm ${compact ? 'px-3 py-2.5 text-xs' : 'px-3 py-2.5 text-sm'}`}
      >
        <span className="truncate flex items-center gap-1.5 font-medium">
          {(() => {
            const match = options.find(o => (typeof o === "string" ? o : o.label) === value);
            if (match && typeof match !== "string") {
              if (match.label?.includes(":")) return <><AspectIcon label={match.label} />{value}</>;
              return <><Icon name={match.icon} className="text-sm" style={{color: match.color || "#d2bbff"}} />{value}</>;
            }
            return value;
          })()}
        </span>
        <Icon name="expand_more" className={`text-sm text-on-surface-variant shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-surface-container/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto py-1.5">
          {options.map((opt) => (
            <button
              key={typeof opt === "string" ? opt : opt.label}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-3 py-2.5 text-sm transition-all duration-150 flex items-center gap-2 ${value === (typeof opt === "string" ? opt : opt.label) ? "text-white bg-primary/15 border-l-2 border-primary" : "text-on-surface hover:bg-white/[0.06] hover:text-white border-l-2 border-transparent"}`}
            >
              {typeof opt !== "string" && (opt.label?.includes(":") ? <AspectIcon label={opt.label} /> : <Icon name={opt.icon} className="text-base" style={{color: opt.color || "#d2bbff"}} />)}
              {typeof opt === "string" ? opt : opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AIVideoPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(videoModels[0]);
  const [modelConfigs, setModelConfigs] = useState({});

  const caps = videoModelCapabilities[model.label] || videoModelCapabilities["Veo 3.1 Fast"];
  const defaultDurations = caps.durations.length > 0 ? caps.durations : ["5 seconds"];
  const availableAspectRatios = videoAspectRatios.filter(ar => caps.aspectRatios.includes(ar.label));
  const availableResolutions = videoResolutions.filter(r => caps.resolutions.includes(r));
  const availableDurations = caps.durations;
  const currentConfig = modelConfigs[model.label] || { aspectRatio: videoAspectRatios[0], resolution: videoResolutions[0], duration: defaultDurations[0] };
  const updateConfig = (key, value) => {
    setModelConfigs(prev => ({ ...prev, [model.label]: { ...(prev[model.label] || {}), [key]: value } }));
  };
  const [videoCount, setVideoCount] = useState(1);
  const [images, setImages] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [videoUrls, setVideoUrls] = useState([]);
  const [videoError, setVideoError] = useState(null);
  const [pricing, setPricing] = useState({});
  const [creditSettings, setCreditSettings] = useState({ credit_usd_value: 0.029, default_markup_multiplier: 2.0, minimum_generation_credits: 1 });
  const [credits, setCredits] = useState(0);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [neededCredits, setNeededCredits] = useState(0);
  const fileInputRef = useRef();
  const [bgVideoIdx, setBgVideoIdx] = useState(0);
  const { setMobileOpen } = useSidebar();

  useEffect(() => {
    const interval = setInterval(() => {
      setBgVideoIdx((prev) => (prev + 1) % TEMPLATE_VIDEOS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("prompt");
    if (p) setPrompt(p);
  }, []);

  useEffect(() => {
    const ids = videoModels.map(m => m.fal_model).join(",");
    fetch(`/api/model-pricing?endpoint_ids=${encodeURIComponent(ids)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.prices) {
          const m = {};
          for (const mod of videoModels) {
            if (data.prices[mod.fal_model]) {
              m[mod.label] = data.prices[mod.fal_model];
            } else {
              m[mod.label] = { unitPrice: null, pricingUnavailable: true };
            }
          }
          setPricing(m);
        }
      })
      .catch(() => {});
    fetch("/api/pricing/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.credit_usd_value) setCreditSettings(data);
      })
      .catch(() => {});
    fetch("/api/credits")
      .then((r) => r.json())
      .then((data) => {
        if (data.balance != null) setCredits(data.balance);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const c = videoModelCapabilities[model.label];
    if (!c) return;
    const existing = modelConfigs[model.label];
    if (!existing) {
      const defaults = { aspectRatio: videoAspectRatios[0], resolution: videoResolutions[0], duration: defaultDurations[0] };
      if (c.aspectRatios.length > 0) {
        const found = videoAspectRatios.find(ar => ar.label === c.aspectRatios[0]);
        if (found) defaults.aspectRatio = found;
      }
      if (c.resolutions.length > 0) defaults.resolution = c.resolutions[0];
      if (c.durations.length > 0) defaults.duration = c.durations[0];
      setModelConfigs(prev => ({ ...prev, [model.label]: defaults }));
      return;
    }
    let changed = false;
    const updated = { ...existing };
    if (c.aspectRatios.length > 0 && !c.aspectRatios.includes(existing.aspectRatio?.label)) {
      const found = videoAspectRatios.find(ar => ar.label === c.aspectRatios[0]);
      if (found) { updated.aspectRatio = found; changed = true; }
    }
    if (c.resolutions.length > 0 && !c.resolutions.includes(existing.resolution)) {
      updated.resolution = c.resolutions[0]; changed = true;
    }
    if (c.durations.length > 0 && !c.durations.includes(existing.duration)) {
      updated.duration = c.durations[0]; changed = true;
    }
    if (changed) setModelConfigs(prev => ({ ...prev, [model.label]: updated }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.label]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImages((prev) => [...prev, ev.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const generateOne = async () => {
    const modelId = model.fal_model;
    if (!modelId) throw new Error(`Unknown model: ${model.label}`);

    const subRes = await fetch("/api/generate-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        modelId,
        aspectRatio: currentConfig.aspectRatio?.label || "16:9",
        resolution: currentConfig.resolution,
        duration: currentConfig.duration,

      }),
    });

    if (!subRes.ok) {
      const err = await subRes.json();
      throw new Error(err.error || "Failed to submit");
    }

    const { requestId } = await subRes.json();

    let done = false;
    while (!done) {
      await new Promise((r) => setTimeout(r, 2000));
      const statusRes = await fetch(`/api/generate-video?requestId=${requestId}&modelId=${modelId}`);

      if (!statusRes.ok) {
        const err = await statusRes.json();
        throw new Error(err.error || "Status check failed");
      }

      const statusData = await statusRes.json();

      if (statusData.status === "COMPLETED") {
        return statusData.videoUrl;
      } else if (statusData.status === "FAILED" || statusData.status === "CANCELLED") {
        throw new Error(`Generation ${statusData.status.toLowerCase()}`);
      }
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (!isAuthenticated) { router.push("/login"); return; }

    const p = pricing?.[model.label];
    const quantity = videoCount * durationMultiplier(currentConfig.duration) * resolutionMultiplier(currentConfig.resolution);
    const needed = calcModelCredits(p?.unitPrice ?? 0.05, quantity, creditSettings);
    if (needed != null && credits < needed) {
      setNeededCredits(needed);
      setShowCreditModal(true);
      return;
    }

    setGenerating(true);
    setVideoUrls([]);
    setVideoError(null);

    try {
      const results = [];
      for (let i = 0; i < videoCount; i++) {
        const url = await generateOne();
        results.push(url);
        setVideoUrls([...results]);
      }
    } catch (err) {
      setVideoError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden no-x-scroll">
      <SidebarProvider>
      <Sidebar />
      <div className="fixed inset-0 overflow-hidden z-0">
        {TEMPLATE_VIDEOS.map((src, i) => (
          <video
            key={src}
            src={src}
            muted autoPlay loop playsInline
            preload="none"
            className={`absolute inset-0 w-full h-full object-fill transition-opacity duration-1000 ${
              i === bgVideoIdx ? "opacity-70" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-background/20 via-background/10 to-background/30"></div>
      </div>
      <header className="fixed top-0 right-0 w-full md:w-[calc(100%-16rem)] h-14 md:h-16 bg-surface/70 backdrop-blur-xl border-b border-surface-border/50 z-40 flex items-center justify-between md:justify-end px-4 md:px-8" style={{ boxShadow: '0 1px 20px rgba(0,0,0,0.3)' }}>
        <button onClick={() => setMobileOpen(true)} className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-low border border-surface-border/50 hover:bg-surface-container-high transition-all" style={{ touchAction: 'manipulation' }}>
          <Icon name="menu" className="text-white text-xl" />
        </button>
        <div className="flex items-center gap-3 md:gap-6">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low border border-surface-border/60 rounded-xl hover:border-yellow-400/30 transition-all duration-200">
            <Icon name="bolt" className="text-sm text-yellow-400" />
            <span className="text-sm font-bold text-yellow-400">{credits}</span>
            <button onClick={() => router.push("/pricing")} className="ml-1 w-5 h-5 flex items-center justify-center rounded-full bg-yellow-400/15 hover:bg-yellow-400/25 transition-all duration-200 hover:scale-110 active:scale-95">
              <Icon name="add" className="text-[10px] text-yellow-400" />
            </button>
          </div>
          <div className="h-8 w-px bg-surface-border"></div>
          <ProfileDropdown />
        </div>
      </header>
      <main style={{ height: 'calc(100vh - 3.5rem)' }} className="fixed top-14 md:top-16 right-0 w-full md:w-[calc(100%-16rem)]">
        <div className="relative z-10 h-full p-3 md:p-5 lg:pl-6 lg:pr-0 flex flex-col xl:grid xl:grid-cols-[432px_1fr] gap-3 md:gap-4 xl:gap-5 overflow-y-auto smooth-scroll">
          {/* LEFT: Composer */}
          <div className="flex flex-col flex-1">
            {/* Single card — textarea fills, everything else at bottom */}
            <div className="glass-card rounded-xl p-4 lg:p-5 border border-white/5 flex-1 flex flex-col gap-0 card-glow" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full min-h-[240px] xl:flex-1 bg-surface-container-lowest border border-surface-border rounded-xl p-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none transition-all placeholder:text-on-surface-variant/40"
                placeholder="Describe the video you want to create. Be as detailed as possible for best results."
              ></textarea>

              <div className="flex flex-wrap gap-2 mt-4 shrink-0">
                <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-1.5 px-3.5 py-2 bg-surface-container-low border border-surface-border/60 rounded-xl text-xs font-medium hover:bg-surface-container-high hover:border-primary/30 transition-all duration-200 active:scale-95" style={{ fontFamily: 'Geist, sans-serif' }}>
                  <Icon name="image" className="text-base" /> Add image(s)
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              </div>

              {images.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4 shrink-0">
                  {images.map((img, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-surface-border group">
                      <img src={img} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                      <button onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Icon name="close" className="text-xs text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-auto pt-3 shrink-0 space-y-2">
                <ModelDropdown label="AI Model" value={model} options={videoModels} onChange={setModel} compact pricingMap={pricing} duration={currentConfig.duration} resolution={currentConfig.resolution} creditSettings={creditSettings} />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {availableAspectRatios.length > 0 && (
                    <Dropdown label="Aspect Ratio" value={currentConfig.aspectRatio.label} options={availableAspectRatios} onChange={(v) => updateConfig("aspectRatio", v)} />
                  )}
                  <Dropdown label="Resolution" value={currentConfig.resolution} options={availableResolutions} onChange={(v) => updateConfig("resolution", v)} />
                  <Dropdown label="Duration" value={currentConfig.duration} options={availableDurations} onChange={(v) => updateConfig("duration", v)} />
                  <Dropdown label="Quantity" value={String(videoCount)} options={["1", "2", "3", "4", "5"]} onChange={(v) => setVideoCount(Number(v))} />
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={generating || !prompt.trim()}
                  className="w-full primary-gradient text-white font-semibold py-3 rounded-xl shadow-lg shadow-primary/25 flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.97] hover:translate-y-[-1px] disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                  style={{ fontFamily: 'Geist, sans-serif' }}
                >
                  {generating ? (
                    <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Generating...</>
                  ) : (
                    <><Icon name="auto_videocam" className="text-sm" /> Generate Video {(() => {
                      const p = pricing?.[model.label];
                      const quantity = videoCount * durationMultiplier(currentConfig.duration) * resolutionMultiplier(currentConfig.resolution);
                      const c = calcModelCredits(p?.unitPrice ?? 0.05, quantity, creditSettings);
                      return c != null && <span className="text-yellow-300/90">({c} credit)</span>;
                    })()}</>
                  )}
                </button>

              </div>
            </div>
          </div>

          {/* RIGHT: Preview Area */}
          <div className="flex flex-col gap-3 min-w-0">
            <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }} className="glass-card rounded-2xl relative bg-black flex-1 flex flex-col border border-white/5 card-glow">
              <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
                <div style={{ background: 'radial-gradient(ellipse at center, rgba(168,85,247,0.08) 0%, transparent 70%)' }} className="absolute inset-0"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center animate-pulse mb-4">
                    <Icon name="circle_play" className="text-primary text-3xl" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-surface-container-low border border-surface-border/60 rounded-xl text-sm font-medium hover:bg-surface-container-high hover:border-primary/30 transition-all duration-200 active:scale-[0.97]" style={{ fontFamily: 'Geist, sans-serif' }}>
                <Icon name="download" className="text-base" /> Download
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-surface-container-low border border-surface-border/60 rounded-xl text-sm font-medium hover:bg-surface-container-high hover:border-primary/30 transition-all duration-200 active:scale-[0.97]" style={{ fontFamily: 'Geist, sans-serif' }}>
                <Icon name="share" className="text-base" /> Share
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-surface-container-low border border-surface-border/60 rounded-xl text-sm font-medium hover:bg-surface-container-high hover:border-primary/30 transition-all duration-200 active:scale-[0.97]" style={{ fontFamily: 'Geist, sans-serif' }}>
                <Icon name="rotate" className="text-base" /> Regenerate
              </button>
            </div>
          </div>

          {/* Generated Videos List */}
          {videoUrls.length > 0 && (
            <div className="xl:col-span-2 glass-card rounded-xl p-4 border border-white/5 card-glow" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2"><Icon name="checklist" className="text-primary text-base" /> Generated Videos ({videoUrls.length})</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {videoUrls.map((url, i) => (
                  <div key={i} className="glass-card rounded-lg overflow-hidden border-surface-border">
                    <video src={url} controls className="w-full aspect-video object-contain bg-black" />
                    <div className="p-2 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-on-surface-variant">Video {i + 1}</span>
                      <a href={url} download className="text-primary text-[10px] flex items-center gap-1 hover:underline"><Icon name="download" className="text-xs" /> DL</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      {showCreditModal && (
        <InsufficientCreditsModal
          needed={neededCredits}
          available={credits}
          onClose={() => setShowCreditModal(false)}
        />
      )}
      </SidebarProvider>
    </div>
  );
}

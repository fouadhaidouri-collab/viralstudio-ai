"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import Sidebar from "../components/Sidebar";
import ProfileDropdown from "../components/ProfileDropdown";
import { SidebarProvider, useSidebar } from "../components/SidebarContext";
import InsufficientCreditsModal from "../components/InsufficientCreditsModal";

const USD_TO_CREDIT = 1000 / 29;
const BASE_DURATION_SEC = 5;
const secFromDuration = (d) => {
  const n = parseInt(d, 10);
  return isNaN(n) ? BASE_DURATION_SEC : n;
};
const durationMultiplier = (d) => secFromDuration(d) / BASE_DURATION_SEC;
const resolutionMultiplier = (r) => r === "1080p" ? 1.5 : 1;

const aiModels = [
  { label: "Veo 3.1 Fast", icon: "videocam", color: "#7c3aed", fallbackPrice: 0.08 },
  { label: "Grok Imagine Video", icon: "psychology", color: "#06b6d4", fallbackPrice: 0.10 },
  { label: "SeeDance 1.5", icon: "directions_run", color: "#f59e0b", fallbackPrice: 0.10 },
  { label: "SeeDance 2.0", icon: "directions_run", color: "#f97316", fallbackPrice: 0.10 },
  { label: "Kling 3.0", icon: "smart_display", color: "#ef4444", fallbackPrice: 0.15 },
  { label: "Runway Gen 4.5", icon: "run_circle", color: "#10b981", fallbackPrice: 0.25 },
  { label: "Luma Ray 2", icon: "flare", color: "#8b5cf6", fallbackPrice: 0.20 },
  { label: "Pika 2.1", icon: "pets", color: "#ec4899", fallbackPrice: 0.20 },
  { label: "Happy Horse", icon: "emoji_nature", color: "#14b8a6", fallbackPrice: 0.28 },
];

const aspectRatios = [
  { label: "Cinematic 16:9", icon: "crop_16_9" },
  { label: "Instagram 9:16", icon: "crop_portrait" },
  { label: "Square 1:1", icon: "crop_square" },
  { label: "Portrait 4:5", icon: "crop_7_5" },
];

const resolutions = ["720p", "1080p"];
const durations = ["5 seconds", "8 seconds", "10 seconds", "15 seconds"];

const FAL_MODEL_IDS = {
  "Veo 3.1 Fast": "fal-ai/veo3.1/fast",
  "Grok Imagine Video": "xai/grok-imagine-video/text-to-video",
  "SeeDance 1.5": "bytedance/seedance/v1.5/pro/text-to-video",
  "SeeDance 2.0": "bytedance/seedance-2.0/text-to-video",
  "Kling 3.0": "kling-video/v3/pro/text-to-video",
  "Runway Gen 4.5": "fal-ai/runway-gen-3",
  "Luma Ray 2": "fal-ai/luma-dream-machine",
  "Pika 2.1": "fal-ai/pika",
  "Happy Horse": "alibaba/happy-horse/text-to-video",
};

const TEMPLATE_VIDEOS = Array.from({ length: 11 }, (_, i) => `/templates/template${i + 1}.mp4`);

function ModelDropdown({ label, value, options, onChange, compact, pricingMap, duration, resolution }) {
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
      setPos({ top: r.bottom + 7, left: Math.max(10, r.left) });
    }
    setOpen(!open);
  };

  return (
    <div ref={ref} className="w-full">
      {!compact && <div className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1.5 font-medium" style={{ fontFamily: 'Geist, sans-serif' }}>{label}</div>}
      <button
        ref={btnRef}
        onClick={toggle}
        className={`w-full flex items-center justify-between gap-1.5 bg-surface-container-lowest border border-surface-border rounded-xl hover:border-primary/50 transition-all ${compact ? 'px-2 py-1' : 'px-3.5 py-3 text-sm'}`}
      >
        <span className="flex items-center gap-1.5 truncate min-w-0">
          <span className="material-symbols-outlined text-sm flex-shrink-0" style={{ color: value.color }}>{value.icon}</span>
          <span className="font-semibold text-white text-[11px] truncate">{value.label}</span>
          {(() => {
            const p = pricingMap?.[value.label];
            const price = p ? p.unitPrice : value.fallbackPrice;
            return price ? <span className="text-[9px] text-yellow-400 font-medium shrink-0">{(price * durationMultiplier(duration) * resolutionMultiplier(resolution) * USD_TO_CREDIT).toFixed(0)}</span> : null;
          })()}
        </span>
        <span className={`material-symbols-outlined text-[10px] text-on-surface-variant shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>expand_more</span>
      </button>
      {open && typeof document !== "undefined" && createPortal(
          <div
            className="fixed animate-dropdown-open z-[99999]"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ top: pos.top, left: pos.left, width: "260px", borderRadius: "18px", background: "#0e0e0e", border: "1px solid rgba(139,92,246,0.15)", boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.06)" }}
        >
            <div className="py-2" style={{ maxHeight: "342px", overflowY: "auto" }}>
            {options.map((opt) => {
              const selected = opt.label === value.label;
              return (
                <button
                  key={opt.label}
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-5 transition-all duration-150"
                  style={{ paddingTop: "10px", paddingBottom: "10px", background: selected ? "rgba(139,92,246,0.1)" : "transparent" }}
                  onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = "transparent"; }}
                >
                  <span className="material-symbols-outlined text-base flex-shrink-0" style={{ color: opt.color }}>{opt.icon}</span>
                  <span className="text-xs font-semibold" style={{ color: selected ? "#a78bfa" : "#ffffff" }}>{opt.label}</span>
                  {(() => {
                    const p = pricingMap?.[opt.label];
                    const price = p ? p.unitPrice : opt.fallbackPrice;
                    const unit = p ? p.unit : "video";
                    return price ? (
                      <span className="text-[9px] text-yellow-400 shrink-0 whitespace-nowrap font-medium">{(price * USD_TO_CREDIT).toFixed(0)}</span>
                    ) : null;
                  })()}
                  {selected && <span className="material-symbols-outlined text-xs ml-auto text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>}
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
      {!compact && <div className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1.5 font-medium" style={{ fontFamily: 'Geist, sans-serif' }}>{label}</div>}
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 bg-surface-container-lowest border border-surface-border rounded-lg hover:border-primary/50 transition-colors ${compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-2.5 text-sm'}`}
      >
        <span className="truncate flex items-center gap-1.5">
          {(() => {
            const match = options.find(o => (typeof o === "string" ? o : o.label) === value);
            if (match && typeof match !== "string") {
              return <><span className="material-symbols-outlined text-sm" style={{color: match.color || "#d2bbff"}}>{match.icon}</span>{value}</>;
            }
            return value;
          })()}
        </span>
        <span className={`material-symbols-outlined text-sm text-on-surface-variant shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>expand_more</span>
      </button>
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-surface-container border border-surface-border rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto py-1">
          {options.map((opt) => (
            <button
              key={typeof opt === "string" ? opt : opt.label}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-container-high transition-colors flex items-center gap-2 ${value === (typeof opt === "string" ? opt : opt.label) ? "text-primary bg-primary/5" : "text-on-surface"}`}
            >
              {typeof opt !== "string" && <span className="material-symbols-outlined text-base" style={{color: opt.color || "#d2bbff"}}>{opt.icon}</span>}
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
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(aiModels[0]);
  const [aspectRatio, setAspectRatio] = useState(aspectRatios[0]);
  const [resolution, setResolution] = useState(resolutions[0]);
  const [duration, setDuration] = useState(durations[0]);
  const [videoCount, setVideoCount] = useState(1);
  const [images, setImages] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [videoUrls, setVideoUrls] = useState([]);
  const [videoError, setVideoError] = useState(null);
  const [pricing, setPricing] = useState({});
  const [credits, setCredits] = useState(0);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [neededCredits, setNeededCredits] = useState(0);
  const fileInputRef = useRef();
  const bgIdxRef = useRef(0);
  const [bgIdxA, setBgIdxA] = useState(0);
  const [bgIdxB, setBgIdxB] = useState(-1);
  const { setMobileOpen } = useSidebar();

  useEffect(() => {
    const interval = setInterval(() => {
      bgIdxRef.current = (bgIdxRef.current + 1) % TEMPLATE_VIDEOS.length;
      setBgIdxA(bgIdxRef.current);
      setBgIdxB((bgIdxRef.current - 1 + TEMPLATE_VIDEOS.length) % TEMPLATE_VIDEOS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("prompt");
    if (p) setPrompt(p);
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      const ids = Object.values(FAL_MODEL_IDS).join(",");
      fetch(`/api/model-pricing?endpoint_ids=${ids}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((data) => {
          if (data.prices) {
            const m = {};
            for (const [label, eid] of Object.entries(FAL_MODEL_IDS)) {
              if (data.prices[eid]) m[label] = data.prices[eid];
            }
            setPricing(m);
          }
        })
        .catch(() => {});
    }, 1500);
    return () => { ctrl.abort(); clearTimeout(timer); };
  }, []);

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
    const modelId = FAL_MODEL_IDS[model.label];
    if (!modelId) throw new Error(`Unknown model: ${model.label}`);

    const subRes = await fetch("/api/generate-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, modelId, aspectRatio: aspectRatio.label }),
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

    const p = pricing?.[model.label];
    const unitPrice = p ? p.unitPrice : model.fallbackPrice;
    if (unitPrice) {
      const totalCost = unitPrice * videoCount * durationMultiplier(duration) * resolutionMultiplier(resolution) * USD_TO_CREDIT;
      if (credits < totalCost) {
        setNeededCredits(Math.ceil(totalCost));
        setShowCreditModal(true);
        return;
      }
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
    <div className="h-screen bg-background">
      <SidebarProvider>
      <div className="h-screen flex">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {TEMPLATE_VIDEOS.map((src, i) => {
          if (i !== bgIdxA && i !== bgIdxB) return null;
          return (
            <video
              key={src}
              src={src}
              muted autoPlay loop playsInline
              className={`absolute inset-0 w-full h-full object-fill transition-opacity duration-1000 ${
                i === bgIdxA ? "opacity-70" : "opacity-0"
              }`}
            />
          );
        })}
        <div className="absolute inset-0 bg-gradient-to-r from-background/20 via-background/10 to-background/30"></div>
      </div>
      <header className="shrink-0 w-full h-14 md:h-16 bg-surface/70 backdrop-blur-xl border-b border-surface-border/50 z-10 flex items-center justify-between md:justify-end px-4 md:px-8 relative" style={{ boxShadow: '0 1px 20px rgba(0,0,0,0.3)' }}>
        <button onClick={() => setMobileOpen(true)} className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-low border border-surface-border/50 hover:bg-surface-container-high transition-all active:scale-90">
          <span className="material-symbols-outlined text-white text-xl">menu</span>
        </button>
        <div className="flex items-center gap-3 md:gap-6">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low border border-surface-border/60 rounded-xl hover:border-yellow-400/30 transition-all duration-200">
            <span className="material-symbols-outlined text-sm text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            <span className="text-sm font-bold text-yellow-400">0</span>
            <button onClick={() => router.push("/pricing")} className="ml-1 w-5 h-5 flex items-center justify-center rounded-full bg-yellow-400/15 hover:bg-yellow-400/25 transition-all duration-200 hover:scale-110 active:scale-95">
              <span className="material-symbols-outlined text-[10px] text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
            </button>
          </div>
          <div className="h-8 w-px bg-surface-border"></div>
          <ProfileDropdown />
        </div>
      </header>
      <main className="flex-1 overflow-y-auto smooth-scroll relative z-10">
        <div className="relative z-10 h-full p-3 md:p-5 lg:pl-6 lg:pr-0 flex flex-col xl:grid xl:grid-cols-[432px_1fr] gap-3 md:gap-4 xl:gap-5 overflow-y-auto smooth-scroll">
          {/* LEFT: Composer */}
          <div className="flex flex-col flex-1">
            {/* Single card — textarea fills, everything else at bottom */}
            <div className="glass-card rounded-xl p-4 lg:p-5 border border-white/5 flex-1 flex flex-col gap-0 card-glow" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full flex-1 bg-surface-container-lowest border border-surface-border rounded-xl p-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none transition-all placeholder:text-on-surface-variant/40"
                placeholder="Describe the video you want to generate..."
              ></textarea>

              <div className="flex flex-wrap gap-2 mt-4 shrink-0">
                <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-1.5 px-3.5 py-2 bg-surface-container-low border border-surface-border/60 rounded-xl text-xs font-medium hover:bg-surface-container-high hover:border-primary/30 transition-all duration-200 active:scale-95" style={{ fontFamily: 'Geist, sans-serif' }}>
                  <span className="material-symbols-outlined text-base">image</span> Add image(s)
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              </div>

              {images.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4 shrink-0">
                  {images.map((img, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-surface-border group">
                      <img src={img} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                      <button onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-xs text-white">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-auto pt-3 shrink-0 space-y-2">
                <ModelDropdown label="AI Model" value={model} options={aiModels} onChange={setModel} compact pricingMap={pricing} duration={duration} resolution={resolution} />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Dropdown label="Aspect Ratio" value={aspectRatio.label} options={aspectRatios} onChange={(v) => setAspectRatio(v)} compact />
                  <Dropdown label="Resolution" value={resolution} options={resolutions} onChange={setResolution} compact />
                  <Dropdown label="Duration" value={duration} options={durations} onChange={setDuration} compact />
                  <Dropdown label="Quantity" value={String(videoCount)} options={["1", "2", "3", "4", "5"]} onChange={(v) => setVideoCount(Number(v))} compact />
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={generating || !prompt.trim()}
                  className="w-full primary-gradient text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-primary/25 flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.97] hover:translate-y-[-1px] disabled:opacity-60 disabled:cursor-not-allowed text-xs"
                  style={{ fontFamily: 'Geist, sans-serif' }}
                >
                  {generating ? (
                    <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Generating...</>
                  ) : (
                    <><span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_videocam</span> Generate Video {(() => {
                      const p = pricing?.[model.label];
                      const price = p ? p.unitPrice : model.fallbackPrice;
                      return price ? <span className="text-yellow-300/90">({(price * videoCount * durationMultiplier(duration) * resolutionMultiplier(resolution) * USD_TO_CREDIT).toFixed(0)} credits)</span> : null;
                    })()}</>
                )}
                </button>

              </div>
            </div>
          </div>

          {/* Generated Videos List */}
          {videoUrls.length > 0 && (
            <div className="xl:col-span-2 glass-card rounded-xl p-4 border border-white/5 card-glow" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2"><span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>checklist</span> Generated Videos ({videoUrls.length})</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {videoUrls.map((url, i) => (
                  <div key={i} className="glass-card rounded-lg overflow-hidden border-surface-border">
                    <video src={url} controls className="w-full aspect-video object-contain bg-black" />
                    <div className="p-2 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-on-surface-variant">Video {i + 1}</span>
                      <a href={url} download className="text-primary text-[10px] flex items-center gap-1 hover:underline"><span className="material-symbols-outlined text-xs">download</span> DL</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RIGHT: Preview */}
          <div className="hidden xl:flex flex-col gap-3 min-w-0">
            <div className="glass-card rounded-2xl relative bg-black flex-1 flex flex-col border border-white/5 card-glow" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
              {videoUrls.length > 0 ? (
                <div className="p-4 grid grid-cols-2 gap-3">
                  {videoUrls.map((url, i) => (
                    <video key={i} src={url} controls className="w-full rounded-lg object-contain bg-black/50" style={{ maxHeight: '260px' }} />
                  ))}
                </div>
              ) : generating ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="relative mb-5 mx-auto w-fit">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center animate-pulse mx-auto">
                      <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>hourglass_top</span>
                    </div>
                    <div className="absolute inset-0 border-2 border-primary/30 rounded-full animate-ping"></div>
                  </div>
                  <h3 className="text-xl font-semibold mb-1 text-white" style={{ fontFamily: 'Geist, sans-serif' }}>Generating {videoCount > 1 ? `(${videoUrls.length}/${videoCount})` : ''}...</h3>
                  <p className="text-sm text-on-surface-variant">This usually takes 30–90 seconds per video</p>
                </div>
              ) : videoError ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
                    <span className="material-symbols-outlined text-red-400 text-3xl">error_outline</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-1 text-white" style={{ fontFamily: 'Geist, sans-serif' }}>Generation Failed</h3>
                  <p className="text-sm text-red-400/80">{videoError}</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(168,85,247,0.08) 0%, transparent 70%)' }} />
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center animate-pulse mb-4">
                      <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-surface-container-low border border-surface-border/60 rounded-xl text-sm font-medium hover:bg-surface-container-high hover:border-primary/30 transition-all duration-200 active:scale-[0.97]" style={{ fontFamily: 'Geist, sans-serif' }}>
                <span className="material-symbols-outlined text-base">download</span> Download
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-surface-container-low border border-surface-border/60 rounded-xl text-sm font-medium hover:bg-surface-container-high hover:border-primary/30 transition-all duration-200 active:scale-[0.97]" style={{ fontFamily: 'Geist, sans-serif' }}>
                <span className="material-symbols-outlined text-base">share</span> Share
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-surface-container-low border border-surface-border/60 rounded-xl text-sm font-medium hover:bg-surface-container-high hover:border-primary/30 transition-all duration-200 active:scale-[0.97]" style={{ fontFamily: 'Geist, sans-serif' }}>
                <span className="material-symbols-outlined text-base">replay</span> Regenerate
              </button>
            </div>

          </div>
        </div>
      </main>
        </div>
      </div>
      </SidebarProvider>
      {showCreditModal && <InsufficientCreditsModal needed={neededCredits} current={credits} onClose={() => setShowCreditModal(false)} />}
      <style jsx global>{`
        @keyframes dropdown-open {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-dropdown-open {
          animation: dropdown-open 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}

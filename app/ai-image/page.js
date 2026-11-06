"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import ProfileDropdown from "../components/ProfileDropdown";
import { SidebarProvider } from "../components/SidebarContext";
import MenuButton from "../components/MenuButton";
import { useAuth } from "../lib/AuthContext";
import InsufficientCreditsModal from "../components/InsufficientCreditsModal";
import ModelSelector from "../components/ModelSelector";
import Icon from "../components/Icon";
import useScrollActivated from "../lib/useScrollActivated";
import useLiveCredits from "../lib/useLiveCredits";

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
  imageModels, imageAspectRatios, imageResolutions, imageModelCapabilities
} from "../lib/capabilities";

const TEMPLATE_VIDEOS = Array.from({ length: 11 }, (_, i) => `/templates/template${i + 1}.mp4`);

function calcImageCredits(model, aspectRatio, resolution, quantity, settings) {
  const base = model.unitPrice ?? 0.05;
  const resMultiplier = resolution === "4k" ? 2.5 : resolution === "2k" ? 1.5 : 1;
  const markup = model.markup ?? settings?.default_markup_multiplier ?? 1;
  const usdValue = settings?.credit_usd_value || 0.01;
  const minCredits = settings?.minimum_generation_credits || 1;
  const credits = Math.ceil((base * resMultiplier * markup) / usdValue);
  return Math.max(minCredits, credits) * quantity;
}

const imageProviderMeta = {
  OpenAI: { icon: "psychology", color: "#10b981" },
  Google: { icon: "videocam", color: "#4285F4" },
  ByteDance: { icon: "auto_awesome", color: "#ec4899" },
  "Black Forest Labs": { icon: "auto_awesome", color: "#22d3ee" },
  xAI: { icon: "psychology", color: "#06b6d4" },
};

function buildImageProviders(models, creditSettings) {
  const cheapest = models.slice().sort((a, b) => {
    const pa = a.unitPrice ?? 0.05;
    const pb = b.unitPrice ?? 0.05;
    return pa - pb;
  })[0];
  const groups = {};
  for (const m of models) {
    if (!groups[m.provider]) groups[m.provider] = [];
    let badge = null;
    let badgeColor = null;
    if (m.label === cheapest.label) { badge = "Cheapest"; badgeColor = "#facc15"; }
    else if (models.indexOf(m) >= models.length - 2) { badge = "New"; badgeColor = "#8b5cf6"; }
    else { badge = "Best Quality"; badgeColor = "#f97316"; }
    groups[m.provider].push({ ...m, badge, badgeColor });
  }
  return Object.entries(groups).map(([name, mods]) => ({
    name,
    icon: imageProviderMeta[name]?.icon || "smart_toy",
    color: imageProviderMeta[name]?.color || "#a855f7",
    models: mods,
  }));
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
      <div className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1.5 font-medium">{label}</div>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 bg-surface-container-lowest border border-surface-border rounded-lg hover:border-primary/50 transition-colors ${compact ? 'px-2.5 py-2 text-xs' : 'px-3 py-2.5 text-sm'}`}
      >
        <span className="truncate flex items-center gap-1.5">
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
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-surface-container border border-surface-border rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto py-1">
          {options.map((opt) => (
            <button
              key={typeof opt === "string" ? opt : opt.label}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-container-high transition-colors flex items-center gap-2 ${value === (typeof opt === "string" ? opt : opt.label) ? "text-primary bg-primary/5" : "text-on-surface"}`}
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

export default function AIImagePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [selectedModel, setSelectedModel] = useState(imageModels[0]);
  const [prompt, setPrompt] = useState("");
  const [modelConfigs, setModelConfigs] = useState({});
  const currentConfig = modelConfigs[selectedModel.label] || { aspectRatio: imageAspectRatios[0], resolution: "1k" };
  const updateConfig = (key, value) => {
    setModelConfigs(prev => ({ ...prev, [selectedModel.label]: { ...(prev[selectedModel.label] || {}), [key]: value } }));
  };
  const [imageCount, setImageCount] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [imageUrls, setImageUrls] = useState([]);
  const [imageError, setImageError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const credits = useLiveCredits();
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [neededCredits, setNeededCredits] = useState(0);
  const [creditSettings, setCreditSettings] = useState({ credit_usd_value: 0.01, default_markup_multiplier: 2.0, minimum_generation_credits: 1 });
  const [bgVideoIdx, setBgVideoIdx] = useState(0);
  const scrollActivated = useScrollActivated();

  useEffect(() => {
    fetch("/api/pricing/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.credit_usd_value) setCreditSettings(data);
      })
      .catch(() => {});
  }, []);

  const caps = imageModelCapabilities[selectedModel.label] || imageModelCapabilities["GPT Image 2"];
  const availableAspectRatios = imageAspectRatios.filter(ar => caps.aspectRatios.includes(ar.label));
  const availableResolutions = imageResolutions.filter(r => caps.resolutions.includes(r));

  useEffect(() => {
    const c = imageModelCapabilities[selectedModel.label];
    if (!c) return;
    const existing = modelConfigs[selectedModel.label];
    if (!existing) {
      const defaults = { aspectRatio: imageAspectRatios[0], resolution: "1k" };
      if (c.aspectRatios.length > 0) {
        const found = imageAspectRatios.find(ar => ar.label === c.aspectRatios[0]);
        if (found) defaults.aspectRatio = found;
      }
      if (c.resolutions.length > 0) defaults.resolution = c.resolutions[0];
      setModelConfigs(prev => ({ ...prev, [selectedModel.label]: defaults }));
      return;
    }
    let changed = false;
    const updated = { ...existing };
    if (c.aspectRatios.length > 0 && !c.aspectRatios.includes(existing.aspectRatio?.label)) {
      const found = imageAspectRatios.find(ar => ar.label === c.aspectRatios[0]);
      if (found) { updated.aspectRatio = found; changed = true; }
    }
    if (c.resolutions.length > 0 && !c.resolutions.includes(existing.resolution)) {
      updated.resolution = c.resolutions[0]; changed = true;
    }
    if (changed) setModelConfigs(prev => ({ ...prev, [selectedModel.label]: updated }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModel.label]);

  useEffect(() => {
    if (!scrollActivated) return;
    const interval = setInterval(() => {
      setBgVideoIdx((prev) => (prev + 1) % TEMPLATE_VIDEOS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [scrollActivated]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    const needed = calcImageCredits(selectedModel, currentConfig.aspectRatio.label, currentConfig.resolution, imageCount, creditSettings);
    if (needed != null && credits < needed) { setNeededCredits(needed); setShowCreditModal(true); return; }
    setGenerating(true);
    setImageUrls([]);
    setImageError(null);

    try {
      const results = [];
      for (let i = 0; i < imageCount; i++) {
        const modelId = selectedModel.model_id;
        if (!modelId) throw new Error(`Unknown model: ${selectedModel.label}`);

        const subRes = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, modelId, aspectRatio: currentConfig.aspectRatio.label, resolution: currentConfig.resolution, quantity: 1 }),
        });

        if (!subRes.ok) {
          const err = await subRes.json();
          throw new Error(err.error || "Failed to submit");
        }

        const { requestId } = await subRes.json();

        let done = false;
        while (!done) {
          await new Promise((r) => setTimeout(r, 2000));
          const statusRes = await fetch(`/api/generate-image?requestId=${requestId}&modelId=${modelId}`);

          if (!statusRes.ok) {
            const err = await statusRes.json();
            throw new Error(err.error || "Status check failed");
          }

          const statusData = await statusRes.json();

          if (statusData.status === "COMPLETED") {
            if (!statusData.imageUrl) throw new Error("The image provider returned an empty result. Please try again.");
            results.push(statusData.imageUrl);
            setImageUrls([...results]);
            done = true;
            fetch("/api/generations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: "Image Lab", provider: selectedModel.provider, model: selectedModel.model_id, prompt, output_url: statusData.imageUrl, thumbnail_url: statusData.imageUrl, credits_used: calcImageCredits(selectedModel, currentConfig.aspectRatio.label, currentConfig.resolution, 1, creditSettings) }),
            }).then((r) => r.ok ? r.json() : null).then((saved) => {
              if (saved?.id) setImageHistory((prev) => [{ id: saved.id, type: "Image Lab", provider: selectedModel.provider, model: selectedModel.model_id, prompt, output_url: statusData.imageUrl, thumbnail_url: statusData.imageUrl, credits_used: calcImageCredits(selectedModel, currentConfig.aspectRatio.label, currentConfig.resolution, 1, creditSettings), created_at: new Date().toISOString() }, ...prev]);
            }).catch(() => {});
          } else if (statusData.status === "FAILED" || statusData.status === "CANCELLED") {
            throw new Error("The AI generation failed on the provider. No credits were charged.");
          }
        }
      }
    } catch (err) {
      setImageError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden no-x-scroll">
      <SidebarProvider>
      <Sidebar />
      <div className="fixed inset-0 overflow-hidden z-0">
        {!scrollActivated && (
          <img
            src={TEMPLATE_VIDEOS[0].replace(".mp4", ".jpg")}
            alt=""
            fetchPriority="high"
            className="absolute inset-0 w-full h-full object-fill opacity-60"
          />
        )}
        {scrollActivated && (() => {
          const cur = bgVideoIdx % TEMPLATE_VIDEOS.length;
          const nxt = (cur + 1) % TEMPLATE_VIDEOS.length;
          return [cur, nxt].map((idx, pos) => (
            <video
              key={pos}
              src={TEMPLATE_VIDEOS[idx]}
              poster={TEMPLATE_VIDEOS[idx].replace(".mp4", ".jpg")}
              muted autoPlay loop playsInline
              preload={pos === 0 ? "auto" : "metadata"}
              className={`absolute inset-0 w-full h-full object-fill transition-opacity duration-1000 ${
                pos === 0 ? "opacity-60" : "opacity-0"
              }`}
            />
          ));
        })()}
        <div className="absolute inset-0 bg-gradient-to-r from-background/20 via-background/10 to-background/30"></div>
      </div>
      <header className="fixed top-0 right-0 w-full md:w-[calc(100%-16rem)] h-14 md:h-16 bg-surface/70 backdrop-blur-xl border-b border-surface-border/50 z-40 flex items-center justify-between md:justify-end px-4 md:px-8" style={{ boxShadow: '0 1px 20px rgba(0,0,0,0.3)' }}>
        <MenuButton />
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
      <main className="fixed top-14 md:top-16 right-0 bottom-0 w-full md:w-[calc(100%-16rem)] overflow-y-auto smooth-scroll">
        <div className="relative z-10 min-h-full p-4 md:p-5 lg:pl-6 lg:pr-6 flex flex-col xl:grid xl:grid-cols-[minmax(360px,420px)_minmax(0,1fr)] gap-4 xl:gap-5 max-w-[1800px] mx-auto">
          {/* LEFT: Composer */}
          <div className="flex flex-col flex-1">
            <div className="glass-card rounded-2xl p-4 lg:p-5 border border-white/10 flex-1 flex flex-col gap-0 card-glow shadow-2xl shadow-black/20" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
              
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full min-h-[150px] xl:flex-1 bg-[#09090d]/80 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-primary/60 focus:ring-1 focus:ring-primary/30 outline-none resize-none transition-all placeholder:text-white/30"
                placeholder="Describe the image you want to create. Be as detailed as possible for best results."
              ></textarea>

              <div className="mt-auto pt-3 shrink-0 space-y-2">
                <ModelSelector label="Image Model" providers={buildImageProviders(imageModels, creditSettings)} selectedModel={selectedModel} onSelect={setSelectedModel} calcCredits={(m) => calcImageCredits(m, currentConfig.aspectRatio.label, currentConfig.resolution, 1, creditSettings)} calcStartingCredits={(m) => calcImageCredits(m, m.options?.aspect_ratio?.[0] || currentConfig.aspectRatio.label, m.options?.resolution?.[0] || currentConfig.resolution, 1, creditSettings)} compact />

                <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-3"><div className="mb-2 flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-wider text-white/45">Image settings</span><span className="text-[10px] text-white/30">Model-compatible options</span></div><div className="grid grid-cols-3 gap-2">
                  <Dropdown label="Aspect Ratio" value={currentConfig.aspectRatio.label} options={availableAspectRatios} onChange={(v) => updateConfig("aspectRatio", v)} />
                  <Dropdown label="Resolution" value={currentConfig.resolution} options={availableResolutions} onChange={(v) => updateConfig("resolution", v)} />
                  <Dropdown label="Quantity" value={String(imageCount)} options={["1", "2", "3", "4", "5"]} onChange={(v) => setImageCount(Number(v))} />
                </div></div>

                <button
                  onClick={handleGenerate}
                  disabled={generating || !prompt.trim()}
                  className="w-full primary-gradient text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-primary/25 flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.99] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  style={{ fontFamily: 'Geist, sans-serif' }}
                >
                  {generating ? (
                    <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Generating...</>
                  ) : (
                    <><Icon name="auto_awesome" className="text-sm" /> Generate Image {(() => {
                      const c = calcImageCredits(selectedModel, currentConfig.aspectRatio.label, currentConfig.resolution, imageCount, creditSettings);
                      return <span className="text-yellow-300/90">({c} credit{c !== 1 ? "s" : ""})</span>;
                    })()}</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Preview */}
          <div className="flex flex-col glass-card rounded-2xl relative bg-black flex-1 border border-white/10 card-glow min-h-[420px] xl:min-h-0 shadow-2xl shadow-black/20" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
            
            {imageError && <div className="mx-4 mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.07] px-3 py-2.5 text-xs text-red-200">{imageError}</div>}
            {imageUrls.length > 0 ? (
              <>
                <div className="flex-1 p-4">
                  {selectedImageIndex !== null ? (
                    <div className="flex flex-col gap-3">
                      <button onClick={() => setSelectedImageIndex(null)} className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-white transition-colors">
                        <Icon name="arrow_back" className="text-sm" /> Back to all
                      </button>
                      <img src={imageUrls[selectedImageIndex]} alt="Selected" className="w-full max-h-[68vh] rounded-xl object-contain bg-black/30" />
                      <a href={imageUrls[selectedImageIndex]} download className="primary-gradient text-white text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5">
                        <Icon name="download" className="text-sm" /> Download
                      </a>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                          <Icon name="checklist" className="text-primary text-base" />
                          Generated ({imageUrls.length})
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-3">
                        {imageUrls.map((url, i) => (
                          <button key={i} onClick={() => setSelectedImageIndex(i)} className="aspect-square rounded-lg overflow-hidden border border-surface-border group relative hover:border-primary/50 transition-colors">
                            <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Icon name="visibility" className="text-white text-lg" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : generating ? (
              <div className="flex-1 flex flex-col items-center justify-center p-10">
                <svg className="animate-spin h-10 w-10 text-primary mb-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm font-semibold text-white">Generating your images...</p><p className="mt-1 text-xs text-white/40">Your results will appear here as soon as each image is ready.</p><div className="mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-white/10"><div className="h-full w-1/3 animate-pulse rounded-full bg-primary" /></div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-10">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                  <Icon name="auto_awesome" size={36} className="text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Ready to create</h3>
                <p className="text-sm text-on-surface-variant/70 text-center max-w-xs">Your generated images will appear here. Select any result to preview or download it.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      </SidebarProvider>
      {showCreditModal && <InsufficientCreditsModal needed={neededCredits} available={credits} onClose={() => setShowCreditModal(false)} />}
    </div>
  );
}

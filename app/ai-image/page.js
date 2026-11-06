"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import ProfileDropdown from "../components/ProfileDropdown";
import { SidebarProvider } from "../components/SidebarContext";
import MenuButton from "../components/MenuButton";
import { useAuth } from "../lib/AuthContext";
import InsufficientCreditsModal from "../components/InsufficientCreditsModal";
import ImageModelCatalog from "../components/ImageModelCatalog";
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
  const [settingsOpen, setSettingsOpen] = useState(false);
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
    setSelectedImageIndex(0);
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
              
              <div className="mb-3 flex shrink-0 items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Icon name="image" className="text-base" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-white">AI Image</h1>
                </div>
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[200px] w-full resize-none rounded-xl border border-white/10 bg-[#050507] p-4 text-sm text-white outline-none transition-all placeholder:text-white/40 focus:border-primary focus:ring-1 focus:ring-primary xl:flex-1"
                placeholder="Describe the image you want to create. Be as detailed as possible for best results."
              ></textarea>

              <div className="mt-auto pt-3 shrink-0 space-y-2">
                <ImageModelCatalog models={imageModels} selectedModel={selectedModel} onSelect={setSelectedModel} calcCredits={(m) => calcImageCredits(m, currentConfig.aspectRatio.label, currentConfig.resolution, 1, creditSettings)} calcStartingCredits={(m) => calcImageCredits(m, m.options?.aspect_ratio?.[0] || currentConfig.aspectRatio.label, m.options?.resolution?.[0] || currentConfig.resolution, 1, creditSettings)} />

                <button type="button" onClick={() => setSettingsOpen(true)} disabled={generating}
                  aria-label={`Image Settings: ${currentConfig.aspectRatio?.label || "Aspect ratio"}, ${currentConfig.resolution || "1k"}, ${imageCount} images`}
                  className="group flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.025] px-4 py-3.5 text-left shadow-sm transition-all duration-200 hover:border-primary/40 hover:from-primary/[0.1] hover:to-primary/[0.03] active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-60">
                  <span className="min-w-0 flex-1"><span className="block text-xs font-semibold tracking-wide text-white/75">Image Settings</span>
                    <span className="mt-1.5 block whitespace-normal break-words text-xs font-semibold leading-relaxed text-white">{currentConfig.aspectRatio?.label || "Aspect ratio"} · {currentConfig.resolution?.toUpperCase() || "1K"} · {imageCount} {imageCount === 1 ? "image" : "images"}</span>
                  </span>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/65 transition-all duration-200 group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary"><Icon name="expand_more" className="text-base" /></span>
                </button>

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
          <div className="flex min-w-0 flex-col glass-card rounded-2xl relative bg-black flex-1 border border-white/10 card-glow min-h-[420px] xl:min-h-[calc(100vh-7.5rem)] overflow-hidden shadow-2xl shadow-black/20" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
            
            {imageError && <div className="mx-4 mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.07] px-3 py-2.5 text-xs text-red-200">{imageError}</div>}
            {imageUrls.length > 0 ? (
              <div className="relative flex min-h-[420px] flex-1 flex-col overflow-hidden bg-black">
                <div className="relative min-h-0 flex-1">
                  <img
                    src={imageUrls[selectedImageIndex ?? 0] || imageUrls[0]}
                    alt={`Generated image ${(selectedImageIndex ?? 0) + 1}`}
                    className="absolute inset-0 h-full w-full bg-black object-contain"
                  />
                  <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-black/65 px-3 py-1.5 text-[11px] font-medium text-white/85 backdrop-blur">
                      {imageUrls.length} {imageUrls.length === 1 ? "image" : "images"}
                    </span>
                    <a
                      href={imageUrls[selectedImageIndex ?? 0] || imageUrls[0]}
                      download
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-black/65 text-white backdrop-blur transition hover:bg-black/85"
                      aria-label="Download selected image"
                    >
                      <Icon name="download" className="text-sm" />
                    </a>
                  </div>
                </div>
                {imageUrls.length > 1 && (
                  <div className="z-10 flex shrink-0 items-center gap-2 overflow-x-auto border-t border-white/10 bg-black/80 p-3">
                    {imageUrls.map((url, i) => (
                      <button
                        key={url + i}
                        type="button"
                        onClick={() => setSelectedImageIndex(i)}
                        aria-label={`Show image ${i + 1}`}
                        aria-pressed={(selectedImageIndex ?? 0) === i}
                        className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border transition sm:h-20 sm:w-24 ${(selectedImageIndex ?? 0) === i ? "border-primary ring-2 ring-primary/30" : "border-white/10 opacity-70 hover:opacity-100"}`}
                      >
                        <img src={url} alt={`Image ${i + 1}`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : generating ? (
              <div className="relative flex min-h-[420px] flex-1 flex-col items-center justify-center overflow-hidden p-10">
                <svg className="animate-spin h-10 w-10 text-primary mb-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm font-semibold text-white">Generating your images...</p><p className="mt-1 text-xs text-white/40">Your results will appear here as soon as each image is ready.</p><div className="mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-white/10"><div className="h-full w-1/3 animate-pulse rounded-full bg-primary" /></div>
              </div>
            ) : (
              <div className="relative flex min-h-[420px] flex-1 flex-col items-center justify-center overflow-hidden p-10">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                  <Icon name="auto_awesome" size={36} className="text-primary" />
                </div>
                <p className="text-sm text-on-surface-variant/70 text-center max-w-xs">Your generated images will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      {settingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSettingsOpen(false); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="image-settings-title" className="max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/10 bg-[#15131d] p-3 shadow-[0_30px_100px_rgba(0,0,0,0.65)] sm:max-h-[calc(100dvh-2rem)] sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div><div className="mb-1.5 flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg border border-indigo-400/25 bg-gradient-to-br from-violet-500/15 to-indigo-500/10 text-indigo-200"><Icon name="tune" className="text-base" /></span><h2 id="image-settings-title" className="text-base font-semibold tracking-tight text-white">Image Settings</h2></div><p className="text-xs text-white/45">Customize your image output before generating.</p></div>
              <button type="button" onClick={() => setSettingsOpen(false)} aria-label="Close settings" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/60 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"><Icon name="close" /></button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
              <section className="md:col-span-2">
                <div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-semibold text-white/80">Aspect Ratio</h3><span className="text-[10px] text-white/35">Choose your image format</span></div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                  {availableAspectRatios.map((ratio) => { const selected = currentConfig.aspectRatio?.label === ratio.label; return (
                    <button key={ratio.label} type="button" onClick={() => updateConfig("aspectRatio", ratio)} aria-pressed={selected}
                      className={`flex min-h-[58px] flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-2 transition-colors duration-100 ${selected ? "border-indigo-400/70 bg-gradient-to-br from-violet-500/25 to-indigo-500/15 text-white shadow-sm" : "border-white/[0.08] bg-white/[0.025] text-white/55 hover:border-white/20 hover:bg-white/[0.055] hover:text-white/85"}`}>
                      <AspectIcon label={ratio.label} size="text-base" /><span className="text-[10px] font-semibold leading-tight">{ratio.label}</span>
                    </button>
                  ); })}
                </div>
              </section>
              {availableResolutions.length > 0 && <section>
                <div className="mb-2.5 flex items-center justify-between"><h3 className="text-xs font-semibold text-white/80">Resolution</h3><span className="text-[10px] text-white/35">Output quality</span></div>
                <div className="grid grid-cols-3 gap-2">
                  {availableResolutions.map((resolution) => { const selected = currentConfig.resolution === resolution; return (
                    <button key={resolution} type="button" onClick={() => updateConfig("resolution", resolution)} aria-pressed={selected}
                      className={`rounded-lg border px-3 py-2.5 text-xs font-semibold uppercase transition-colors duration-100 ${selected ? "border-indigo-400/70 bg-gradient-to-br from-violet-500/25 to-indigo-500/15 text-white shadow-sm" : "border-white/[0.08] bg-white/[0.025] text-white/55 hover:border-white/20 hover:bg-white/[0.055] hover:text-white/85"}`}>{resolution}</button>
                  ); })}
                </div>
              </section>}
              <section>
                <div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-semibold text-white/80">Quantity</h3><span className="text-[10px] text-white/35">Number of images</span></div>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((count) => { const selected = imageCount === count; return (
                    <button key={count} type="button" onClick={() => setImageCount(count)} aria-pressed={selected}
                      className={`flex h-10 items-center justify-center rounded-lg border text-sm font-semibold transition-colors duration-100 ${selected ? "border-indigo-400/70 bg-gradient-to-br from-violet-500/25 to-indigo-500/15 text-white shadow-sm" : "border-white/[0.08] bg-white/[0.025] text-white/55 hover:border-white/20 hover:bg-white/[0.055] hover:text-white/85"}`}>{count}</button>
                  ); })}
                </div>
              </section>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 border-t border-white/[0.07] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-white/45">Estimated total <span className="ml-1 font-semibold text-yellow-300">{calcImageCredits(selectedModel, currentConfig.aspectRatio.label, currentConfig.resolution, imageCount, creditSettings)} credits</span></div>
              <button type="button" onClick={() => setSettingsOpen(false)} className="primary-gradient rounded-xl px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-primary/20 transition hover:brightness-110">Done</button>
            </div>
          </div>
        </div>
      )}
      {showCreditModal && <InsufficientCreditsModal needed={neededCredits} available={credits} onClose={() => setShowCreditModal(false)} />}
      </SidebarProvider>
    </div>
  );
}

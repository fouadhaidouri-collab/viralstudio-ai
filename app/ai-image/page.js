"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import Sidebar from "../components/Sidebar";
import ProfileDropdown from "../components/ProfileDropdown";
import { SidebarProvider, useSidebar } from "../components/SidebarContext";
import InsufficientCreditsModal from "../components/InsufficientCreditsModal";
import Icon from "../components/Icon";

const TEMPLATE_VIDEOS = Array.from({ length: 11 }, (_, i) => `/templates/template${i + 1}.mp4`);

const imageModels = [
  { label: "GPT Image 2", icon: "🧠", color: "#10b981", credits: 5, endpoint: "fal-ai/flux-pro" },
  { label: "NanoBanana 2", icon: "🍌", color: "#f59e0b", credits: 3, endpoint: "fal-ai/recraft-20b" },
  { label: "NanoBanana Pro", icon: "👔", color: "#8b5cf6", credits: 4, endpoint: "fal-ai/ideogram/v2" },
  { label: "NanoBanana", icon: "☀️", color: "#ec4899", credits: 2, endpoint: "fal-ai/stable-diffusion-v3" },
  { label: "Imagen 4", icon: "✨", color: "#06b6d4", credits: 6, endpoint: "fal-ai/imagen-3" },
  { label: "Grok", icon: "🔥", color: "#ef4444", credits: 4, endpoint: "fal-ai/flux-dev" },
];

const aspectRatios = [
  { label: "Square 1:1", icon: "crop_square" },
  { label: "Portrait 4:5", icon: "crop_7_5" },
  { label: "Landscape 16:9", icon: "crop_16_9" },
  { label: "Portrait 9:16", icon: "crop_portrait" },
];

function ImageModelDropdown({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef(null);
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open && panelRef.current && btnRef.current) {
      const h = panelRef.current.offsetHeight;
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.top - h - 7, left: Math.max(10, r.left) });
    }
  }, [open]);

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.top - 300, left: Math.max(10, r.left) });
    }
    setOpen(!open);
  };

  return (
    <div ref={ref} className="w-full">
      <button
        ref={btnRef}
        onClick={toggle}
        className="w-full flex items-center justify-between gap-1.5 bg-surface-container-lowest border border-surface-border rounded-xl hover:border-primary/50 transition-all px-2 py-1"
      >
        <span className="flex items-center gap-1.5 truncate min-w-0">
          <span className="text-[11px] flex-shrink-0" role="img">{value.icon}</span>
          <span className="font-semibold text-white text-[11px] truncate">{value.label}</span>
          <span className="text-[9px] text-yellow-400 font-medium shrink-0">{value.credits} credits</span>
        </span>
        <Icon name="expand_more" className={`text-[10px] text-on-surface-variant shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={panelRef}
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
                  <span className="text-base flex-shrink-0" role="img">{opt.icon}</span>
                  <span className="text-xs font-semibold" style={{ color: selected ? "#a78bfa" : "#ffffff" }}>{opt.label}</span>
                  <span className="text-[9px] text-yellow-400 shrink-0 whitespace-nowrap font-medium ml-auto">{opt.credits} credits</span>
                  {selected && <Icon name="check" className="text-xs ml-1 text-primary" />}
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
      {!compact && <div className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1.5 font-medium">{label}</div>}
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 bg-surface-container-lowest border border-surface-border rounded-lg hover:border-primary/50 transition-colors ${compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-2.5 text-sm'}`}
      >
        <span className="truncate flex items-center gap-1.5">
          {(() => {
            const match = options.find(o => (typeof o === "string" ? o : o.label) === value);
            if (match && typeof match !== "string") {
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
              {typeof opt !== "string" && <Icon name={opt.icon} className="text-base" style={{color: opt.color || "#d2bbff"}} />}
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
  const [selectedModel, setSelectedModel] = useState(imageModels[3]);
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState(aspectRatios[0]);
  const [resolution, setResolution] = useState("720p");
  const [imageCount, setImageCount] = useState(1);
  const [images, setImages] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [imageUrls, setImageUrls] = useState([]);
  const [imageError, setImageError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [credits] = useState(0);
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

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setImages((prev) => [...prev, ev.target.result]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (i) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    const totalCost = selectedModel.credits * imageCount;
    if (credits < totalCost) { setNeededCredits(totalCost); setShowCreditModal(true); return; }
    setGenerating(true);
    setImageUrls([]);
    setImageError(null);

    try {
      const results = [];
      for (let i = 0; i < imageCount; i++) {
        const modelId = selectedModel.endpoint;
        if (!modelId) throw new Error(`Unknown model: ${selectedModel.label}`);

        const subRes = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, modelId, aspectRatio: aspectRatio.label, resolution }),
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
            results.push(statusData.imageUrl);
            setImageUrls([...results]);
            done = true;
          } else if (statusData.status === "FAILED" || statusData.status === "CANCELLED") {
            throw new Error(`Generation ${statusData.status.toLowerCase()}`);
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
        {TEMPLATE_VIDEOS.map((src, i) => (
          <video
            key={src}
            src={src}
            muted autoPlay loop playsInline
            className={`absolute inset-0 w-full h-full object-fill transition-opacity duration-1000 ${
              i === bgVideoIdx ? "opacity-60" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-background/20 via-background/10 to-background/30"></div>
      </div>
      <header className="fixed top-0 right-0 w-full md:w-[calc(100%-16rem)] h-14 md:h-16 bg-surface/70 backdrop-blur-xl border-b border-surface-border/50 z-40 flex items-center justify-between md:justify-end px-4 md:px-8" style={{ boxShadow: '0 1px 20px rgba(0,0,0,0.3)' }}>
        <button onClick={() => setMobileOpen(true)} className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-low border border-surface-border/50 hover:bg-surface-container-high transition-all active:scale-90">
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
        <div className="relative z-10 h-full p-5 lg:pl-6 lg:pr-0 flex flex-col xl:grid xl:grid-cols-[432px_1fr] gap-4 xl:gap-5 overflow-y-auto">
          {/* LEFT: Composer */}
          <div className="flex flex-col flex-1">
            <div className="glass-card rounded-xl p-4 lg:p-5 border border-white/5 flex-1 flex flex-col gap-0 card-glow" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full flex-1 bg-surface-container-lowest border border-surface-border rounded-xl p-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none transition-all placeholder:text-on-surface-variant/40"
                placeholder="Describe the image you want to create. Be as detailed as possible for best results."
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
                <div>
                  <div className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1.5 font-medium">Model</div>
                  <ImageModelDropdown value={selectedModel} options={imageModels} onChange={setSelectedModel} />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Dropdown label="Aspect Ratio" value={aspectRatio.label} options={aspectRatios} onChange={(v) => setAspectRatio(v)} compact />
                  <Dropdown label="Resolution" value={resolution} options={["720p", "1080p"]} onChange={setResolution} compact />
                  <Dropdown label="Quantity" value={String(imageCount)} options={["1", "2", "3", "4", "5"]} onChange={(v) => setImageCount(Number(v))} compact />
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
                    <><Icon name="auto_awesome" className="text-sm" /> Generate Image {(() => {
                      const total = selectedModel.credits * imageCount;
                      return <span className="text-yellow-300/90">({total} credits)</span>;
                    })()}</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Preview */}
          <div className="flex flex-col glass-card rounded-2xl relative bg-black flex-1 border border-white/5 card-glow min-h-[300px] xl:min-h-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
            {imageUrls.length > 0 ? (
              <>
                <div className="flex-1 p-4">
                  {selectedImageIndex !== null ? (
                    <div className="flex flex-col gap-3">
                      <button onClick={() => setSelectedImageIndex(null)} className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-white transition-colors">
                        <Icon name="arrow_back" className="text-sm" /> Back to all
                      </button>
                      <img src={imageUrls[selectedImageIndex]} alt="Selected" className="w-full rounded-xl object-cover" />
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
                      <div className="grid grid-cols-2 gap-2">
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
                <p className="text-sm text-on-surface-variant">Generating your images...</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-10">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                  <Icon name="auto_awesome" size={36} className="text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{selectedModel.label}</h3>
                <p className="text-sm text-on-surface-variant/70 text-center max-w-xs">Enter a prompt and generate to see results</p>
              </div>
            )}
          </div>
        </div>
      </main>
      </SidebarProvider>
      {showCreditModal && <InsufficientCreditsModal needed={neededCredits} current={credits} onClose={() => setShowCreditModal(false)} />}
    </div>
  );
}

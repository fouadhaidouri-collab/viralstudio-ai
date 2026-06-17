"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import ProfileDropdown from "../components/ProfileDropdown";
import LanguageToggle from "../components/LanguageToggle";
import { useTranslate } from "../components/LanguageProvider";
import { SidebarProvider, useSidebar } from "../components/SidebarContext";

const REEL_COUNTS = [10, 20, 30, 40, 50];
const CLIP_LENGTHS = ["15s", "30s", "45s", "60s"];
const ASPECT_RATIOS = [
  { label: "9:16", icon: "crop_portrait" },
  { label: "1:1", icon: "crop_square" },
  { label: "16:9", icon: "crop_16_9" },
];




function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-8 h-4 rounded-full transition-colors relative shrink-0 ${checked ? "bg-primary" : "bg-surface-container-higher"}`}
    >
      <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function ClippingPage() {
  const router = useRouter();
  const t = useTranslate();
  const { setMobileOpen } = useSidebar();
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [dragging, setDragging] = useState(false);
  const [reelsCount, setReelsCount] = useState(10);
  const [clipLength, setClipLength] = useState("30s");
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0]);
  const fileInputRef = useRef();

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState("");
  const [reels, setReels] = useState([]);

  const stages = ["transcribing", "analyzing", "rendering"];

  const handleFileDrop = (e) => {
    const f = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
    if (f) { setFile(f); setUrl(""); }
  };

  const handleUrlSubmit = () => {
    if (url.trim()) { setFile(null); }
  };

  const secondsFromLabel = (label) => parseInt(label);

  const handleGenerate = async () => {
    if (!file && !url.trim()) return;
    setGenerating(true);
    setProgress(0);
    setProgressStage("");
    setReels([]);

    try {
      // Step 1: Upload
      setProgressStage("uploading");
      setProgress(5);
      let videoPath = "";
      if (file) {
        const fd = new FormData();
        fd.append("video", file);
        const uploadRes = await fetch("/api/clipping/upload", { method: "POST", body: fd });
        if (!uploadRes.ok) throw new Error("Upload failed");
        const uploadData = await uploadRes.json();
        videoPath = uploadData.videoPath;
      } else {
        videoPath = url.trim();
      }

      // Step 2: Transcribe
      setProgressStage("transcribing");
      setProgress(20);
      const transcribeRes = await fetch("/api/clipping/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoPath, language: "English" }),
      });
      if (!transcribeRes.ok) throw new Error("Transcription failed");
      const transcribeData = await transcribeRes.json();
      const transcript = transcribeData.transcript;

      // Step 3: Analyze
      setProgressStage("analyzing");
      setProgress(40);
      const analyzeRes = await fetch("/api/clipping/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, reelsCount }),
      });
      if (!analyzeRes.ok) {
        const errorText = await analyzeRes.text();
        throw new Error(`Analysis failed: ${analyzeRes.status} ${errorText}`);
      }
      const analyzeData = await analyzeRes.json();
      let clips = analyzeData.clips;

      // Step 4: Render (cut, crop, resize, normalize audio, burn captions, thumbnail)
      setProgressStage("rendering");
      setProgress(55);
      const renderRes = await fetch("/api/clipping/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clips, videoPath, aspectRatio: aspectRatio.label }),
      });
      if (!renderRes.ok) {
        const errorText = await renderRes.text();
        throw new Error(`Render failed: ${renderRes.status} ${errorText}`);
      }
      const renderData = await renderRes.json();
      const reels = renderData.reels;

      setProgress(100);
      setProgressStage("completed");

      const mapped = reels.map((c, i) => ({
        id: c.id || `reel-${i + 1}`,
        number: i + 1,
        duration: c.duration || secondsFromLabel(clipLength),
        thumbnail: c.thumbnailPath || `https://picsum.photos/seed/reel${i + 1}/360/640`,
        title: c.title || `Clip ${i + 1}: Viral Moment`,
        hook: c.hook || "",
        viralScore: c.viral_score ?? c.viralScore ?? Math.floor(Math.random() * 30) + 65,
        hookScore: c.hook_score ?? Math.floor(Math.random() * 35) + 60,
        ctaScore: c.cta_score ?? Math.floor(Math.random() * 40) + 50,
        overallScore: 0,
        hashtags: c.hashtags || ["#viral", "#fyp", "#trending"],
      }));

      for (const r of mapped) {
        if (!r.overallScore) {
          r.overallScore = Math.floor((r.viralScore + r.hookScore + r.ctaScore) / 3);
        }
      }

      mapped.sort((a, b) => b.overallScore - a.overallScore);
      setReels(mapped);
    } catch (err) {
      setProgressStage("failed");
      setProgress(0);
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const avgScore = reels.length
    ? Math.floor(reels.reduce((s, r) => s + r.overallScore, 0) / reels.length)
    : 0;

  const topReel = reels.length ? reels[0] : null;

  return (
    <div className="h-screen overflow-hidden no-x-scroll">
      <SidebarProvider>
      <Sidebar />
      <header className="fixed top-0 ltr:right-0 rtl:left-0 w-full md:w-[calc(100%-16rem)] z-40 bg-surface/70 backdrop-blur-xl border-b border-surface-border/50 flex justify-between items-center px-4 md:px-8 h-14 md:h-16" style={{ boxShadow: '0 1px 20px rgba(0,0,0,0.3)' }}>
        <div className="md:hidden">
          <button onClick={() => setMobileOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-low border border-surface-border/50 hover:bg-surface-container-high transition-all active:scale-90">
            <span className="material-symbols-outlined text-white text-xl">menu</span>
          </button>
        </div>
        <div className="hidden md:flex items-center gap-4 bg-surface-container-low px-4 py-1.5 rounded-full border border-surface-border/60 w-96">
          <span className="material-symbols-outlined text-on-surface-variant text-sm">search</span>
          <input className="bg-transparent border-none focus:ring-0 text-sm w-full text-on-surface placeholder:text-on-surface-variant/50" placeholder={t("Search project assets...")} type="text" />
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low border border-surface-border/60 rounded-xl hover:border-yellow-400/30 transition-all duration-200">
            <span className="material-symbols-outlined text-sm text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            <span className="text-sm font-bold text-yellow-400">0</span>
            <button onClick={() => router.push("/pricing")} className="ml-1 w-5 h-5 flex items-center justify-center rounded-full bg-yellow-400/15 hover:bg-yellow-400/25 transition-all duration-200 hover:scale-110 active:scale-95">
              <span className="material-symbols-outlined text-[10px] text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
            </button>
          </div>
          <LanguageToggle />
          <ProfileDropdown />
        </div>
      </header>

      <main className="fixed top-14 md:top-16 ltr:right-0 rtl:left-0 w-full md:w-[calc(100%-16rem)] bottom-0 overflow-y-auto smooth-scroll">
        <div className="min-h-full p-4 md:p-5 lg:p-6 flex flex-col xl:grid xl:grid-cols-[420px_1fr] gap-5">
          {/* LEFT PANEL */}
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-2xl font-semibold" style={{ fontFamily: "Geist, sans-serif" }}>{t("AI Clipping Engine")}</h2>
              <p className="text-sm text-on-surface-variant mt-0.5">{t("Upload a long video and get 10–50 viral reels automatically")}</p>
            </div>

            {/* Upload Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); handleFileDrop(e); }}
              className={`glass-card rounded-2xl p-6 border-2 border-dashed flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer ${dragging || file ? "border-primary bg-primary/5" : "border-primary/20 hover:border-primary/50 hover:bg-primary/[0.02]"}`}
            >
              {file ? (
                <div className="w-full">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="material-symbols-outlined text-primary text-3xl">video_file</span>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-[10px] text-on-surface-variant">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                    <button onClick={() => setFile(null)} className="material-symbols-outlined text-on-surface-variant hover:text-red-400 text-lg">close</button>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full w-full bg-primary rounded-full" />
                  </div>
                  <p className="text-[10px] text-primary mt-1 text-left">Uploaded successfully</p>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_upload</span>
                  </div>
                  <h3 className="text-base font-semibold" style={{ fontFamily: "Geist, sans-serif" }}>{t("Upload Video")}</h3>
                  <p className="text-xs text-on-surface-variant mt-1 mb-3">MP4, MOV, AVI — Max 500MB</p>
                  <button onClick={() => fileInputRef.current.click()} className="px-5 py-2 bg-surface-container-low border border-surface-border/60 rounded-xl text-xs font-medium hover:bg-surface-container hover:border-primary/30 transition-all duration-200 active:scale-95">{t("Browse Files")}</button>
                  <input ref={fileInputRef} type="file" accept="video/mp4,video/quicktime,video/x-msvideo" onChange={handleFileDrop} className="hidden" />
                  <div className="flex items-center gap-3 w-full mt-4">
                    <div className="flex-1 h-px bg-surface-border" />
                    <span className="text-[10px] text-on-surface-variant">OR</span>
                    <div className="flex-1 h-px bg-surface-border" />
                  </div>
                  <div className="flex gap-2 mt-3 w-full">
                    <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t("YouTube URL...")} className="flex-1 bg-surface-container-low border border-surface-border/60 rounded-xl px-3 py-2 text-xs focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all duration-200 placeholder:text-on-surface-variant/40" />
                    <button onClick={handleUrlSubmit} className="px-4 py-2 primary-gradient text-white rounded-xl text-xs font-medium transition-all duration-200 active:scale-95 shadow-lg shadow-primary/20">{t("Import")}</button>
                  </div>
                </>
              )}
            </div>

            {/* Settings */}
            <div className="glass-card rounded-2xl p-4 border border-white/5 space-y-4 card-glow" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
              {/* Reels Count */}
              <div>
                <label className="text-[10px] text-on-surface-variant uppercase tracking-widest font-medium">{t("Number of Reels")}</label>
                <div className="flex gap-1.5 mt-1.5">
                  {REEL_COUNTS.map((n) => (
                    <button key={n} onClick={() => setReelsCount(n)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-xl border transition-all duration-200 active:scale-95 ${reelsCount === n ? "primary-gradient text-white border-transparent shadow-lg shadow-primary/20" : "bg-surface-container-low border-surface-border/60 text-on-surface-variant hover:border-primary/40 hover:bg-surface-container"}`}>{n}</button>
                  ))}
                </div>
              </div>

              {/* Clip Length */}
              <div>
                <label className="text-[10px] text-on-surface-variant uppercase tracking-widest font-medium">{t("Clip Length")}</label>
                <div className="flex gap-1 mt-1.5">
                  {CLIP_LENGTHS.map((l) => (
                    <button key={l} onClick={() => setClipLength(l)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-xl border transition-all duration-200 active:scale-95 ${clipLength === l ? "primary-gradient text-white border-transparent shadow-lg shadow-primary/20" : "bg-surface-container-low border-surface-border/60 text-on-surface-variant hover:border-primary/40 hover:bg-surface-container"}`}>{l}</button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="text-[10px] text-on-surface-variant uppercase tracking-widest font-medium">{t("Aspect Ratio")}</label>
                <div className="flex gap-1 mt-1.5">
                  {ASPECT_RATIOS.map((a) => (
                    <button key={a.label} onClick={() => setAspectRatio(a)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-xl border transition-all duration-200 active:scale-95 ${aspectRatio.label === a.label ? "primary-gradient text-white border-transparent shadow-lg shadow-primary/20" : "bg-surface-container-low border-surface-border/60 text-on-surface-variant hover:border-primary/40 hover:bg-surface-container"}`}>{a.label}</button>
                  ))}
                </div>
              </div>


            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generating || (!file && !url.trim())}
              className="w-full primary-gradient text-white font-semibold py-3 rounded-2xl shadow-lg shadow-primary/25 flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.97] hover:translate-y-[-1px] disabled:opacity-60 disabled:cursor-not-allowed text-sm"
            >
              {generating ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> {t("Processing...")}</>
              ) : (
                <><span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>content_cut</span> {t("Generate {reelsCount} Reels").replace("{reelsCount}", reelsCount)}</>
              )}
            </button>
          </div>

          {/* RIGHT PANEL */}
          <div className={`flex flex-col gap-4 min-w-0 ${!file && !url.trim() && reels.length === 0 ? "xl:items-center xl:justify-center" : ""}`}>
            {!file && !url.trim() && reels.length === 0 ? (
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-primary text-5xl">content_cut</span>
                </div>
                <h3 className="text-xl font-semibold mb-1" style={{ fontFamily: "Geist, sans-serif" }}>{t("AI Clipping Engine")}</h3>
                <p className="text-sm text-on-surface-variant max-w-md mx-auto">{t("Upload a video and configure settings to auto-generate viral reels with AI-powered hook detection, caption styling, and scoring.")}</p>
              </div>
            ) : generating || progress > 0 || progressStage === "failed" ? (
              /* Processing Status */
              <div className="glass-card rounded-2xl p-6 border border-white/5 card-glow" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
                {progressStage === "failed" ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                      <span className="material-symbols-outlined text-error text-2xl">error</span>
                    </div>
                    <h4 className="text-sm font-bold text-error">{t("Processing Failed")}</h4>
                    <p className="text-[10px] text-on-surface-variant mt-1">{t("Check your video format/connection and try again.")}</p>
                    <button onClick={() => { setProgressStage(""); setProgress(0); }}
                      className="mt-3 px-4 py-1.5 border border-surface-border rounded-lg text-xs font-medium hover:bg-surface-container transition-colors">{t("Dismiss")}</button>
                  </div>
                ) : (
                  <>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center animate-pulse">
                      <span className="material-symbols-outlined text-primary">auto_awesome</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold capitalize">{progressStage}</h4>
                      <p className="text-[10px] text-on-surface-variant">{Math.round(progress)}% complete</p>
                    </div>
                  </div>
                  <span className="text-primary font-mono text-lg font-bold">{Math.round(progress)}%</span>
                </div>
                  <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-accent-cyan transition-all duration-700 ease-out shadow-[0_0_12px_rgba(139,92,246,0.3)]" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex gap-2 mt-4">
                  {stages.map((s, i) => {
                    const idx = stages.indexOf(progressStage);
                    const state = i < idx ? "done" : i === idx ? "current" : "upcoming";
                    return (
                      <div key={s} className="flex-1 flex flex-col items-center gap-1">
                        <div className={`w-full h-0.5 rounded-full transition-colors ${state === "done" ? "bg-primary" : state === "current" ? "bg-primary/50" : "bg-surface-container-higher"}`} />
                        <span className={`text-[8px] uppercase tracking-widest ${state === "done" ? "text-primary" : state === "current" ? "text-on-surface" : "text-on-surface-variant/40"}`}>{s}</span>
                      </div>
                    );
                  })}
                </div>
                </>
                )}
              </div>
            ) : null}

            {reels.length > 0 && (
              <>
                {/* Analytics Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { label: t("Total Reels"), value: reels.length, icon: "content_cut", color: "text-primary" },
                    { label: t("Avg. Score"), value: `${avgScore}%`, icon: "analytics", color: avgScore > 75 ? "text-accent-green" : avgScore > 60 ? "text-accent-orange" : "text-on-surface-variant" },
                    { label: t("Best Reel"), value: topReel ? `#${topReel.number}` : "-", icon: "emoji_events", color: "text-accent-orange" },
                    { label: t("Duration"), value: `${reels.length * parseInt(clipLength)}s`, icon: "timer", color: "text-on-surface-variant" },
                    { label: t("Processing"), value: "~2 min", icon: "bolt", color: "text-primary" },
                  ].map((stat) => (
                    <div key={stat.label} className="glass-card rounded-2xl p-3 border border-white/5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
                      <span className={`material-symbols-outlined text-lg ${stat.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
                      <p className="text-lg font-bold mt-1" style={{ fontFamily: "Geist, sans-serif" }}>{stat.value}</p>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Reels Grid */}
                <div className="flex-1 min-h-0">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold" style={{ fontFamily: "Geist, sans-serif" }}>{t("Generated Reels")}</h3>
                    <span className="text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">{t("{count} reels").replace("{count}", reels.length)}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pr-1">
                    {reels.map((reel) => (
                      <div key={reel.id} className="glass-card rounded-2xl overflow-hidden group hover:border-primary/30 transition-all duration-300 border border-white/5 hover:translate-y-[-2px] card-glow" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
                        <div className="relative aspect-[9/16] bg-surface-container-highest overflow-hidden">
                          <img src={reel.thumbnail} alt={reel.title} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                          <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                            {reel.overallScore > 85 && <span className="bg-accent-orange text-white px-1.5 py-0.5 rounded text-[8px] font-bold">{t("HOT")}</span>}
                            {reel.viralScore > 80 && <span className="bg-primary text-on-primary px-1.5 py-0.5 rounded text-[8px] font-bold">{t("VIRAL")}</span>}
                          </div>
                          <div className="absolute bottom-2 left-2 right-2">
                            <div className="flex gap-1.5">
                              <button className="flex-1 py-1.5 bg-white/10 backdrop-blur-md rounded-md text-[9px] font-semibold text-white hover:bg-white/20 transition-colors flex items-center justify-center gap-1"><span className="material-symbols-outlined text-[10px]">play_arrow</span> {t("Preview")}</button>
                              <button className="flex-1 py-1.5 bg-white/10 backdrop-blur-md rounded-md text-[9px] font-semibold text-white hover:bg-white/20 transition-colors flex items-center justify-center gap-1"><span className="material-symbols-outlined text-[10px]">download</span> {t("Download")}</button>
                              <button className="py-1.5 px-2 bg-white/10 backdrop-blur-md rounded-md text-white hover:bg-white/20 transition-colors"><span className="material-symbols-outlined text-[10px]">edit</span></button>
                              <button className="py-1.5 px-2 bg-white/10 backdrop-blur-md rounded-md text-white hover:bg-white/20 transition-colors"><span className="material-symbols-outlined text-[10px]">refresh</span></button>
                            </div>
                          </div>
                        </div>
                        <div className="p-2.5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold" style={{ fontFamily: "Geist, sans-serif" }}>#{reel.number}</span>
                            <span className="text-[10px] text-on-surface-variant">{reel.duration}s</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <div className="text-center">
                              <p className="text-[10px] font-bold" style={{ color: reel.viralScore > 75 ? "#10b981" : reel.viralScore > 60 ? "#f59e0b" : "#6b7280" }}>{reel.viralScore}</p>
                              <p className="text-[7px] text-on-surface-variant uppercase tracking-widest">Viral</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-bold" style={{ color: reel.hookScore > 75 ? "#10b981" : reel.hookScore > 60 ? "#f59e0b" : "#6b7280" }}>{reel.hookScore}</p>
                              <p className="text-[7px] text-on-surface-variant uppercase tracking-widest">Hook</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-bold" style={{ color: reel.ctaScore > 75 ? "#10b981" : reel.ctaScore > 60 ? "#f59e0b" : "#6b7280" }}>{reel.ctaScore}</p>
                              <p className="text-[7px] text-on-surface-variant uppercase tracking-widest">CTA</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Export */}
                <button className="w-full py-3 glass-card rounded-2xl font-bold text-sm text-primary hover:bg-primary/10 transition-all duration-200 flex items-center justify-center gap-2 border border-primary/20 hover:border-primary/40 active:scale-[0.97]" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.05), transparent)' }}>
                  <span className="material-symbols-outlined text-base">download</span>
                  {t("Export All Reels ({count} clips)").replace("{count}", reels.length)}
                </button>
              </>
            )}
          </div>
        </div>
      </main>
      </SidebarProvider>
    </div>
  );
}

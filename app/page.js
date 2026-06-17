"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import { SidebarProvider } from "./components/SidebarContext";
import { useTranslate } from "./components/LanguageProvider";

const templates = Array.from({ length: 11 }, (_, i) => ({
  video: `/templates/template${i + 1}.mp4`,
  prompt: [
    "Cinematic drone shot over misty mountains at sunrise, golden light, 4k ultra realistic",
    "Luxury car driving through neon-lit futuristic city at night, cyberpunk aesthetic",
    "Chef plating a gourmet dish in slow motion, warm restaurant lighting, shallow depth of field",
    "Person walking on tropical beach at sunset, golden hour glow, cinematic aspect ratio",
    "Aerial view of a bustling city skyline at dusk with skyscrapers lighting up",
    "Close-up of a waterfall in a dense jungle, sunlight filtering through leaves, vibrant greens",
    "Time-lapse of stars moving across the night sky over a desert landscape",
    "A runner sprinting on a track at golden hour, slow motion, dynamic camera movement",
    "Underwater footage of colorful coral reef with fish swimming, sun rays from above",
    "A coffee being poured in slow motion, steam rising, warm ambient lighting, macro shot",
    "Drone following a surfer catching a wave at sunset, ocean spray, epic cinematic",
  ][i],
}));

const features = [
  {
    href: "/ai-video",
    title: "AI Video",
    descKey: "AI Video desc",
    icon: "movie",
    color: "text-primary",
    bg: "bg-primary-container/20",
    btnKey: "Launch Video Lab",
  },
  {
    href: "/ai-image",
    title: "AI Images",
    descKey: "AI Images desc",
    icon: "image",
    color: "text-secondary",
    bg: "bg-secondary/20",
    btnKey: "Open Image Lab",
  },
  {
    href: "/ugc-engine",
    title: "UGC Engine",
    descKey: "UGC Engine desc",
    icon: "record_voice_over",
    color: "text-tertiary",
    bg: "bg-tertiary/20",
    btnKey: "Design Avatar",
  },
  {
    href: "/hook-gen",
    title: "Hook Gen",
    descKey: "Hook Gen desc",
    icon: "auto_awesome",
    color: "text-primary",
    bg: "bg-primary/20",
    btnKey: "Optimize Script",
  },
  {
    href: "/clipping",
    title: "Clipping",
    descKey: "Clipping desc",
    icon: "content_cut",
    color: "text-accent-orange",
    bg: "bg-accent-orange/20",
    btnKey: "Process Video",
  },
];

export default function Dashboard() {
  const router = useRouter();
  const t = useTranslate();
  const [bgVideoIdx, setBgVideoIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgVideoIdx((prev) => (prev + 1) % templates.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  const handleTemplateClick = (prompt) => {
    const params = new URLSearchParams();
    params.set("prompt", prompt);
    router.push(`/ai-video?${params.toString()}`);
  };
  return (
    <div className="h-screen overflow-hidden no-x-scroll">
      <SidebarProvider>
        <Sidebar />
        <TopBar />
        <main className="fixed top-14 md:top-16 ltr:right-0 rtl:left-0 w-full md:w-[calc(100%-16rem)] bottom-0 overflow-y-auto smooth-scroll">
        <div className="px-3 md:px-5 lg:px-6 py-4 md:py-5 lg:py-6">
          <section className="hero-glow relative rounded-2xl overflow-hidden mb-6 border border-primary/20 min-h-[300px] md:min-h-[540px] flex items-end" style={{ background: 'transparent' }}>
            {templates.map((t, i) => (
              <video
                key={t.video}
                src={t.video}
                muted autoPlay loop playsInline
                className={`absolute inset-0 w-full h-full object-fill transition-opacity duration-1000 ${
                  i === bgVideoIdx ? "opacity-60" : "opacity-0"
                }`}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-background/60 z-10"></div>
            <div className="relative z-20 p-6 md:p-10 pb-16 md:pb-28 w-full max-w-4xl">
              <h2 className="text-2xl md:text-4xl font-bold mb-3 leading-tight tracking-tight text-white" style={{ fontFamily: 'Geist, sans-serif' }}>{t("Create Viral Content With AI")}</h2>
              <Link href="/ai-video" className="inline-flex items-center gap-3 primary-gradient text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl font-medium hover:scale-105 active:scale-[1.02] transition-all duration-200 shadow-xl shadow-primary/30 animate-pulse-glow tap-target">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                {t("Generate Content")}
              </Link>
            </div>
          </section>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-6">
            {templates.slice(0, 5).map((t, i) => (
              <button key={i} onClick={() => handleTemplateClick(t.prompt)} className="card-glow group rounded-xl overflow-hidden border border-surface-border/60 text-left hover:border-primary/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
                <div className="relative aspect-[3/4] bg-surface-container-highest">
                  <video src={t.video} muted autoPlay loop playsInline className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                      <p className="text-[9px] text-white/80 line-clamp-2 leading-tight">{t.prompt}</p>
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="w-8 h-8 rounded-full primary-gradient flex items-center justify-center shadow-lg">
                      <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {features.map((f) => (
              <Link key={f.href} href={f.href} className="glass-card p-5 rounded-2xl flex flex-col group min-h-[200px] glass-card-hover card-glow" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center ${f.color} shadow-lg icon-glow`}>
                    <span className="material-symbols-outlined text-3xl">{f.icon}</span>
                  </div>
                  <span className="material-symbols-outlined opacity-0 group-hover:opacity-100 transition-all duration-300 text-primary -translate-x-2 group-hover:translate-x-0">north_east</span>
                </div>
                <h3 className="text-2xl font-semibold mb-2 text-white" style={{ fontFamily: 'Geist, sans-serif' }}>{f.title}</h3>
                <p className="text-sm text-on-surface-variant flex-1">{t(f.descKey)}</p>
                <div className={`mt-auto pt-3 ${f.color} text-sm font-medium flex items-center gap-2 group-hover:gap-3 transition-all duration-200`} style={{ fontFamily: 'Geist, sans-serif' }}>
                  {t(f.btnKey)} <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </div>
              </Link>
            ))}
            <div className="glass-card p-5 rounded-2xl border border-surface-border/60 relative overflow-hidden flex flex-col justify-center items-center text-center min-h-[200px]" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.05), rgba(6,182,212,0.03))' }}>
              <div className="shimmer-border absolute inset-0 opacity-20"></div>
              <p className="text-2xl font-semibold mb-2 text-white" style={{ fontFamily: 'Geist, sans-serif' }}>{t("New Feature Incoming")}</p>
              <p className="text-sm text-on-surface-variant mb-4">{t("Live Streaming AI is coming soon to your dashboard.")}</p>
              <button className="border border-primary/30 px-6 py-2.5 rounded-xl text-sm font-medium text-primary hover:bg-primary/10 transition-all duration-200 hover:shadow-lg hover:shadow-primary/15 active:scale-95" style={{ fontFamily: 'Geist, sans-serif' }}>Join Waitlist</button>
            </div>
          </div>
          <section className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
                {t("Featured Templates")}
              </h3>
              <Link href="/ai-video" className="text-xs text-primary hover:text-primary/80 font-medium hover:underline underline-offset-4 transition-all">View all</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {templates.map((t, i) => (
                <button key={i} onClick={() => handleTemplateClick(t.prompt)} className="card-glow group rounded-xl overflow-hidden border border-surface-border/60 text-left hover:border-primary/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
                  <div className="relative aspect-[3/4] bg-surface-container-highest">
                    <video src={t.video} muted autoPlay loop playsInline className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                      <p className="text-[8px] text-white/80 line-clamp-1 leading-tight">{t.prompt}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>
      </SidebarProvider>
    </div>
  );
}

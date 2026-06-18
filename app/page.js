"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import { SidebarProvider } from "./components/SidebarContext";

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
    desc: "Generate stunning AI-powered videos with cinematic quality",
    icon: "movie",
    color: "text-primary",
    bg: "bg-primary-container/20",
    btn: "Launch Video Lab",
  },
  {
    href: "/ai-image",
    title: "AI Images",
    desc: "Create breathtaking images with AI image generation",
    icon: "image",
    color: "text-secondary",
    bg: "bg-secondary/20",
    btn: "Open Image Lab",
  },
  {
    href: "/ugc-engine",
    title: "UGC Engine",
    desc: "Design AI avatars and generate UGC content at scale",
    icon: "record_voice_over",
    color: "text-tertiary",
    bg: "bg-tertiary/20",
    btn: "Design Avatar",
  },
  {
    href: "/hook-gen",
    title: "Hook Gen",
    desc: "Generate viral hooks and optimize your scripts with AI",
    icon: "auto_awesome",
    color: "text-primary",
    bg: "bg-primary/20",
    btn: "Optimize Script",
  },
  {
    href: "/clipping",
    title: "Clipping",
    desc: "Auto-clip long videos into viral shorts with AI detection",
    icon: "content_cut",
    color: "text-accent-orange",
    bg: "bg-accent-orange/20",
    btn: "Process Video",
  },
];

const quickActions = [
  { label: "New Video", icon: "movie", href: "/ai-video", color: "text-primary" },
  { label: "Generate Image", icon: "image", href: "/ai-image", color: "text-secondary" },
  { label: "Create UGC", icon: "record_voice_over", href: "/ugc-engine", color: "text-tertiary" },
  { label: "Write Hook", icon: "auto_awesome", href: "/hook-gen", color: "text-accent-pink" },
];

export default function Dashboard() {
  const router = useRouter();
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
    <div className="h-screen bg-background">
      <SidebarProvider>
        <div className="h-screen flex">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto smooth-scroll">
        <div className="flex flex-col min-h-full">
          <section className="hero-glow relative overflow-hidden border-b border-primary/20 min-h-[260px] md:min-h-[400px] flex items-end" style={{ background: 'transparent' }}>
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
            <div className="relative z-20 p-5 md:p-8 pb-10 md:pb-16 w-full">
              <h2 className="text-xl md:text-3xl font-bold mb-2 leading-tight tracking-tight text-white" style={{ fontFamily: 'Geist, sans-serif' }}>Create Viral Content With AI</h2>
              <p className="text-sm text-white/70 mb-4 max-w-xl">Generate stunning videos, images, UGC ads, and viral hooks — all in one premium suite.</p>
              <Link href="/ai-video" className="inline-flex items-center gap-2 primary-gradient text-white px-5 md:px-6 py-2.5 md:py-3 rounded-xl font-medium hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-primary/30 tap-target text-sm">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                Generate Content
              </Link>
            </div>
          </section>

          <div className="flex-1 p-4 md:p-5 lg:p-6 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {quickActions.map((a) => (
                <Link key={a.label} href={a.href} className="glass-card p-3 rounded-xl flex items-center gap-3 border border-white/5 hover:border-primary/30 transition-all duration-200 hover:translate-y-[-1px] card-glow" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
                  <div className={`w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center ${a.color} shrink-0`}>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{a.icon}</span>
                  </div>
                  <span className="text-xs font-medium text-white">{a.label}</span>
                </Link>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>apps</span>
                  AI Tools
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {features.map((f) => (
                  <Link key={f.href} href={f.href} className="glass-card p-4 rounded-xl flex flex-col group glass-card-hover card-glow border border-white/5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-9 h-9 rounded-lg ${f.bg} flex items-center justify-center ${f.color} shadow-lg`}>
                        <span className="material-symbols-outlined text-lg">{f.icon}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-white" style={{ fontFamily: 'Geist, sans-serif' }}>{f.title}</h4>
                    </div>
                    <p className="text-xs text-on-surface-variant flex-1 leading-relaxed">{f.desc}</p>
                    <div className={`mt-2 pt-2 border-t border-white/5 ${f.color} text-[11px] font-medium flex items-center gap-1 group-hover:gap-2 transition-all duration-200`} style={{ fontFamily: 'Geist, sans-serif' }}>
                      {f.btn} <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>folder</span>
                  Recent Projects
                </h3>
              </div>
              <div className="glass-card p-6 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
                <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-on-surface-variant text-lg">folder_open</span>
                </div>
                <p className="text-sm font-medium text-white mb-1">No projects yet</p>
                <p className="text-[11px] text-on-surface-variant">Start by generating your first AI video or image.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="glass-card p-3 rounded-xl border border-white/5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
                <span className="material-symbols-outlined text-sm text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                <p className="text-lg font-bold text-white mt-1" style={{ fontFamily: 'Geist, sans-serif' }}>0</p>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">Credits Used</p>
              </div>
              <div className="glass-card p-3 rounded-xl border border-white/5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
                <span className="material-symbols-outlined text-sm text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>movie</span>
                <p className="text-lg font-bold text-white mt-1" style={{ fontFamily: 'Geist, sans-serif' }}>0</p>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">Videos</p>
              </div>
              <div className="glass-card p-3 rounded-xl border border-white/5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
                <span className="material-symbols-outlined text-sm text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>image</span>
                <p className="text-lg font-bold text-white mt-1" style={{ fontFamily: 'Geist, sans-serif' }}>0</p>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">Images</p>
              </div>
              <div className="glass-card p-3 rounded-xl border border-white/5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
                <span className="material-symbols-outlined text-sm text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <p className="text-lg font-bold text-white mt-1" style={{ fontFamily: 'Geist, sans-serif' }}>0</p>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">Generations</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
                  Featured Templates
                </h3>
                <Link href="/ai-video" className="text-[11px] text-primary hover:text-primary/80 font-medium hover:underline underline-offset-4 transition-all">View all</Link>
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
            </div>
          </div>
        </div>
      </main>
        </div>
      </div>
      </SidebarProvider>
    </div>
  );
}
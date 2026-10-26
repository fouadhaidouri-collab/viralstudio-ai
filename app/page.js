"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import { SidebarProvider } from "./components/SidebarContext";
import Icon from "./components/Icon";
import useScrollActivated from "./lib/useScrollActivated";


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
    desc: "Generate high-quality cinematic clips from simple text prompts or storyboard data.",
    icon: "movie",
    color: "text-primary",
    bg: "bg-primary-container/20",
    btn: "Launch Video Lab",
  },
  {
    href: "/ai-image",
    title: "AI Images",
    desc: "Ultra-realistic 8K image generation for thumbnails, covers, and conceptual art.",
    icon: "image",
    color: "text-secondary",
    bg: "bg-secondary/20",
    btn: "Open Image Lab",
  },
  {
    href: "/ugc-engine",
    title: "UGC Engine",
    desc: "Create realistic AI avatars and voiceovers for authentic-feeling user content.",
    icon: "record_voice_over",
    color: "text-tertiary",
    bg: "bg-tertiary/20",
    btn: "Design Avatar",
    soon: true,
  },
  {
    href: "/hook-gen",
    title: "Hook Gen",
    desc: "Optimize your video intros with AI hooks designed for maximum retention.",
    icon: "auto_awesome",
    color: "text-primary",
    bg: "bg-primary/20",
    btn: "Optimize Script",
    soon: true,
  },
  {
    href: "/clipping",
    title: "Clipping",
    desc: "Automatically extract high-engagement vertical clips from long-form content.",
    icon: "content_cut",
    color: "text-accent-orange",
    bg: "bg-accent-orange/20",
    btn: "Process Video",
    soon: true,
  },
];

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    if (mq.addEventListener) mq.addEventListener("change", update);
    else mq.addListener(update);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", update);
      else mq.removeListener(update);
    };
  }, []);

  return isDesktop;
}

function InViewVideo({ src, poster, className, active = true }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => {
        setInView(true);
        if (active) setShouldLoad(true);
      });
      return () => cancelAnimationFrame(frame);
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setInView(entry.isIntersecting);
          if (active && entry.isIntersecting) setShouldLoad(true);
        });
      },
      { rootMargin: "150px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [active]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !shouldLoad) return;

    if (!inView) {
      el.pause();
      return;
    }

    if (el.readyState >= 2) {
      el.play().catch(() => {});
      return;
    }

    const play = () => el.play().catch(() => {});
    el.addEventListener("canplay", play, { once: true });
    return () => el.removeEventListener("canplay", play);
  }, [inView, shouldLoad]);

  return (
    <video
      ref={ref}
      src={shouldLoad ? src : undefined}
      poster={poster}
      muted
      loop
      playsInline
      preload={shouldLoad ? "auto" : "none"}
      className={className}
    />
  );
}

function TemplateMedia({ src, poster, mobilePoster, className, isDesktop, active }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const mobileWebp = mobilePoster.replace(/\.jpg$/, ".webp");

  useEffect(() => {
    if (isDesktop) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "300px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [isDesktop]);

  if (isDesktop) {
    return <InViewVideo src={src} poster={poster} className={className} active={active} />;
  }

  return (
    <picture ref={ref} className="block w-full h-full">
      {visible && (
        <source type="image/webp" media="(max-width: 767px)" srcSet={mobileWebp} />
      )}
      {visible && <source media="(max-width: 767px)" srcSet={mobilePoster} />}
      {visible && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" loading="lazy" decoding="async" fetchPriority="low" className={className} />
      )}
    </picture>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [bgVideoIdx, setBgVideoIdx] = useState(0);
  const isDesktop = useIsDesktop();
  const scrollActivated = useScrollActivated();

  useEffect(() => {
    if (!isDesktop || !scrollActivated) return;
    const interval = setInterval(() => {
      setBgVideoIdx((prev) => (prev + 1) % templates.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isDesktop, scrollActivated]);
  const handleTemplateClick = (prompt) => {
    const params = new URLSearchParams();
    params.set("prompt", prompt);
    router.push(`/ai-video?${params.toString()}`);
  };
  const heroTemplate = templates[bgVideoIdx % templates.length];
  const heroPoster = heroTemplate.video.replace(".mp4", ".jpg");
  const heroMobilePoster = heroTemplate.video.replace(".mp4", "-mobile.jpg");
  const heroMobileWebp = heroTemplate.video.replace(".mp4", "-mobile.webp");
  return (
    <div className="h-screen overflow-hidden no-x-scroll">
      <SidebarProvider>
        <Sidebar />
        <TopBar />
        <main className="fixed top-14 md:top-16 right-0 w-full md:w-[calc(100%-16rem)] bottom-0 overflow-y-auto smooth-scroll">
        <div className="px-3 md:px-5 lg:px-6 py-4 md:py-5 lg:py-6">
          <section className="hero-glow relative rounded-2xl overflow-hidden mb-6 border border-primary/20 min-h-[360px] md:min-h-[540px] flex items-end" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(99,102,241,0.04))' }}>
            {!isDesktop && (
              <picture className="absolute inset-0">
                <source
                  type="image/webp"
                  media="(max-width: 767px)"
                  srcSet={heroMobileWebp}
                />
                <source
                  media="(max-width: 767px)"
                  srcSet={heroMobilePoster}
                />
                <img
                  src={heroPoster}
                  alt=""
                  fetchPriority="high"
                  className="w-full h-full object-fill opacity-60"
                />
              </picture>
            )}
            {isDesktop && !scrollActivated && (
              <img
                src={templates[0].video.replace(".mp4", ".jpg")}
                alt=""
                fetchPriority="high"
                className="absolute inset-0 w-full h-full object-fill opacity-60"
              />
            )}
            {isDesktop && scrollActivated && (() => {
              const cur = bgVideoIdx % templates.length;
              const nxt = (cur + 1) % templates.length;
              return [cur, nxt].map((idx, pos) => (
                <video
                  key={pos}
                  src={templates[idx].video}
                  poster={templates[idx].video.replace(".mp4", ".jpg")}
                  muted autoPlay loop playsInline
                  preload={pos === 0 ? "auto" : "metadata"}
                  className={`absolute inset-0 w-full h-full object-fill transition-opacity duration-1000 ${
                    pos === 0 ? "opacity-60" : "opacity-0"
                  }`}
                />
              ));
            })()}
            <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-background/60 z-10"></div>
            <div className="relative z-20 p-6 md:p-10 pb-16 md:pb-28 w-full max-w-4xl">
              <h2 className="text-2xl md:text-4xl font-bold mb-3 leading-tight tracking-tight text-white" style={{ fontFamily: 'Geist, sans-serif' }}>Create Viral Content With AI</h2>
              <Link href="/ai-video" className="inline-flex items-center gap-3 primary-gradient text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl font-medium hover:scale-105 active:scale-[1.02] transition-all duration-200 shadow-xl shadow-primary/30 animate-pulse-glow tap-target">
                <Icon name="bolt" size={16} />
                Generate Content
              </Link>
            </div>
          </section>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-6">
            {templates.slice(0, 5).map((t, i) => (
              <button key={i} onClick={() => handleTemplateClick(t.prompt)} className="card-glow group rounded-xl overflow-hidden border border-surface-border/60 text-left hover:border-primary/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
                <div className="relative aspect-[3/4] bg-surface-container-highest">
                  <TemplateMedia src={t.video} poster={t.video.replace(".mp4", ".jpg")} mobilePoster={t.video.replace(".mp4", "-thumb.jpg")} isDesktop={isDesktop} active={scrollActivated} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                      <p className="text-[9px] text-white/80 line-clamp-2 leading-tight">{t.prompt}</p>
                    </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="w-8 h-8 rounded-full primary-gradient flex items-center justify-center shadow-lg">
                      <Icon name="play_arrow" className="text-white" size={14} />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {features.map((f) => (
              <Link key={f.href} href={f.href} className={`glass-card p-5 rounded-2xl flex flex-col group min-h-[200px] glass-card-hover card-glow ${f.soon ? 'opacity-60 hover:opacity-80' : ''}`} style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center ${f.color} shadow-lg icon-glow`}>
                    <Icon name={f.icon} size={28} />
                  </div>
                  <div className="flex items-center gap-2">
                    {f.soon && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-yellow-400/15 text-yellow-400 border border-yellow-400/20 uppercase tracking-wider">Soon</span>}
                    <Icon name="north_east" className="opacity-0 group-hover:opacity-100 transition-all duration-300 text-primary -translate-x-2 group-hover:translate-x-0" size={16} />
                  </div>
                </div>
                <h3 className="text-2xl font-semibold mb-2 text-white" style={{ fontFamily: 'Geist, sans-serif' }}>{f.title}</h3>
                <p className="text-sm text-on-surface-variant flex-1">{f.desc}</p>
                <div className={`mt-auto pt-3 ${f.color} text-sm font-medium flex items-center gap-2 group-hover:gap-3 transition-all duration-200`} style={{ fontFamily: 'Geist, sans-serif' }}>
                  {f.btn} <Icon name="arrow_forward" size={14} />
                </div>
              </Link>
            ))}
            <div className="glass-card p-5 rounded-2xl border border-surface-border/60 relative overflow-hidden flex flex-col justify-center items-center text-center min-h-[200px]" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.05), rgba(6,182,212,0.03))' }}>
              <div className="shimmer-border absolute inset-0 opacity-20"></div>
              <p className="text-2xl font-semibold mb-2 text-white" style={{ fontFamily: 'Geist, sans-serif' }}>New Feature Incoming</p>
              <p className="text-sm text-on-surface-variant mb-4">Live Streaming AI is coming soon to your dashboard.</p>
              <button className="border border-primary/30 px-6 py-2.5 rounded-xl text-sm font-medium text-primary hover:bg-primary/10 transition-all duration-200 hover:shadow-lg hover:shadow-primary/15 active:scale-95" style={{ fontFamily: 'Geist, sans-serif' }}>Join Waitlist</button>
            </div>
          </div>
          <section className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                <Icon name="history" className="text-primary" size={16} />
                Featured Templates
              </h3>
              <Link href="/ai-video" className="text-xs text-primary hover:text-primary/80 font-medium hover:underline underline-offset-4 transition-all">View all</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {templates.map((t, i) => (
                <button key={i} onClick={() => handleTemplateClick(t.prompt)} className="card-glow group rounded-xl overflow-hidden border border-surface-border/60 text-left hover:border-primary/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
                  <div className="relative aspect-[3/4] bg-surface-container-highest">
                    <TemplateMedia src={t.video} poster={t.video.replace(".mp4", ".jpg")} mobilePoster={t.video.replace(".mp4", "-thumb.jpg")} isDesktop={isDesktop} active={scrollActivated} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
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
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import ProfileDropdown from "../components/ProfileDropdown";
import { SidebarProvider, useSidebar } from "../components/SidebarContext";
import Icon from "../components/Icon";

export default function UGCFEnginePage() {
  const router = useRouter();
  const { setMobileOpen } = useSidebar();
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
    }, 3000);
  };

  return (
    <div className="h-screen overflow-hidden no-x-scroll">
      <SidebarProvider>
      <Sidebar />
      <header className="fixed top-0 right-0 w-full md:w-[calc(100%-16rem)] h-14 md:h-16 bg-surface/70 backdrop-blur-xl border-b border-surface-border/50 flex justify-between items-center px-4 md:px-8 z-40" style={{ boxShadow: '0 1px 20px rgba(0,0,0,0.3)' }}>
        <div className="md:hidden">
          <button onPointerDown={() => setMobileOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-low border border-surface-border/50 hover:bg-surface-container-high transition-all" style={{ touchAction: 'manipulation' }}>
            <Icon name="menu" className="text-white text-xl" />
          </button>
        </div>
        <div className="flex items-center gap-4 flex-1 hidden md:flex"></div>
        <div className="flex items-center gap-3 md:gap-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low border border-surface-border/60 rounded-xl hover:border-yellow-400/30 transition-all duration-200">
              <Icon name="bolt" className="text-sm text-yellow-400" />
              <span className="text-sm font-bold text-yellow-400">0</span>
              <button onClick={() => router.push("/pricing")} className="ml-1 w-5 h-5 flex items-center justify-center rounded-full bg-yellow-400/15 hover:bg-yellow-400/25 transition-all duration-200 hover:scale-110 active:scale-95">
                <Icon name="add" className="text-[10px] text-yellow-400" />
              </button>
            </div>
          </div>
          <div className="h-8 w-px bg-surface-border/50"></div>
          <ProfileDropdown />
        </div>
      </header>
      <main className="fixed top-14 md:top-16 right-0 w-full md:w-[calc(100%-16rem)] bottom-0 p-4 md:p-5 lg:p-6 overflow-y-auto smooth-scroll">
        <div className="w-full grid grid-cols-12 gap-4 md:gap-5">
          <div className="col-span-12 lg:col-span-7 flex flex-col gap-4">
            <header>
              <h2 className="text-2xl font-semibold text-on-surface mb-1" style={{ fontFamily: 'Geist, sans-serif' }}>UGC Generation Engine</h2>
              <p className="text-sm text-on-surface-variant max-w-xl">Configure your high-conversion AI creator. Our engine handles facial micro-expressions and contextual gestures for maximum realism.</p>
            </header>
            <div className="glass-card p-5 rounded-2xl flex flex-col gap-4 flex-1 card-glow border border-white/5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-on-surface-variant uppercase tracking-widest" style={{ fontFamily: 'Geist, sans-serif' }}>Product Name</label>
                  <input className="bg-surface-container-low border border-surface-border/60 rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200 outline-none placeholder:text-on-surface-variant/40" placeholder="e.g. Lumos Hydrate" type="text" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-on-surface-variant uppercase tracking-widest" style={{ fontFamily: 'Geist, sans-serif' }}>Target Audience</label>
                  <select className="bg-surface-container-low border border-surface-border/60 rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200 outline-none">
                    <option>Gen-Z Wellness</option>
                    <option>Millennial Tech</option>
                    <option>Corporate Professionals</option>
                    <option>Active Seniors</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-on-surface-variant uppercase tracking-widest" style={{ fontFamily: 'Geist, sans-serif' }}>Offer / Hook</label>
                <div className="relative">
                  <input className="w-full bg-surface-container-low border border-surface-border/60 rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200 outline-none pr-12 placeholder:text-on-surface-variant/40" placeholder="Stop scrolling if you want 2x more energy..." type="text" />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:bg-primary/10 rounded-lg transition-all duration-200">
                    <Icon name="auto_awesome" className="text-lg" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-on-surface-variant uppercase tracking-widest" style={{ fontFamily: 'Geist, sans-serif' }}>Script Content</label>
                  <span className="text-[10px] text-on-surface-variant">420 / 1000 characters</span>
                </div>
                <textarea className="w-full flex-1 bg-surface-container-low border border-surface-border/60 rounded-xl px-3.5 py-2.5 text-on-surface text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200 outline-none resize-none placeholder:text-on-surface-variant/40" placeholder="Paste your script or click AI to generate..."></textarea>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-on-surface-variant uppercase tracking-widest" style={{ fontFamily: 'Geist, sans-serif' }}>Voice Selection</label>
                  <div className="grid grid-cols-1 gap-2">
                    <button className="flex items-center justify-between px-3.5 py-2.5 bg-surface-container-low border border-primary/50 rounded-xl text-on-surface text-sm shadow-lg shadow-primary/5">
                      <div className="flex items-center gap-3">
                        <Icon name="female" className="text-primary" />
                        <span>Jessica (US Female)</span>
                      </div>
                      <Icon name="check_circle" className="text-primary" />
                    </button>
                    <button className="flex items-center justify-between px-3.5 py-2.5 bg-surface-container-low border border-surface-border/60 rounded-xl text-on-surface-variant text-sm hover:border-primary/30 hover:bg-surface-container transition-all duration-200 active:scale-[0.98]">
                      <div className="flex items-center gap-3">
                        <Icon name="male" className="" />
                        <span>Marcus (US Male)</span>
                      </div>
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-on-surface-variant uppercase tracking-widest" style={{ fontFamily: 'Geist, sans-serif' }}>Avatar Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="flex flex-col items-center gap-2 p-2.5 bg-surface-container-low border border-surface-border/60 rounded-xl hover:border-primary/30 hover:bg-surface-container transition-all duration-200 active:scale-[0.98]">
                      <div className="w-full aspect-square rounded-lg bg-surface-container-highest overflow-hidden">
                        <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDJhiBnCRPYkJa9JFY9Uy0WFJp_6NQqfCOzYbgrSwgqOGywThnWxwdfxnNsxHh1dIhEbh0cT-1l2o9jkpDIITmbseLNzee3zK8obsQt8afI3289wFZDVzvq2vY_NcReK9vbW98YfPOZ0NjRXPTV7jsmIlYgAT33ASPNlQbKGl6SjvlN5goOlVdOBuMf25p3Y3SX2nM7kXlLaOARHnGCNSmm32mYJ6LJ7DF59lW8D1xPJ6vfv_FT5Oq-jDed080TCxguNrgIfPtwKg" alt="Real Human" />
                      </div>
                      <span className="text-xs font-medium">Real Human</span>
                    </button>
                    <button className="flex flex-col items-center gap-2 p-2.5 bg-surface-container-low border border-primary/50 rounded-xl shadow-lg shadow-primary/5">
                      <div className="w-full aspect-square rounded-lg bg-surface-container-highest overflow-hidden">
                        <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBEhMX1bHcLkppyCNO-FhabSjjsQEPXW8YxadTc8R-T8OV6qjZ4x_k0WH2HBuYwsIMVLkJsSi2Ib790qhT0rv1XlYOkjAPVqqpo8NLOMYfxEhK4K0MpxDYqmBIeOMpvkzykGlpzqgKscLaKCVK8kEVO5Qu3R-_Ne4zIuJRItOL2rn35BvlaOc4ZYINGJwzfJsFe84B3-8K0h607oT_oFStY7HROPgzAIrpFuTaLbALB_3XplVP4oWpbphlfRjq45GcHZXiOu0SjeA" alt="Studio Creator" />
                      </div>
                      <span className="text-xs font-medium">Studio Creator</span>
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="mt-auto w-full py-3.5 primary-gradient text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.97] hover:translate-y-[-1px] shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ fontFamily: 'Geist, sans-serif' }}
              >
                {generating ? (
                  <><Icon name="refresh" className="animate-spin" /> Synthesizing Content...</>
                ) : (
                  <><Icon name="bolt" /> Generate AI UGC Ad</>
                )}
              </button>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ fontFamily: 'Geist, sans-serif' }}>Live Preview</h3>
              <div className="flex gap-2">
                <button className="p-1.5 bg-surface-container-low border border-surface-border/60 rounded-xl hover:bg-surface-container hover:border-primary/30 transition-all duration-200 active:scale-90"><Icon name="smartphone" className="text-sm" /></button>
                <button className="p-1.5 bg-surface-container-low border border-surface-border/60 rounded-xl hover:bg-surface-container hover:border-primary/30 transition-all duration-200 active:scale-90"><Icon name="tv" className="text-sm" /></button>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-[280px] aspect-[9/16] rounded-[1.5rem] border-[5px] border-surface-card bg-black overflow-hidden shadow-2xl ring-1 ring-surface-border flex-shrink-0">
              <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-end p-4 bg-gradient-to-t from-black/60 to-transparent">
                <div className="flex items-end justify-between mb-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full border border-white/50 bg-white/20 backdrop-blur-md"></div>
                      <span className="text-xs font-bold text-white">@viral_studio_ai</span>
                    </div>
                    <p className="text-[11px] text-white/90 leading-tight max-w-[180px]">Check out this amazing new hydrate mix! Honestly changed my morning routine. #wellness #ads #ugc</p>
                    <div className="flex items-center gap-1">
                      <Icon name="music_note" className="text-[10px] text-white" />
                      <span className="text-[10px] text-white">Original Sound - ViralStudio AI</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4 items-center">
                    <div className="flex flex-col items-center gap-1">
                      <Icon name="favorite" className="text-white text-2xl" />
                      <span className="text-[10px] text-white">12.4K</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Icon name="chat_bubble" className="text-white text-2xl" />
                      <span className="text-[10px] text-white">452</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Icon name="share" className="text-white text-2xl" />
                      <span className="text-[10px] text-white">Share</span>
                    </div>
                  </div>
                </div>
                <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-2/3"></div>
                </div>
              </div>
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <img className="absolute inset-0 w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD737pw0Cp_tksGQ_4lcGHlz2erv3CdzZNY7KnHtrbgATzzQwjJXOmFR3NLFq08jF3iiHDL6imJlAA53yAdriR-LVsKP5b4tslXgYsWDZ3AYNsrGiMPp0hod8wODFSV8KJJH9le2CtTvEf3NfPPwcKLwZbvmoNnQF7N_SKqxJaC3eJepdYd0EBa2IITyHuxVOsLq5qwEjGpBJ7oCZAjf6wWXuFPf_rM6tN6AFRqIkwd9GnNlg8sed8uRLRBv6MlswahF9GrmlisrQ" alt="Preview" />
                <button className="z-30 w-16 h-16 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center group hover:bg-white/20 transition-all">
                  <Icon name="play_arrow" className="text-white text-3xl" />
                </button>
              </div>
            </div>
            <div className="glass-card p-4 rounded-2xl flex items-center gap-4 border border-white/5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
              <div className="relative w-12 h-12 flex-shrink-0">
                <div className="absolute inset-0 border-2 border-surface-border/60 rounded-full"></div>
                <div className="absolute inset-0 border-2 border-primary rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-primary">65%</span>
                </div>
              </div>
              <div className="flex-grow">
                <h4 className="text-sm font-bold">Processing Neural Frames</h4>
                <div className="w-full bg-surface-container h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-primary w-[65%] shimmer-border"></div>
                </div>
              </div>
              <button className="p-2 hover:bg-white/5 rounded-lg text-on-surface-variant"><Icon name="close" /></button>
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-on-surface-variant uppercase tracking-widest" style={{ fontFamily: 'Geist, sans-serif' }}>Quick Export</label>
              <div className="grid grid-cols-2 gap-2">
                <button className="flex items-center justify-center gap-2 py-3 bg-surface-container-low border border-surface-border/60 rounded-xl text-sm hover:bg-surface-container hover:border-primary/30 transition-all duration-200 active:scale-[0.97]">
                  <Icon name="download" className="text-sm" /> HD MP4
                </button>
                <button className="flex items-center justify-center gap-2 py-3 bg-surface-container-low border border-surface-border/60 rounded-xl text-sm hover:bg-surface-container hover:border-primary/30 transition-all duration-200 active:scale-[0.97]">
                  <Icon name="send" className="text-sm" /> TikTok Ads
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      </SidebarProvider>
    </div>
  );
}

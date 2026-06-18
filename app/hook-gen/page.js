"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import ProfileDropdown from "../components/ProfileDropdown";
import { SidebarProvider, useSidebar } from "../components/SidebarContext";

export default function HookGenPage() {
  const router = useRouter();
  const { setMobileOpen } = useSidebar();
  const frameworks = [
    { icon: "psychology", title: "Dopamine Gap", desc: "Create curiosity gaps that keep viewers watching until the end", color: "text-primary", bg: "bg-primary/10" },
    { icon: "trending_up", title: "Trend Surfer", desc: "Ride trending topics for instant viral relevance", color: "text-secondary", bg: "bg-secondary/10" },
    { icon: "warning", title: "Loss Aversion", desc: "Leverage fear of missing out for higher conversions", color: "text-tertiary", bg: "bg-tertiary/10" },
    { icon: "groups", title: "Social Proof", desc: "Showcase popularity to trigger bandwagon effect", color: "text-primary", bg: "bg-primary/10" },
  ];
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2000);
  };

  return (
    <div className="h-screen bg-background">
      <SidebarProvider>
      <div className="h-screen flex">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
      <header className="shrink-0 w-full bg-surface/70 backdrop-blur-xl border-b border-surface-border/50 h-14 md:h-16 flex justify-between items-center px-4 md:px-8" style={{ boxShadow: '0 1px 20px rgba(0,0,0,0.3)' }}>
        <div className="md:hidden">
          <button onClick={() => setMobileOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-low border border-surface-border/50 hover:bg-surface-container-high transition-all active:scale-90">
            <span className="material-symbols-outlined text-white text-xl">menu</span>
          </button>
        </div>
        <div className="flex items-center flex-1 max-w-xl hidden md:flex"></div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low border border-surface-border/60 rounded-xl hover:border-yellow-400/30 transition-all duration-200">
            <span className="material-symbols-outlined text-sm text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            <span className="text-sm font-bold text-yellow-400">0</span>
            <button onClick={() => router.push("/pricing")} className="ml-1 w-5 h-5 flex items-center justify-center rounded-full bg-yellow-400/15 hover:bg-yellow-400/25 transition-all duration-200 hover:scale-110 active:scale-95">
              <span className="material-symbols-outlined text-[10px] text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
            </button>
          </div>
          <ProfileDropdown />
        </div>
      </header>
      <main className="flex-1 overflow-y-auto smooth-scroll p-4 md:p-5 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-5">
        <section className="lg:w-80 flex flex-col gap-4 shrink-0">
          <div className="glass-card p-5 rounded-2xl border border-white/5 flex flex-col card-glow" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
            <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2" style={{ fontFamily: 'Geist, sans-serif' }}>
              <span className="material-symbols-outlined text-primary">settings_input_component</span> Generator
            </h2>
            <div className="space-y-3 flex-1 flex flex-col">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-on-surface-variant" style={{ fontFamily: 'Geist, sans-serif' }}>Business/Niche</label>
                <input className="w-full bg-surface-container-low border border-surface-border/60 rounded-xl px-3.5 py-2.5 text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all duration-200 placeholder:text-on-surface-variant/50" placeholder="e.g., AI SaaS, Skincare" type="text" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-on-surface-variant" style={{ fontFamily: 'Geist, sans-serif' }}>Target Market</label>
                <input className="w-full bg-surface-container-low border border-surface-border/60 rounded-xl px-3.5 py-2.5 text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all duration-200 placeholder:text-on-surface-variant/50" placeholder="e.g., Solopreneurs, Gen Z" type="text" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-on-surface-variant" style={{ fontFamily: 'Geist, sans-serif' }}>Language</label>
                <select className="w-full bg-surface-container-low border border-surface-border/60 rounded-xl px-3.5 py-2.5 text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none appearance-none transition-all duration-200">
                  <option>English (US)</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-on-surface-variant" style={{ fontFamily: 'Geist, sans-serif' }}>Quantity</label>
                <div className="flex gap-2">
                  {[5, 10, 20].map((q) => (
                    <button key={q} className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all duration-200 active:scale-95 ${q === 5 ? 'border-primary bg-primary/15 text-primary' : 'border-surface-border/60 hover:border-primary/30 hover:bg-surface-container-low text-on-surface-variant'}`}>{q}</button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full mt-auto primary-gradient text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-primary/20 active:scale-[0.97] hover:translate-y-[-1px] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'Geist, sans-serif' }}
              >
                {generating ? (
                  <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Generating...</>
                ) : (
                  <>Generate Hook <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span></>
                )}
              </button>
            </div>
          </div>
          <div className="glass-card p-5 rounded-2xl border border-white/5 relative overflow-hidden group card-glow" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.05), rgba(6,182,212,0.03))' }}>
            <div className="relative z-10">
              <h3 className="text-sm font-medium text-accent-orange mb-2 uppercase tracking-widest" style={{ fontFamily: 'Geist, sans-serif' }}>AI Suggestion</h3>
              <p className="text-sm text-on-surface-variant">&ldquo;Users are currently engaging 40% more with &apos;Fear of Missing Out&apos; style hooks in the SaaS niche.&rdquo;</p>
            </div>
          </div>
        </section>
        <section className="flex-1 flex flex-col gap-4">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-semibold text-on-surface" style={{ fontFamily: 'Geist, sans-serif' }}>Generated Content</h1>
              <p className="text-sm text-on-surface-variant">High-conversion hooks based on viral psychological frameworks.</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3.5 py-1.5 rounded-xl border border-surface-border/60 text-sm font-medium hover:bg-surface-container-low hover:border-primary/30 transition-all duration-200 active:scale-95" style={{ fontFamily: 'Geist, sans-serif' }}>Save All</button>
              <button className="px-3.5 py-1.5 rounded-xl border border-surface-border/60 text-sm font-medium hover:bg-surface-container-low hover:border-primary/30 transition-all duration-200 active:scale-95" style={{ fontFamily: 'Geist, sans-serif' }}>Export .CSV</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { pattern: "Pattern Interrupt", color: "text-primary", bg: "bg-primary-container/10", text: '"Stop scrolling if you\'re still using [Tool] in 2024. Here\'s why..."', score: "High Engagement Potential" },
              { pattern: "Secret/Forbidden", color: "text-secondary", bg: "bg-secondary-container/10", text: '"The AI tool your competitors are using to scale to $10k/month (Secret reveal inside)."', score: "Viral Trend Compatible" },
              { pattern: "Negative Constraint", color: "text-tertiary", bg: "bg-tertiary-container/10", text: '"I tried 100 different [Niche] tools so you don\'t have to. Here\'s the only one that works."', score: "Authority Builder" },
              { pattern: "The Listicle", color: "text-primary", bg: "bg-primary-container/10", text: '"3 simple hacks to double your [Metric] without spending a dime."', score: "Efficiency Score: 9.2" },
            ].map((hook, i) => (
              <div key={i} className="glass-card p-6 rounded-2xl border border-white/5 group hover:border-primary/30 transition-all duration-300 flex flex-col card-glow hover:translate-y-[-2px]" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full ${hook.bg} ${hook.color} text-[10px] font-bold uppercase tracking-wider`}>Pattern: {hook.pattern}</span>
                  <button className="text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined text-xl">content_copy</span></button>
                </div>
                <p className="text-2xl font-semibold text-on-surface mb-4 leading-snug" style={{ fontFamily: 'Geist, sans-serif' }}>{hook.text}</p>
                <div className="mt-auto pt-4 border-t border-surface-border flex justify-between items-center">
                  <div className="flex gap-1">
                    <span className="material-symbols-outlined text-accent-orange text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="text-xs text-on-surface-variant">{hook.score}</span>
                  </div>
                  <span className="text-xs text-outline">Framework: V{i + 1}</span>
                </div>
              </div>
            ))}
          </div>
          <section>
            <h2 className="text-lg font-semibold text-on-surface mb-3 flex items-center gap-2" style={{ fontFamily: 'Geist, sans-serif' }}>
              Hook Frameworks
              <span className="px-2 py-0.5 rounded bg-primary-container text-[10px] font-bold text-white uppercase tracking-tighter">Pro</span>
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {frameworks.map((fw, i) => (
                <div key={i} className="min-w-[280px] glass-card p-5 rounded-2xl border border-white/5 flex gap-4 items-start card-glow hover:translate-y-[-2px] transition-all duration-300" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
                  <div className={`p-3 ${fw.bg} rounded-lg shrink-0 ${fw.color}`}>
                    <span className="material-symbols-outlined">{fw.icon}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-on-surface font-bold" style={{ fontFamily: 'Geist, sans-serif' }}>{fw.title}</h4>
                    <p className="text-sm text-on-surface-variant opacity-70">{fw.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>
      </main>
        </div>
      </div>
      </SidebarProvider>
    </div>
  );
}

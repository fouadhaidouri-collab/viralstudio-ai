"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import ProfileDropdown from "../components/ProfileDropdown";
import { SidebarProvider, useSidebar } from "../components/SidebarContext";
import { useAuth } from "../lib/AuthContext";
import Icon from "../components/Icon";

const DISCOUNT = 0.30;

const plans = [
  {
    name: "Micro",
    sub: "For creators starting their video journey",
    weekly: 9,
    popular: false,
    badge: "Weekly",
    credits: 306,
    cta: "Buy Now",
    features: [
      "306 AI credits/week",
      "2 GB storage",
      "Up to 50 images",
      "Basic AI tools",
      "NO ADS",
    ],
  },
  {
    name: "Starter",
    sub: "For creators starting their video journey",
    monthly: 25,
    popular: false,
    badge: "Save 30%",
    credits: 10200,
    cta: "Buy Now",
    features: [
      "1 user",
      "200 min of video",
      "5 GB storage",
      "1 brand kit",
      "60 min AI voices (29 languages)",
      "5M Getty Images & Storyblocks",
      "10,200 AI credits/year",
      "Up to 2,000 images",
      "Up to 12.5 min video",
      "Up to 40 min avatar video",
      "No watermark",
      "Basic AI tools",
    ],
  },
  {
    name: "Professional",
    sub: "For creators who need pro-quality results",
    monthly: 35,
    popular: true,
    credits: 14280,
    badge: "Save 30%",
    cta: "Buy Now",
    features: [
      "1 user",
      "600 min of video",
      "20 GB storage",
      "5 brand kits",
      "120 min AI voices (29 languages)",
      "18M Getty Images & Storyblocks",
      "14,280 AI credits/year",
      "Up to 20,000 images",
      "Up to 125 min video",
      "Up to 400 min avatar video",
      "Custom avatars",
      "Voice cloning",
      "Advanced AI tools",
    ],
  },
  {
    name: "Team",
    sub: "For teams collaborating on video creation",
    monthly: 119,
    popular: false,
    credits: 48552,
    badge: "Save 30%",
    cta: "Buy Now",
    features: [
      "3+ users",
      "1,800 min video",
      "100 GB storage",
      "10 brand kits",
      "240 min AI voices (29 languages)",
      "18M Getty Images & Storyblocks",
      "48,552 AI credits/year",
      "Up to 48,000 images",
      "Up to 300 min video",
      "Up to 960 min avatar video",
      "Collaborative workspace",
      "Team onboarding & training",
    ],
  },
];

const cryptoOptions = [
  { id: "btc", label: "Bitcoin", symbol: "BTC", icon: "₿", color: "#f7931a", address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" },
  { id: "eth", label: "Ethereum", symbol: "ETH", icon: "♦", color: "#627eea", address: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18" },
  { id: "usdt", label: "Tether", symbol: "USDT", icon: "₮", color: "#26a17b", address: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18" },
];

export default function PricingPage() {
  const router = useRouter();
  const { setMobileOpen } = useSidebar();
  const { isAuthenticated } = useAuth();
  const [annual, setAnnual] = useState(true);
  const [credits, setCredits] = useState(null);

  useEffect(() => {
    fetch("/api/credits").then(r => r.json()).then(d => { if (d.balance != null) setCredits(d.balance); }).catch(() => {});
  }, []);

  return (
    <div className="h-screen overflow-hidden bg-background">
      <SidebarProvider>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-[100px]" />
      </div>
      <Sidebar />
      <div className="fixed top-0 right-0 w-full md:w-[calc(100%-16rem)] bottom-0 overflow-y-auto smooth-scroll">
        <div className="px-3 md:px-5 lg:px-6 py-4 md:py-5 lg:py-6 relative z-10">
          <div className="flex justify-between md:justify-end items-center gap-4 mb-6">
            <button onClick={() => setMobileOpen(true)} className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-low border border-surface-border/50 hover:bg-surface-container-high transition-all" style={{ touchAction: 'manipulation' }}>
              <Icon name="menu" className="text-white text-xl" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low border border-surface-border/60 rounded-xl hover:border-yellow-400/30 transition-all duration-200">
              <Icon name="bolt" className="text-sm text-yellow-400" />
              <span className="text-sm font-bold text-yellow-400">{credits ?? 0}</span>
              <span className="text-[9px] text-yellow-400/50 font-medium mr-1">remaining</span>
              <button onClick={() => router.push("/pricing")} className="w-5 h-5 flex items-center justify-center rounded-full bg-yellow-400/15 hover:bg-yellow-400/25 transition-all duration-200 hover:scale-110 active:scale-95">
                <Icon name="add" className="text-[10px] text-yellow-400" />
              </button>
            </div>
            <ProfileDropdown />
          </div>

          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20 mb-4">
              <Icon name="auto_awesome" className="text-[12px] text-primary" />
              <span className="text-[11px] text-primary font-semibold tracking-wide">Annual pricing (save up to 30%)</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
              Create Professional Videos
            </h1>
            <p className="text-on-surface-variant text-sm max-w-lg mx-auto leading-relaxed">
              Faster, easier, and cheaper with our flexible plans
            </p>

            <div className="flex items-center justify-center gap-1 mt-8 p-1 bg-surface-container-low border border-surface-border/60 rounded-xl w-fit mx-auto">
              <button onClick={() => setAnnual(false)} className={`px-6 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${!annual ? "primary-gradient text-white shadow-lg shadow-primary/30" : "text-on-surface-variant hover:text-white"}`}>
                Monthly
              </button>
              <button onClick={() => setAnnual(true)} className={`px-6 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${annual ? "primary-gradient text-white shadow-lg shadow-primary/30" : "text-on-surface-variant hover:text-white"}`}>
                Years
                {annual && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-md">Save 30%</span>}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const monthlyPrice = plan.monthly;
              const annualPerMonth = monthlyPrice ? (monthlyPrice * (1 - DISCOUNT)).toFixed(0) : null;
              const displayPrice = annual && annualPerMonth ? annualPerMonth : monthlyPrice;

              return (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl border p-6 flex flex-col transition-all duration-500 group ${
                    plan.popular
                      ? "border-primary/40 bg-gradient-to-br from-primary/[0.06] via-primary/[0.02] to-transparent shadow-2xl shadow-primary/10 scale-[1.02] hover:scale-[1.04]"
                      : "border-surface-border/60 bg-surface-container-lowest/50 hover:border-primary/30 hover:scale-[1.02]"
                  }`}
                  style={plan.popular ? {
                    boxShadow: '0 8px 50px rgba(139,92,246,0.15), 0 0 100px rgba(139,92,246,0.04)',
                    background: 'linear-gradient(145deg, rgba(139,92,246,0.06) 0%, rgba(0,0,0,0.2) 100%)'
                  } : {}}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <div className="px-5 py-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 rounded-full text-[8px] text-black font-extrabold uppercase tracking-[0.15em] shadow-[0_0_20px_rgba(250,204,21,0.4)] flex items-center gap-1.5">
                        <span className="text-[10px]">⭐</span> Most Popular
                      </div>
                    </div>
                  )}

                  <div className="mb-6 mt-1">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-lg font-bold text-white">{plan.name}</h2>
                      {plan.weekly && plan.badge && (
                        <span className="px-2 py-0.5 bg-surface-container-high text-white text-[9px] font-semibold rounded-md border border-surface-border/40">{plan.badge}</span>
                      )}
                      {!plan.weekly && plan.badge && annual && (
                        <span className="px-2 py-0.5 bg-secondary/15 text-secondary text-[9px] font-semibold rounded-md border border-secondary/20">{plan.badge}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-on-surface-variant/70 leading-relaxed">{plan.sub}</p>
                  </div>

                  <div className="mb-6">
                    {plan.weekly ? (
                      <>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-extrabold text-white tracking-tight">${plan.weekly}</span>
                          <span className="text-[11px] text-on-surface-variant/60 font-medium">/wk</span>
                        </div>
                        <p className="text-[10px] text-on-surface-variant/50 mt-1.5">${plan.weekly * 4}/month — <span className="text-green-400">cancel anytime</span></p>
                      </>
                    ) : plan.monthly ? (
                      <>
                        <div className="flex items-baseline gap-2">
                          {annual && (
                            <span className="text-lg text-on-surface-variant/40 line-through font-medium">${plan.monthly}</span>
                          )}
                          <span className="text-4xl font-extrabold text-white tracking-tight">${displayPrice}</span>
                          <span className="text-[11px] text-on-surface-variant/60 font-medium">/mo</span>
                        </div>
                        {annual && (
                          <p className="text-[10px] text-on-surface-variant/50 mt-1.5">
                            ${plan.monthly * 12}/year value — <span className="text-green-400">${(monthlyPrice * (1 - DISCOUNT) * 12).toFixed(0)}/year</span>
                          </p>
                        )}
                      </>
                    ) : (
                      <span className="text-4xl font-extrabold text-white tracking-tight">Custom</span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (!isAuthenticated) { router.push("/login"); return; }
                      if (plan.name === "Enterprise") {
                        window.location.href = "mailto:sales@viralstudio.ai";
                      } else if (plan.weekly) {
                        router.push(`/pay?plan=${plan.name.toLowerCase()}&billing=weekly`);
                      } else {
                        router.push(`/pay?plan=${plan.name.toLowerCase()}&billing=${annual ? "annual" : "monthly"}`);
                      }
                    }}
                    className={`w-full py-3 rounded-xl font-semibold text-sm mb-6 transition-all duration-200 active:scale-[0.97] hover:translate-y-[-1px] ${
                      plan.popular
                        ? "primary-gradient text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40"
                        : "btn-subtle text-white hover:bg-primary/10 hover:border-primary/30"
                    }`}
                  >
                    {plan.cta === "Let's Talk" ? "Contact Sales" : plan.cta}
                  </button>

                  {(plan.monthly || plan.weekly) && (
                    <p className="text-center text-sm text-yellow-400 font-bold mt-[-16px] mb-4 flex items-center justify-center gap-1.5">
                      <Icon name="bolt" size={16} className="text-yellow-400" />
                      {plan.weekly ? plan.credits.toLocaleString() : annual ? Math.round(plan.credits * (1 + DISCOUNT)).toLocaleString() : Math.round(plan.credits / 12).toLocaleString()} credits/{plan.weekly ? "week" : annual ? "year" : "month"}
                    </p>
                  )}

                  <div className="space-y-2.5 flex-1">
                    {plan.features.map((f, i) => {
                      const creditMatch = f.match(/^([\d,]+) AI credits\/(year|week)$/);
                      const storageMatch = f.match(/^(\d+) GB storage$/);
                      let displayFeature = f;
                      if (creditMatch && !plan.weekly) {
                        const base = parseInt(creditMatch[1].replace(/,/g, ''));
                        const num = annual ? Math.round(base * (1 + DISCOUNT)) : Math.round(base / 12);
                        displayFeature = `${num.toLocaleString()} AI credits/${annual ? "year" : "month"}`;
                      } else if (storageMatch && !plan.weekly && annual) {
                        const base = parseInt(storageMatch[1]);
                        displayFeature = `${base * 5} GB storage`;
                      }
                      return (
                      <div key={i} className="flex items-start gap-2.5 group/feature">
                        <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 group-hover/feature:bg-primary/20 transition-colors">
                          <Icon name="check" className="text-[10px] text-primary" />
                        </div>
                        <span className="text-[12px] text-on-surface-variant/90 group-hover/feature:text-on-surface transition-colors">{displayFeature}</span>
                      </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      </SidebarProvider>
    </div>
  );
}

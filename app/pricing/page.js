"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import ProfileDropdown from "../components/ProfileDropdown";
import { SidebarProvider, useSidebar } from "../components/SidebarContext";
import { useAuth } from "../lib/AuthContext";
import Icon from "../components/Icon";
import PayPalCheckoutModal from "../../components/payment/PayPalCheckoutModal";

// Credit packs: $10 = 1,000 credits (1 credit = $0.01).
// The bonus % is added on top of the base credits for each pack.
const packs = [
  {
    id: "beginner",
    name: "Beginner",
    price: 10,
    base: 1000,
    bonus: 0,
    sub: "Perfect to try every AI tool",
  },
  {
    id: "builder",
    name: "Builder",
    price: 25,
    base: 2500,
    bonus: 5,
    sub: "For regular creators",
  },
  {
    id: "creator",
    name: "Creator",
    price: 50,
    base: 5000,
    bonus: 10,
    popular: true,
    sub: "Our most popular pack",
  },
  {
    id: "pro",
    name: "Pro",
    price: 100,
    base: 10000,
    bonus: 15,
    sub: "For serious content production",
  },
  {
    id: "elite",
    name: "Elite",
    price: 200,
    base: 20000,
    bonus: 20,
    bestValue: true,
    sub: "Best value per credit",
  },
  {
    id: "ultimate",
    name: "Ultimate",
    price: 500,
    base: 50000,
    bonus: 20,
    sub: "For studios and agencies",
  },
];

const RATE = 100; // credits per $1

export default function PricingPage() {
  const router = useRouter();
  const { setMobileOpen } = useSidebar();
  const { isAuthenticated } = useAuth();
  const [credits, setCredits] = useState(null);
  const [modalPlan, setModalPlan] = useState(null);

  const loadCredits = () => {
    fetch("/api/credits").then(r => r.json()).then(d => { if (d.balance != null) setCredits(d.balance); }).catch(() => {});
  };

  useEffect(() => {
    loadCredits();
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
              <span className="text-[11px] text-primary font-semibold tracking-wide">$10 = 1,000 credits · bigger packs get up to 20% bonus</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
              Buy Credits
            </h1>
            <p className="text-on-surface-variant text-sm max-w-lg mx-auto leading-relaxed">
              One-time purchase. Every credit works across all AI tools, and bigger packs earn bonus credits on top.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {packs.map((pack) => {
              const total = Math.round(pack.base * (1 + pack.bonus / 100));
              return (
                <div
                  key={pack.id}
                  className={`relative rounded-2xl border p-6 flex flex-col transition-all duration-500 group ${
                    pack.popular
                      ? "border-primary/40 bg-gradient-to-br from-primary/[0.06] via-primary/[0.02] to-transparent shadow-2xl shadow-primary/10 scale-[1.02] hover:scale-[1.04]"
                      : pack.bestValue
                        ? "border-yellow-400/40 bg-gradient-to-br from-yellow-400/[0.05] via-yellow-400/[0.02] to-transparent shadow-2xl shadow-yellow-400/10 scale-[1.02] hover:scale-[1.04]"
                        : "border-surface-border/60 bg-surface-container-lowest/50 hover:border-primary/30 hover:scale-[1.02]"
                  }`}
                  style={pack.popular ? {
                    boxShadow: '0 8px 50px rgba(139,92,246,0.15), 0 0 100px rgba(139,92,246,0.04)',
                    background: 'linear-gradient(145deg, rgba(139,92,246,0.06) 0%, rgba(0,0,0,0.2) 100%)'
                  } : pack.bestValue ? {
                    boxShadow: '0 8px 50px rgba(250,204,21,0.12), 0 0 100px rgba(250,204,21,0.04)',
                    background: 'linear-gradient(145deg, rgba(250,204,21,0.05) 0%, rgba(0,0,0,0.2) 100%)'
                  } : {}}
                >
                  {pack.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <div className="px-5 py-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 rounded-full text-[8px] text-black font-extrabold uppercase tracking-[0.15em] shadow-[0_0_20px_rgba(250,204,21,0.4)] flex items-center gap-1.5">
                        <span className="text-[10px]">⭐</span> Most Popular
                      </div>
                    </div>
                  )}
                  {pack.bestValue && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <div className="px-5 py-1 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 rounded-full text-[8px] text-black font-extrabold uppercase tracking-[0.15em] shadow-[0_0_20px_rgba(250,204,21,0.4)] flex items-center gap-1.5">
                        <span className="text-[10px]">💎</span> Best Value
                      </div>
                    </div>
                  )}

                  <div className="mb-5 mt-1">
                    <h2 className="text-lg font-bold text-white">{pack.name}</h2>
                    <p className="text-[11px] text-on-surface-variant/70 leading-relaxed mt-1">{pack.sub}</p>
                  </div>

                  <div className="mb-5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold text-white tracking-tight">${pack.price}</span>
                      <span className="text-[11px] text-on-surface-variant/60 font-medium">one-time</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-surface-border/50 bg-surface-container-low/40 p-4 mb-5 space-y-2">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-on-surface-variant/70">Base credits</span>
                      <span className="text-white font-semibold">{pack.base.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-on-surface-variant/70">Bonus</span>
                      <span className={pack.bonus > 0 ? "text-green-400 font-semibold" : "text-on-surface-variant/50 font-semibold"}>
                        {pack.bonus > 0 ? `+${pack.bonus}%` : "0%"}
                      </span>
                    </div>
                    <div className="border-t border-surface-border/50 pt-2 flex items-center justify-between">
                      <span className="text-[12px] text-on-surface-variant/80">You get</span>
                      <span className="flex items-center gap-1.5 text-yellow-400 font-extrabold text-lg">
                        <Icon name="bolt" size={16} className="text-yellow-400" />
                        {total.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!isAuthenticated) { router.push("/login"); return; }
                      setModalPlan({ planId: pack.id, billingCycle: "one_time" });
                    }}
                    className={`w-full py-3 rounded-xl font-semibold text-sm mb-4 transition-all duration-200 active:scale-[0.97] hover:translate-y-[-1px] ${
                      pack.popular
                        ? "primary-gradient text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40"
                        : pack.bestValue
                          ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-lg shadow-yellow-400/25 hover:shadow-xl hover:shadow-yellow-400/40"
                          : "btn-subtle text-white hover:bg-primary/10 hover:border-primary/30"
                    }`}
                  >
                    Buy Now
                  </button>

                  <p className="text-center text-[10px] text-on-surface-variant/50">
                    {RATE} credits per $1 · credits never expire
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <PayPalCheckoutModal
        isOpen={modalPlan !== null}
        onClose={() => { setModalPlan(null); loadCredits(); }}
        planId={modalPlan?.planId || "creator"}
        billingCycle={modalPlan?.billingCycle || "one_time"}
      />

      </SidebarProvider>
    </div>
  );
}

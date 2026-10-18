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
// Bonus % is added on top of the base credits for each pack.
const packs = [
  { id: "beginner", name: "Starter", price: 10, base: 1000, bonus: 0 },
  { id: "builder", name: "Basic", price: 25, base: 2500, bonus: 5 },
  { id: "creator", name: "Pro", price: 50, base: 5000, bonus: 10 },
  { id: "pro", name: "Business", price: 100, base: 10000, bonus: 15, badge: "Most Popular" },
  { id: "elite", name: "Premium", price: 200, base: 20000, bonus: 20, badge: "Best Value" },
  { id: "ultimate", name: "Elite", price: 500, base: 50000, bonus: 20 },
];

export default function PricingPage() {
  const router = useRouter();
  const { setMobileOpen } = useSidebar();
  const { isAuthenticated } = useAuth();
  const [credits, setCredits] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(3);
  const [modalPlan, setModalPlan] = useState(null);

  const loadCredits = () => {
    fetch("/api/credits").then(r => r.json()).then(d => { if (d.balance != null) setCredits(d.balance); }).catch(() => {});
  };

  useEffect(() => { loadCredits(); }, []);

  const sel = packs[selectedIdx];
  const total = Math.round(sel.base * (1 + sel.bonus / 100));

  const payNow = () => {
    if (!isAuthenticated) { router.push("/login"); return; }
    setModalPlan(sel.id);
  };

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
              </div>
              <ProfileDropdown />
            </div>

            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20 mb-4">
                <Icon name="auto_awesome" className="text-[12px] text-primary" />
                <span className="text-[11px] text-primary font-semibold tracking-wide">$10 = 1,000 credits &middot; bigger packs get up to 20% bonus</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
                Buy Credits
              </h1>
              <p className="text-on-surface-variant text-sm max-w-lg mx-auto leading-relaxed">
                One-time purchase. Every credit works across all AI tools, and bigger packs earn bonus credits on top.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {packs.map((pack, i) => {
                const total = Math.round(pack.base * (1 + pack.bonus / 100));
                const selected = i === selectedIdx;
                return (
                  <button
                    key={pack.id}
                    onClick={() => setSelectedIdx(i)}
                    className={`relative text-left rounded-2xl border p-6 flex flex-col transition-all duration-300 group ${
                      selected
                        ? "border-primary/60 bg-primary/[0.06] shadow-2xl shadow-primary/10 scale-[1.02]"
                        : "border-surface-border/60 bg-surface-container-lowest/50 hover:border-primary/30 hover:scale-[1.02]"
                    }`}
                    style={selected ? {
                      boxShadow: '0 8px 50px rgba(139,92,246,0.15), 0 0 100px rgba(139,92,246,0.04)',
                      background: 'linear-gradient(145deg, rgba(139,92,246,0.06) 0%, rgba(0,0,0,0.2) 100%)'
                    } : {}}
                  >
                    {selected && (
                      <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Icon name="check" className="text-[12px] text-white" />
                      </div>
                    )}
                    {pack.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                        <div className="px-4 py-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 rounded-full text-[8px] text-black font-extrabold uppercase tracking-[0.15em] shadow-[0_0_20px_rgba(250,204,21,0.4)]">
                          {pack.badge}
                        </div>
                      </div>
                    )}

                    <div className="mb-4 mt-1">
                      <h2 className="text-sm font-bold text-on-surface-variant uppercase tracking-wide">{pack.name}</h2>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-4xl font-extrabold text-white tracking-tight">${pack.price}</span>
                        <span className="text-[11px] text-on-surface-variant/60 font-medium">USD</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-yellow-400 font-extrabold text-lg">
                      <Icon name="bolt" size={16} className="text-yellow-400" />
                      {pack.base.toLocaleString()} credits
                    </div>
                    <div className="text-[12px] text-green-400 font-semibold mt-1 h-4">
                      {pack.bonus > 0 ? `+${(total - pack.base).toLocaleString()} credits \u00b7 ${pack.bonus}%` : ""}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 max-w-xl mx-auto">
              <button
                onClick={payNow}
                className="w-full py-4 rounded-xl primary-gradient text-white font-bold text-base shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-200 active:scale-[0.98] hover:translate-y-[-1px]"
              >
                {`Pay $${sel.price} & Get ${total.toLocaleString()} Credits`}
              </button>
            </div>
          </div>
        </div>

        <PayPalCheckoutModal
          isOpen={modalPlan !== null}
          onClose={() => { setModalPlan(null); loadCredits(); }}
          planId={modalPlan || "pro"}
          billingCycle="one_time"
        />
      </SidebarProvider>
    </div>
  );
}
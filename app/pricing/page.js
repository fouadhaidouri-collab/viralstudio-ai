"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import ProfileDropdown from "../components/ProfileDropdown";
import { SidebarProvider, useSidebar } from "../components/SidebarContext";
import { useAuth } from "../lib/AuthContext";
import Icon from "../components/Icon";
import YouCanPayCheckoutModal from "../../components/payment/YouCanPayCheckoutModal";

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
  const [modalPlan, setModalPlan] = useState(null);
  const [paidResult, setPaidResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyParams, setVerifyParams] = useState(null);

  const loadCredits = () => {
    fetch("/api/credits").then(r => r.json()).then(d => { if (d.balance != null) setCredits(d.balance); }).catch(() => {});
  };

  // YouCan Pay can redirect back before the transaction is marked paid, so keep
  // polling for a while instead of showing "pending" on the first attempt.
  const runVerify = (params, attempt = 0) => {
    fetch(`/api/payments/youcanpay/verify?${params.toString()}`)
      .then(r => r.json())
      .then(d => {
        if (d.pending && attempt < 8) {
          setTimeout(() => runVerify(params, attempt + 1), 2500);
          return;
        }
        setPaidResult(d);
        setVerifying(false);
        loadCredits();
      })
      .catch(() => {
        if (attempt < 8) {
          setTimeout(() => runVerify(params, attempt + 1), 2500);
          return;
        }
        setPaidResult({ success: false, pending: true, message: "Payment received — confirming with YouCan Pay." });
        setVerifying(false);
      });
  };

  useEffect(() => {
    loadCredits();

    const sp = new URLSearchParams(window.location.search);
    // YouCan Pay appends these to success_url / error_url:
    //   ?transaction_id=<youcanpay id>&order_id=<our tx id>&is_success=1&code=000
    const providerTransactionId = sp.get("transaction_id");
    const orderId = sp.get("order_id") || sp.get("transactionId");
    const isSuccess = sp.get("is_success") || sp.get("success");
    const paid = sp.get("paid");

    if (providerTransactionId || orderId || paid) {
      window.history.replaceState({}, "", "/pricing");
    }

    if (paid === "failed" || isSuccess === "0") {
      setPaidResult({ success: false, message: "Payment was cancelled or failed." });
      return;
    }

    if (orderId || providerTransactionId) {
      setVerifying(true);
      const params = new URLSearchParams();
      if (orderId) params.set("orderId", orderId);
      if (providerTransactionId) params.set("providerTransactionId", providerTransactionId);
      setVerifyParams(params);
      runVerify(params);
      return;
    }

    // No return params: re-check recently pending payments. This recovers a
    // payment that settled after the buyer closed the tab or lost the redirect.
    if (!paid) {
      fetch("/api/payments/youcanpay/pending")
        .then(r => r.json())
        .then(async (d) => {
          for (const id of (d.orders || [])) {
            const res = await fetch(`/api/payments/youcanpay/verify?orderId=${encodeURIComponent(id)}`).then(r => r.json()).catch(() => null);
            if (res?.success) {
              setPaidResult(res);
              loadCredits();
              break;
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  const buy = (pack) => {
    if (!isAuthenticated) { router.push("/login"); return; }
    setModalPlan(pack.id);
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {packs.map((pack) => {
                const total = Math.round(pack.base * (1 + pack.bonus / 100));
                return (
                  <div
                    key={pack.id}
                    className="relative rounded-2xl border border-surface-border/60 bg-surface-container-lowest/50 p-6 flex flex-col transition-all duration-300 hover:border-primary/40 hover:-translate-y-0.5"
                  >
                    {pack.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                        <div className="px-4 py-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 rounded-full text-[8px] text-black font-extrabold uppercase tracking-[0.15em] shadow-[0_0_20px_rgba(250,204,21,0.4)]">
                          {pack.badge}
                        </div>
                      </div>
                    )}

                    <h2 className="text-sm font-bold text-on-surface-variant uppercase tracking-wide mt-1">{pack.name}</h2>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-4xl font-extrabold text-white tracking-tight">${pack.price}</span>
                      <span className="text-[11px] text-on-surface-variant/60 font-medium">USD</span>
                    </div>

                    <div className="mt-5 flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-yellow-400 font-extrabold text-lg whitespace-nowrap">
                          <Icon name="bolt" size={16} className="text-yellow-400" />
                          {pack.base.toLocaleString()} credits
                        </div>
                        <div className="text-[12px] text-green-400 font-semibold mt-1 h-4 whitespace-nowrap">
                          {pack.bonus > 0 ? `+${(total - pack.base).toLocaleString()} credits +${pack.bonus}%` : ""}
                        </div>
                      </div>
                      <button
                        onClick={() => buy(pack)}
                        className="shrink-0 px-5 py-2.5 rounded-lg primary-gradient text-white font-bold text-sm shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-200 active:scale-95"
                      >
                        Buy
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <YouCanPayCheckoutModal
          isOpen={modalPlan !== null}
          onClose={() => { setModalPlan(null); loadCredits(); }}
          planId={modalPlan || "pro"}
          billingCycle="one_time"
        />

        {(paidResult || verifying) && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={verifying ? undefined : () => setPaidResult(null)} />
            <div className="relative w-full max-w-md rounded-3xl border border-white/10 p-8 text-center shadow-2xl" style={{ background: "#161616" }}>
              {verifying ? (
                <>
                  <div className="w-14 h-14 rounded-full bg-yellow-400/10 flex items-center justify-center mx-auto mb-4">
                    <span className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <h2 className="text-xl font-extrabold text-white mb-2">Confirming payment...</h2>
                  <p className="text-sm text-on-surface-variant/60">Verifying with YouCan Pay.</p>
                </>
              ) : paidResult?.success ? (
                <>
                  <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <Icon name="check_circle" className="text-green-400" size={30} />
                  </div>
                  <h2 className="text-xl font-extrabold text-white mb-2">Payment confirmed!</h2>
                  <p className="text-sm text-on-surface-variant/60 mb-2">Your credits have been added to your account.</p>
                  <p className="text-lg font-bold text-yellow-400 mb-6">{(paidResult.credits || 0).toLocaleString()} credits</p>
                  <button onClick={() => setPaidResult(null)} className="px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-primary to-purple-700 text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all">
                    Continue
                  </button>
                </>
              ) : paidResult?.pending ? (
                <>
                  <div className="w-14 h-14 rounded-full bg-yellow-400/10 flex items-center justify-center mx-auto mb-4">
                    <Icon name="schedule" className="text-yellow-400" size={30} />
                  </div>
                  <h2 className="text-xl font-extrabold text-white mb-2">Payment received</h2>
                  <p className="text-sm text-on-surface-variant/60 mb-6">{paidResult?.message || "We are confirming your payment. Your credits will be added shortly."}</p>
                  <div className="flex items-center justify-center gap-3">
                    {verifyParams && (
                      <button onClick={() => { setPaidResult(null); setVerifying(true); runVerify(verifyParams); }} className="px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-primary to-purple-700 text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all">
                        Check again
                      </button>
                    )}
                    <button onClick={() => setPaidResult(null)} className="px-6 py-3.5 rounded-xl font-bold text-sm bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all">
                      Close
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                    <Icon name="error" className="text-red-400" size={30} />
                  </div>
                  <h2 className="text-xl font-extrabold text-white mb-2">Payment not completed</h2>
                  <p className="text-sm text-on-surface-variant/60 mb-6">{paidResult?.message || paidResult?.error || "Please try again."}</p>
                  <button onClick={() => setPaidResult(null)} className="px-8 py-3.5 rounded-xl font-bold text-sm bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all">
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </SidebarProvider>
    </div>
  );
}

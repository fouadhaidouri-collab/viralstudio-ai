"use client";
import { useState, useEffect } from "react";
import Icon from "../components/Icon";

const PLANS = {
  starter: { name: "Starter", monthly: 18, creditsPerMonth: 500 },
  professional: { name: "Professional", monthly: 25, creditsPerMonth: 1000 },
  team: { name: "Team", monthly: 83, creditsPerMonth: 5000 },
};

const DISCOUNT = 0.30;

const PAYMENT_TABS = [
  { id: "stripe", label: "Card", icon: "credit_card" },
  { id: "paypal", label: "PayPal", icon: "account_balance" },
  { id: "youcanpay", label: "YouCan Pay", icon: "payments" },
  { id: "crypto", label: "Crypto", icon: "currency_bitcoin" },
];

export default function PayPage() {
  const [activeTab, setActiveTab] = useState("stripe");
  const [planId, setPlanId] = useState("professional");
  const [annual, setAnnual] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const plan = PLANS[planId];
  const monthlyPrice = plan.monthly;
  const displayPrice = annual ? Math.round(monthlyPrice * 12 * (1 - DISCOUNT)) : monthlyPrice;
  const totalAnnual = Math.round(monthlyPrice * 12 * (1 - DISCOUNT));
  const credits = annual ? Math.round(plan.creditsPerMonth * 12 * (1 + DISCOUNT)) : plan.creditsPerMonth;

  const isStripeConfigured = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const isPayPalConfigured = !!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const isYouCanPayConfigured = !!process.env.NEXT_PUBLIC_YOUCANPAY_PUBLIC_KEY;

  const handleCheckout = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: activeTab === "card" ? "stripe" : activeTab,
          planId,
          billingCycle: annual ? "annual" : "monthly",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Checkout failed. Please try again.");
        setLoading(false);
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setError("No checkout URL returned");
        setLoading(false);
      }
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const getButtonText = () => {
    const tab = activeTab;
    if (tab === "stripe") return `Continue with Card`;
    if (tab === "paypal") return `Continue with PayPal`;
    if (tab === "youcanpay") return `Continue with YouCan Pay`;
    return "Complete Purchase";
  };

  const getButtonStyle = () => {
    if (activeTab === "stripe") return "from-primary to-purple-700 shadow-primary/30 hover:shadow-primary/40";
    if (activeTab === "paypal") return "from-blue-700 to-blue-600 shadow-blue-700/25 hover:shadow-blue-700/35";
    if (activeTab === "youcanpay") return "from-emerald-600 to-teal-600 shadow-emerald-700/25 hover:shadow-emerald-700/35";
    return "from-primary to-purple-700 shadow-primary/30 hover:shadow-primary/40";
  };

  const stripePci = activeTab === "stripe";

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-48 -right-48 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[180px] opacity-60" />
        <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] bg-[#06b6d4]/6 rounded-full blur-[150px] opacity-40" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full px-3 md:px-5 lg:px-6 py-6 md:py-10 min-h-screen flex flex-col">
        <header className="flex items-center justify-between mb-6 md:mb-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-primary to-purple-700 flex items-center justify-center shadow-lg shadow-primary/30">
              <Icon name="bolt" className="text-white text-lg" />
            </div>
            <span className="text-lg font-extrabold tracking-tight" style={{ fontFamily: 'Geist, sans-serif' }}>ViralStudio AI</span>
          </div>
          <div className="flex items-center gap-3">
            {process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.startsWith("https") && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg">
                <Icon name="lock" className="text-[12px] text-green-400" />
                <span className="text-[10px] text-green-400 font-semibold">Secure Checkout</span>
              </div>
            )}
            <span className="text-sm font-bold text-white/60">USD</span>
          </div>
        </header>

        <div className="flex-1 grid md:grid-cols-[1fr_360px] gap-6 md:gap-8 items-start">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold mb-1">Complete Your Purchase</h1>
            <p className="text-sm text-on-surface-variant/70 mb-6">Choose your preferred payment method below</p>

            <div className="flex flex-wrap items-center gap-2 mb-6">
              {Object.entries(PLANS).map(([key, p]) => {
                const pPrice = annual ? Math.round(p.monthly * 12 * (1 - DISCOUNT)) : p.monthly;
                return (
                  <button
                    key={key}
                    onClick={() => setPlanId(key)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                      planId === key
                        ? "bg-primary/15 border-primary/40 text-primary shadow-lg shadow-primary/10"
                        : "bg-surface-container-low border-surface-border/60 text-on-surface-variant hover:border-primary/30"
                    }`}
                  >
                    {p.name} ${pPrice}
                  </button>
                );
              })}
              <div className="flex items-center gap-1 p-0.5 bg-surface-container-low rounded-lg border border-surface-border/60 ml-2">
                <button onClick={() => setAnnual(false)} className={`px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all ${!annual ? "bg-surface-container-high text-white shadow-sm" : "text-on-surface-variant/60 hover:text-white"}`}>Monthly</button>
                <button onClick={() => setAnnual(true)} className={`px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all ${annual ? "bg-surface-container-high text-white shadow-sm" : "text-on-surface-variant/60 hover:text-white"}`}>Annual <span className="text-green-400 text-[8px]">-30%</span></button>
              </div>
            </div>

            <div className="flex items-center gap-1 p-1 bg-surface-container-low rounded-xl border border-surface-border/60 mb-6 w-fit">
              {PAYMENT_TABS.map((tab) => {
                const configured =
                  (tab.id === "stripe" && isStripeConfigured) ||
                  (tab.id === "paypal" && isPayPalConfigured) ||
                  (tab.id === "youcanpay" && isYouCanPayConfigured) ||
                  tab.id === "crypto";
                return (
                  <button
                    key={tab.id}
                    onClick={() => configured && setActiveTab(tab.id)}
                    disabled={!configured}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-surface-container-high text-white shadow-sm"
                        : configured
                          ? "text-on-surface-variant/60 hover:text-white hover:bg-surface-container/50"
                          : "text-on-surface-variant/30 cursor-not-allowed opacity-50"
                    }`}
                  >
                    <Icon name={tab.icon} className="text-sm" />
                    {tab.label}
                    {!configured && <span className="text-[8px] ml-1">Soon</span>}
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                <Icon name="error" className="text-sm" /> {error}
              </div>
            )}

            {/* Card - Stripe */}
            {activeTab === "stripe" && (
              <div className="glass-card rounded-2xl border border-white/5 p-6 card-glow animate-fade-in-up">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Icon name="credit_card" className="text-white text-lg" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">Credit / Debit Card</h3>
                    <p className="text-[11px] text-on-surface-variant/60">Visa, Mastercard, Amex, Apple Pay & Google Pay</p>
                  </div>
                </div>

                <div className="bg-surface-container-lowest border border-surface-border/60 rounded-xl p-5 mb-5">
                  <p className="text-xs text-on-surface-variant/70 leading-relaxed">
                    You will be redirected to <strong className="text-white">Stripe Checkout</strong> to securely complete your payment of <strong className="text-primary">${displayPrice} USD</strong>. Your plan will be activated immediately after payment confirmation.
                  </p>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  {[{ label: "Visa", color: "from-blue-600 to-blue-800" }, { label: "MC", color: "from-orange-500 to-red-600" }, { label: "Amex", color: "from-blue-400 to-blue-600" }].map((b) => (
                    <span key={b.label} className={`px-2.5 py-1 rounded-md text-[8px] font-bold text-white bg-gradient-to-br ${b.color} opacity-80`}>{b.label}</span>
                  ))}
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className={`w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 active:scale-[0.97] hover:translate-y-[-1px] bg-gradient-to-r ${getButtonStyle()} text-white shadow-lg tap-target disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
                >
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
                  ) : (
                    <><Icon name="lock" className="text-sm" /> {getButtonText()}</>
                  )}
                </button>

                <p className="text-[10px] text-on-surface-variant/40 text-center mt-3">Your payment info is encrypted with 256-bit SSL. PCI compliant.</p>
              </div>
            )}

            {/* PayPal */}
            {activeTab === "paypal" && (
              <div className="glass-card rounded-2xl border border-white/5 p-6 card-glow animate-fade-in-up">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-600/20">
                    <span className="text-white text-lg font-bold">P</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold">PayPal</h3>
                    <p className="text-[11px] text-on-surface-variant/60">Fast, secure payment with PayPal</p>
                  </div>
                </div>

                <div className="bg-surface-container-lowest border border-surface-border/60 rounded-xl p-5 mb-5">
                  <p className="text-xs text-on-surface-variant/70 mb-3 leading-relaxed">
                    You will be redirected to PayPal to complete your payment of <strong className="text-white">${displayPrice} USD</strong>. Your plan will be activated immediately after payment confirmation.
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-on-surface-variant/50">
                    <Icon name="check_circle" className="text-[12px] text-green-400" /> Buyer Protection
                    <Icon name="check_circle" className="text-[12px] text-green-400 ml-2" /> 14-Day Refund
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className={`w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 active:scale-[0.97] hover:translate-y-[-1px] bg-gradient-to-r ${getButtonStyle()} text-white shadow-lg tap-target disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
                >
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
                  ) : (
                    <><svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z"/></svg> {getButtonText()}</>
                  )}
                </button>
              </div>
            )}

            {/* YouCan Pay */}
            {activeTab === "youcanpay" && (
              <div className="glass-card rounded-2xl border border-white/5 p-6 card-glow animate-fade-in-up">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Icon name="payments" className="text-white text-lg" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">YouCan Pay</h3>
                    <p className="text-[11px] text-on-surface-variant/60">Pay with credit card via YouCan Pay (Morocco)</p>
                  </div>
                </div>

                <div className="bg-surface-container-lowest border border-surface-border/60 rounded-xl p-5 mb-5">
                  <p className="text-xs text-on-surface-variant/70 leading-relaxed">
                    You will be redirected to <strong className="text-white">YouCan Pay</strong> to complete your payment of <strong className="text-primary">${displayPrice} USD</strong>. Your plan will be activated after payment confirmation.
                  </p>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className={`w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 active:scale-[0.97] hover:translate-y-[-1px] bg-gradient-to-r ${getButtonStyle()} text-white shadow-lg tap-target disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
                >
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
                  ) : (
                    <><Icon name="lock" className="text-sm" /> {getButtonText()}</>
                  )}
                </button>
              </div>
            )}

            {/* Crypto - coming soon */}
            {activeTab === "crypto" && (
              <div className="glass-card rounded-2xl border border-white/5 p-6 card-glow animate-fade-in-up">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600 to-orange-600 flex items-center justify-center shadow-lg shadow-purple-600/20">
                    <span className="text-white text-lg font-bold">₿</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold">Cryptocurrency</h3>
                    <p className="text-[11px] text-on-surface-variant/60">Bitcoin, Ethereum, USDT & more</p>
                  </div>
                </div>

                <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-5 mb-5 text-center">
                  <Icon name="construction" className="text-2xl text-yellow-400 mb-2" />
                  <p className="text-sm text-yellow-300 font-semibold">Coming Soon</p>
                  <p className="text-[11px] text-on-surface-variant/60 mt-1">Crypto payments are under development. Please use Card, PayPal, or YouCan Pay.</p>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div>
            <div className="glass-card rounded-2xl border border-white/5 p-6 card-glow sticky top-6" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
              <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-4">Order Summary</h3>

              <div className="flex items-center gap-3 mb-5 pb-5 border-b border-white/5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-700 flex items-center justify-center shadow-lg shadow-primary/20">
                  <Icon name="auto_awesome" className="text-white text-xl" />
                </div>
                <div>
                  <p className="text-sm font-bold">{plan.name} Plan</p>
                  <p className="text-[10px] text-on-surface-variant/50">{annual ? `${credits} credits/year` : `${plan.creditsPerMonth} credits/month`}</p>
                </div>
              </div>

              <div className="space-y-2.5 mb-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant/70">{annual ? "Annual Plan" : "Monthly Plan"}</span>
                  <span className="font-semibold">${annual ? totalAnnual : monthlyPrice}.00</span>
                </div>
                {annual && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-on-surface-variant/70">Discount (30%)</span>
                    <span className="text-green-400 text-xs font-medium">-${(monthlyPrice * 12 * DISCOUNT).toFixed(0)}</span>
                  </div>
                )}
                <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-sm font-bold">Total</span>
                  <span className="text-xl font-extrabold text-primary">${displayPrice} USD</span>
                </div>
              </div>

              <div className="bg-green-500/5 border border-green-500/10 rounded-lg px-4 py-2.5 flex items-center gap-2 mb-5">
                <Icon name="flash_on" className="text-[14px] text-green-400" />
                <span className="text-[10px] text-green-300 font-medium">Instant access after payment confirmation</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: "enhanced_encryption", label: "SSL Encrypted" },
                  ...(stripePci ? [{ icon: "verified", label: "PCI Compliant" }] : []),
                  { icon: "support_agent", label: "24/7 Support" },
                  { icon: "replay", label: "14-Day Refund" },
                ].map((t) => (
                  <div key={t.label} className="flex items-center gap-1.5 px-2 py-1.5 bg-surface-container-low rounded-lg">
                    <Icon name={t.icon} className="text-[12px] text-primary" />
                    <span className="text-[9px] text-on-surface-variant/60 font-medium">{t.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <section className="mt-8 w-full">
          <div className="glass-card rounded-2xl p-6 border border-white/5 text-center card-glow" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.04), transparent)" }}>
            <h2 className="text-lg font-bold mb-1">Need Help?</h2>
            <p className="text-xs text-on-surface-variant/70 mb-4">Our support team is available 24/7</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={process.env.NEXT_PUBLIC_WHATSAPP_LINK || "#"}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.97] hover:translate-y-[-1px] bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/35 tap-target"
              >
                <Icon name="chat" className="text-sm" /> WhatsApp Support
              </a>
              <a
                href="mailto:support@viralstudio.ai"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.97] hover:translate-y-[-1px] btn-subtle text-white border border-surface-border/60 hover:border-primary/30 tap-target"
              >
                <Icon name="mail" className="text-sm" /> Email Us
              </a>
            </div>
          </div>
        </section>

        <footer className="mt-auto pt-10 pb-4 text-center">
          <div className="flex items-center justify-center gap-4 text-[10px] text-on-surface-variant/40 mb-4">
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <span className="w-px h-3 bg-white/10"></span>
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <span className="w-px h-3 bg-white/10"></span>
            <a href="#" className="hover:text-primary transition-colors">Refund Policy</a>
          </div>
          <p className="text-[10px] text-on-surface-variant/30">&copy; 2026 ViralStudio AI. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

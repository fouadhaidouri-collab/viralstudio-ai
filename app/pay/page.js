"use client";
import { useState, useEffect } from "react";

const wallets = {
  usdt: "TX7q9Qs3kS6LqX1p3RgY9Zn4mN8bH2vDcK",
  btc: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  eth: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
};

const plans = {
  starter: { name: "Starter", monthly: 25, credits: 500 },
  professional: { name: "Professional", monthly: 35, credits: 1000 },
  team: { name: "Team", monthly: 119, credits: 5000 },
};

const PAYMENT_TABS = [
  { id: "card", label: "Card", icon: "credit_card" },
  { id: "paypal", label: "PayPal", icon: "account_balance" },
  { id: "crypto", label: "Crypto", icon: "currency_bitcoin" },
];

const DISCOUNT = 0.3;

export default function PayPage() {
  const [copied, setCopied] = useState(null);
  const [activeTab, setActiveTab] = useState("card");
  const [planId, setPlanId] = useState("professional");
  const [annual, setAnnual] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("plan");
    const b = params.get("billing");
    if (p && plans[p]) setPlanId(p);
    if (b) setAnnual(b === "annual");
  }, []);

  const plan = plans[planId];
  const monthlyPrice = plan.monthly;
  const displayPrice = annual ? (monthlyPrice * (1 - DISCOUNT)).toFixed(0) : monthlyPrice;
  const totalAnnual = (monthlyPrice * (1 - DISCOUNT) * 12).toFixed(0);

  const copyAddr = (key, addr) => {
    navigator.clipboard.writeText(addr);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-48 -right-48 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[180px] opacity-60" />
        <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] bg-[#06b6d4]/6 rounded-full blur-[150px] opacity-40" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full px-3 md:px-5 lg:px-6 py-6 md:py-10 min-h-screen flex flex-col">
        {/* ===== HEADER ===== */}
        <header className="flex items-center justify-between mb-6 md:mb-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-primary to-purple-700 flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            </div>
            <span className="text-lg font-extrabold tracking-tight" style={{ fontFamily: 'Geist, sans-serif' }}>ViralStudio AI</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg">
              <span className="material-symbols-outlined text-[12px] text-green-400" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
              <span className="text-[10px] text-green-400 font-semibold">Secure Checkout</span>
            </div>
            <span className="text-sm font-bold text-white/60">USD</span>
          </div>
        </header>

        {/* ===== MAIN CONTENT ===== */}
        <div className="flex-1 grid md:grid-cols-[1fr_360px] gap-6 md:gap-8 items-start">

          {/* ===== LEFT: Payment Methods ===== */}
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold mb-1">Complete Your Purchase</h1>
            <p className="text-sm text-on-surface-variant/70 mb-6">Choose your preferred payment method below</p>

            {/* Plan & billing selector */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {Object.entries(plans).map(([key, p]) => {
                const pPrice = annual ? (p.monthly * (1 - DISCOUNT)).toFixed(0) : p.monthly;
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

            {/* Tab switcher */}
            <div className="flex items-center gap-1 p-1 bg-surface-container-low rounded-xl border border-surface-border/60 mb-6 w-fit">
              {PAYMENT_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-surface-container-high text-white shadow-sm"
                      : "text-on-surface-variant/60 hover:text-white hover:bg-surface-container/50"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ===== TAB 1: CARD ===== */}
            {activeTab === "card" && (
              <div className="glass-card rounded-2xl border border-white/5 p-6 card-glow animate-fade-in-up">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold">Credit / Debit Card</h3>
                    <p className="text-[11px] text-on-surface-variant/60">Visa, Mastercard, Amex, Apple Pay & Google Pay</p>
                  </div>
                </div>

                {/* Simulated card form */}
                <div className="space-y-3 mb-5">
                  <div>
                    <label className="text-[10px] font-semibold text-on-surface-variant/60 uppercase tracking-widest mb-1.5 block">Card Number</label>
                    <div className="flex items-center gap-2 bg-surface-container-lowest border border-surface-border/60 rounded-xl px-4 py-3 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                      <span className="material-symbols-outlined text-sm text-on-surface-variant/40">credit_card</span>
                      <input type="text" placeholder="4242 4242 4242 4242" className="bg-transparent text-sm text-white w-full outline-none placeholder:text-on-surface-variant/30 font-mono" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold text-on-surface-variant/60 uppercase tracking-widest mb-1.5 block">Expiry</label>
                      <input type="text" placeholder="MM/YY" className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/30 font-mono" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-on-surface-variant/60 uppercase tracking-widest mb-1.5 block">CVC</label>
                      <input type="text" placeholder="•••" className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/30 font-mono" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-on-surface-variant/60 uppercase tracking-widest mb-1.5 block">Cardholder Name</label>
                    <input type="text" placeholder="John Doe" className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/30 font-mono" />
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  {[{ label: "Visa", color: "from-blue-600 to-blue-800" }, { label: "MC", color: "from-orange-500 to-red-600" }, { label: "Amex", color: "from-blue-400 to-blue-600" }, { label: "APay", color: "from-gray-700 to-gray-900" }, { label: "GPay", color: "from-green-500 to-green-700" }].map((b) => (
                    <span key={b.label} className={`px-2.5 py-1 rounded-md text-[8px] font-bold text-white bg-gradient-to-br ${b.color} opacity-80`}>{b.label}</span>
                  ))}
                </div>

                <a
                  href={process.env.NEXT_PUBLIC_YOUCANPAY_LINK || "#"}
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 active:scale-[0.97] hover:translate-y-[-1px] bg-gradient-to-r from-primary to-purple-700 text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 tap-target"
                >
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                  Pay ${displayPrice} Securely
                </a>

                <p className="text-[10px] text-on-surface-variant/40 text-center mt-3">Your payment info is encrypted with 256-bit SSL</p>
              </div>
            )}

            {/* ===== TAB 2: PAYPAL ===== */}
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

                <div className="bg-[#0a0a0a] border border-surface-border/60 rounded-xl p-5 mb-5">
                  <p className="text-xs text-on-surface-variant/70 mb-3 leading-relaxed">
                    You will be redirected to PayPal to complete your payment of <strong className="text-white">${annual ? `$${totalAnnual} USD (annual)` : `$${displayPrice} USD`}</strong>. Your plan will be activated immediately after payment confirmation.
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-on-surface-variant/50">
                    <span className="material-symbols-outlined text-[12px] text-green-400" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Buyer Protection
                    <span className="material-symbols-outlined text-[12px] text-green-400 ml-2" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> 14-Day Refund
                  </div>
                </div>

                <a
                  href={process.env.NEXT_PUBLIC_PAYPAL_LINK || "#"}
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 active:scale-[0.97] hover:translate-y-[-1px] bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-lg shadow-blue-700/25 hover:shadow-xl hover:shadow-blue-700/35 tap-target"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z"/></svg>
                  Continue with PayPal
                </a>
              </div>
            )}

            {/* ===== TAB 3: CRYPTO ===== */}
            {activeTab === "crypto" && (
              <div className="glass-card rounded-2xl border border-white/5 p-6 card-glow animate-fade-in-up">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600 to-orange-600 flex items-center justify-center shadow-lg shadow-purple-600/20">
                    <span className="text-white text-lg font-bold">₿</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold">Cryptocurrency</h3>
                    <p className="text-[11px] text-on-surface-variant/60">Send exact amount to any of these addresses</p>
                  </div>
                </div>

                <p className="text-[11px] text-yellow-400/70 bg-yellow-400/5 border border-yellow-400/10 rounded-lg px-4 py-2.5 mb-5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                  Send <strong className="text-white">${annual ? `$${totalAnnual} USD` : `$${displayPrice} USD`}</strong>. After sending, contact us via WhatsApp with the TXID.
                </p>

                <div className="space-y-3">
                  {[
                    { key: "usdt", label: "USDT (TRC20)", addr: wallets.usdt, color: "from-green-500 to-emerald-700", icon: "T" },
                    { key: "btc", label: "Bitcoin", addr: wallets.btc, color: "from-orange-500 to-yellow-700", icon: "₿" },
                    { key: "eth", label: "Ethereum", addr: wallets.eth, color: "from-blue-400 to-indigo-700", icon: "♦" },
                  ].map((w) => (
                    <div key={w.key} className="bg-surface-container-lowest border border-surface-border/60 rounded-xl p-4 hover:border-primary/30 transition-all group">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${w.color} flex items-center justify-center text-white font-bold text-xs`}>{w.icon}</div>
                          <span className="text-xs font-semibold">{w.label}</span>
                        </div>
                        <button
                          onClick={() => copyAddr(w.key, w.addr)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-all text-[10px] font-semibold tap-target"
                        >
                          {copied === w.key ? (
                            <><span className="material-symbols-outlined text-[11px] text-green-400">check</span><span className="text-green-400">Copied!</span></>
                          ) : (
                            <><span className="material-symbols-outlined text-[11px] text-primary">content_copy</span><span className="text-primary">Copy</span></>
                          )}
                        </button>
                      </div>
                      <div className="flex items-center gap-2 bg-black/40 rounded-lg p-2.5 border border-white/5">
                        <code className="text-[10px] text-on-surface-variant/60 font-mono break-all select-all">{w.addr}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ===== RIGHT: Order Summary ===== */}
          <div>
            <div className="glass-card rounded-2xl border border-white/5 p-6 card-glow sticky top-6" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
              <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-4">Order Summary</h3>

              <div className="flex items-center gap-3 mb-5 pb-5 border-b border-white/5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-700 flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                </div>
                <div>
                  <p className="text-sm font-bold">{plan.name} Plan</p>
                  <p className="text-[10px] text-on-surface-variant/50">{plan.credits} AI Credits / month</p>
                </div>
              </div>

              <div className="space-y-2.5 mb-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant/70">Plan Price</span>
                  <span className="font-semibold">${displayPrice}.00</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant/70">{annual ? "Annual (30% off)" : "Billing"}</span>
                  <span className={annual ? "text-green-400 text-xs font-medium" : "text-on-surface-variant/70 text-xs"}>{annual ? `$${totalAnnual}/year` : "Monthly"}</span>
                </div>
                <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-sm font-bold">Total</span>
                  <span className="text-xl font-extrabold text-primary">${annual ? totalAnnual : displayPrice} USD</span>
                </div>
              </div>

              <div className="bg-green-500/5 border border-green-500/10 rounded-lg px-4 py-2.5 flex items-center gap-2 mb-5">
                <span className="material-symbols-outlined text-[14px] text-green-400" style={{ fontVariationSettings: "'FILL' 1" }}>flash_on</span>
                <span className="text-[10px] text-green-300 font-medium">Instant access after payment confirmation</span>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: "enhanced_encryption", label: "SSL Encrypted" },
                  { icon: "verified", label: "PCI Compliant" },
                  { icon: "support_agent", label: "24/7 Support" },
                  { icon: "replay", label: "14-Day Refund" },
                ].map((t) => (
                  <div key={t.label} className="flex items-center gap-1.5 px-2 py-1.5 bg-surface-container-low rounded-lg">
                    <span className="material-symbols-outlined text-[12px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>{t.icon}</span>
                    <span className="text-[9px] text-on-surface-variant/60 font-medium">{t.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ===== PROOF OF PAYMENT ===== */}
        <section className="mt-8 w-full">
          <div className="glass-card rounded-2xl p-6 border border-white/5 text-center card-glow" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.04), transparent)" }}>
            <h2 className="text-lg font-bold mb-1">Need Help?</h2>
            <p className="text-xs text-on-surface-variant/70 mb-4">Send your payment confirmation or transaction ID to activate instantly</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={process.env.NEXT_PUBLIC_WHATSAPP_LINK || "#"}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.97] hover:translate-y-[-1px] bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/35 tap-target"
              >
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span> WhatsApp Support
              </a>
              <a
                href="mailto:support@viralstudio.ai"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.97] hover:translate-y-[-1px] btn-subtle text-white border border-surface-border/60 hover:border-primary/30 tap-target"
              >
                <span className="material-symbols-outlined text-sm">mail</span> Email Us
              </a>
            </div>
          </div>
        </section>

        {/* ===== FOOTER ===== */}
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

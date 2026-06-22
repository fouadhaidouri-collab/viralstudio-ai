"use client";
import { useState, useEffect } from "react";

const DISCOUNT = 0.30;

const PLANS_DATA = {
  micro:   { name: "Micro", weekly: 9, credits: 306 },
  starter: { name: "Starter", monthly: 25, credits: 10200 },
  professional: { name: "Professional", monthly: 35, credits: 14280 },
  team:   { name: "Team", monthly: 119, credits: 48552 },
};

function YouCanPayButton({ planId, billingCycle, onError }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/youcanpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billingCycle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment failed");
      window.open(data.paymentUrl, "_blank");
    } catch (err) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full h-[55px] flex items-center justify-center gap-2.5 rounded-xl font-semibold text-sm transition-all bg-[#0066cc] hover:bg-[#0052a3] text-white disabled:opacity-50"
    >
      {loading ? (
        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
            <line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="2" />
          </svg>
          Credit YouCan
        </>
      )}
    </button>
  );
}

export default function PayPalCheckoutModal({ isOpen, onClose, planId, billingCycle }) {
  const [step, setStep] = useState("payment");
  const [error, setError] = useState("");

  const plan = PLANS_DATA[planId] || { name: planId, monthly: 0, credits: 0 };
  const planName = plan.name;

  let amount, credits, billingLabel;
  if (billingCycle === "weekly") {
    amount = plan.weekly || 0;
    credits = plan.credits;
    billingLabel = "Weekly";
  } else if (billingCycle === "annual") {
    const annualPerMonth = plan.monthly ? Math.round(plan.monthly * (1 - DISCOUNT)) : 0;
    amount = annualPerMonth * 12;
    credits = Math.round(plan.credits * (1 + DISCOUNT));
    billingLabel = "Annual";
  } else {
    amount = plan.monthly || 0;
    credits = Math.round(plan.credits / 12);
    billingLabel = "Monthly";
  }

  useEffect(() => {
    if (!isOpen) {
      setStep("payment");
      setError("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && step === "payment") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, step]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={step === "payment" ? onClose : undefined}
      />

      <div
        className="relative w-full max-w-[580px] rounded-3xl border border-white/10 shadow-2xl animate-fade-in-up overflow-hidden"
        style={{ background: "#161616" }}
      >
        {step === "payment" && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-all z-10"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M13 1L1 13M1 1l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-white/60" />
            </svg>
          </button>
        )}

        {step === "payment" && (
          <div className="p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-extrabold text-white mb-2 pr-8">
              Get Instant Access to {planName} Plan
            </h2>
            <p className="text-sm text-on-surface-variant/60 mb-6 leading-relaxed">
              Everything you need to create more, faster — pro-level tools, priority speed, secure payment, and cancel anytime.
            </p>

            <div className="bg-white/[0.03] border border-white/5 rounded-xl px-5 py-3 mb-6 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-white">{planName} Plan</span>
                <span className="text-[11px] text-on-surface-variant/50 ml-2 capitalize">{billingLabel}</span>
                <p className="text-[10px] text-yellow-400 font-medium mt-0.5">{credits.toLocaleString()} credits/{billingCycle === "weekly" ? "week" : billingCycle === "annual" ? "year" : "month"}</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-extrabold text-white">${amount}</span>
                <span className="text-[11px] text-on-surface-variant/50 ml-1">USD</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {error}
              </div>
            )}

            <YouCanPayButton
              planId={planId}
              billingCycle={billingCycle}
              onError={setError}
            />

            <div className="mt-5 flex items-center justify-center gap-4 text-[10px] text-on-surface-variant/40">
              <span>SSL Encrypted</span>
              <span className="w-px h-3 bg-white/10" />
              <span>24/7 Support</span>
              <span className="w-px h-3 bg-white/10" />
              <span>14-Day Refund</span>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="p-6 md:p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17L4 12" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-xl font-extrabold text-white mb-2">Payment confirmed!</h2>
            <p className="text-sm text-on-surface-variant/60 mb-2">Your credits have been added to your account.</p>
            <p className="text-lg font-bold text-yellow-400 mb-6">{credits.toLocaleString()} credits</p>
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-primary to-purple-700 text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all"
            >
              Go to Dashboard
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

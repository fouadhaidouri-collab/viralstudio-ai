"use client";
import { useState, useEffect } from "react";
import Icon from "../../app/components/Icon";

const PLANS_DATA = {
  beginner: { name: "Starter",  price: 10, baseCredits: 1000, bonusPercent: 0 },
  builder:  { name: "Basic",    price: 25, baseCredits: 2500, bonusPercent: 5 },
  creator:  { name: "Pro",      price: 50, baseCredits: 5000, bonusPercent: 10 },
  pro:      { name: "Business", price: 100, baseCredits: 10000, bonusPercent: 15 },
  elite:    { name: "Premium",  price: 200, baseCredits: 20000, bonusPercent: 20 },
  ultimate: { name: "Elite",    price: 500, baseCredits: 50000, bonusPercent: 20 },
};

export default function YouCanPayCheckoutModal({ isOpen, onClose, planId, billingCycle }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [refCode, setRefCode] = useState("");

  const plan = PLANS_DATA[planId] || { name: planId, price: 0, baseCredits: 0, bonusPercent: 0 };
  const amount = plan.price || 0;
  const credits = Math.round((plan.baseCredits || 0) * (1 + (plan.bonusPercent || 0) / 100));
  const discountMultiplier = (100 - couponDiscount) / 100;

  useEffect(() => {
    if (!isOpen) {
      setError("");
      setCouponCode("");
      setCouponDiscount(0);
      setCouponError("");
      setRefCode("");
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === "Escape" && !loading) onClose(); };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, loading]);

  const payNow = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/payments/youcanpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billingCycle, couponCode: couponDiscount > 0 ? couponCode : "", refCode }),
      });
      const data = await res.json();
      if (!res.ok || !data.paymentUrl) throw new Error(data.error || "Could not start the payment");
      window.location.href = data.paymentUrl;
    } catch (e) {
      setError(e.message || "Could not start the payment");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={loading ? undefined : onClose} />

      <div
        className="relative w-full max-w-[520px] max-h-[90vh] rounded-3xl border border-white/10 shadow-2xl animate-fade-in-up overflow-y-auto"
        style={{ background: "#161616" }}
      >
        {!loading && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-all z-10"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M13 1L1 13M1 1l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-white/60" />
            </svg>
          </button>
        )}

        <div className="p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-extrabold text-white mb-2 pr-8">
            Get {plan.name} Credits
          </h2>
          <p className="text-sm text-on-surface-variant/60 mb-6 leading-relaxed">
            You will be redirected to YouCan Pay to complete the payment securely.
          </p>

          <div className="bg-white/[0.03] border border-white/5 rounded-xl px-5 py-3 mb-4 flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-white">{plan.name} Pack</span>
              <span className="text-[11px] text-on-surface-variant/50 ml-2">One-time</span>
              <p className="text-[10px] text-yellow-400 font-medium mt-0.5">{credits.toLocaleString()} credits</p>
            </div>
            <div className="text-right">
              {couponDiscount > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-on-surface-variant/50 line-through">${amount}</span>
                  <span className="text-lg font-extrabold text-green-400">${(amount * discountMultiplier).toFixed(2)}</span>
                  <span className="text-[11px] text-on-surface-variant/50">USD</span>
                </div>
              ) : (
                <>
                  <span className="text-lg font-extrabold text-white">${amount}</span>
                  <span className="text-[11px] text-on-surface-variant/50 ml-1">USD</span>
                </>
              )}
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                placeholder="Coupon code"
                className="flex-1 px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 transition-colors uppercase tracking-wider"
              />
              <button
                onClick={async () => {
                  if (!couponCode.trim()) return;
                  setCouponValidating(true);
                  setCouponError("");
                  setCouponDiscount(0);
                  try {
                    const res = await fetch("/api/coupons/validate", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ code: couponCode, planId, billingCycle }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      setCouponError(data.error || "Invalid coupon");
                    } else {
                      setCouponDiscount(data.discount_percent);
                      if (data.is_affiliate) setRefCode(couponCode);
                    }
                  } catch {
                    setCouponError("Server error");
                  }
                  setCouponValidating(false);
                }}
                disabled={couponValidating || !couponCode.trim()}
                className="px-4 py-3 rounded-xl text-xs font-semibold bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 transition-all whitespace-nowrap disabled:opacity-40"
              >
                {couponValidating ? "..." : "Apply"}
              </button>
            </div>

            {couponDiscount > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <Icon name="check_circle" className="text-green-400 shrink-0" size={14} />
                <span className="text-xs text-green-400">{couponCode} applied - {couponDiscount}% off</span>
                <button onClick={() => { setCouponCode(""); setCouponDiscount(0); setCouponError(""); setRefCode(""); }} className="ml-auto text-[10px] text-on-surface-variant hover:text-white transition-all">Remove</button>
              </div>
            )}
            {couponError && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <Icon name="error" className="text-red-400 shrink-0" size={14} />
                <span className="text-xs text-red-400">{couponError}</span>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              {error}
            </div>
          )}

          <button
            onClick={payNow}
            disabled={loading}
            className="w-full py-4 rounded-xl primary-gradient text-white font-bold text-base shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Redirecting to YouCan Pay...
              </>
            ) : (
              <>
                <Icon name="lock" size={16} className="text-white" />
                Pay ${amount} with YouCan Pay
              </>
            )}
          </button>

          <div className="mt-5 flex items-center justify-center gap-4 text-[10px] text-on-surface-variant/40">
            <span>SSL Encrypted</span>
            <span className="w-px h-3 bg-white/10" />
            <span>24/7 Support</span>
            <span className="w-px h-3 bg-white/10" />
            <span>14-Day Refund</span>
          </div>
        </div>
      </div>
    </div>
  );
}

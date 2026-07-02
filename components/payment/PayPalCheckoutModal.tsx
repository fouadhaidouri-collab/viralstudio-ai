"use client";
import { useState, useEffect, useCallback } from "react";
import Icon from "../../app/components/Icon";
import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer,
} from "@paypal/react-paypal-js";

const DISCOUNT = 0.30;

const PLANS_DATA = {
  micro:   { name: "Micro", weekly: 9, credits: 306 },
  starter: { name: "Starter", monthly: 25, credits: 10200 },
  professional: { name: "Professional", monthly: 35, credits: 14280 },
  team:   { name: "Team", monthly: 119, credits: 48552 },
};

function PayPalButtonGroup({ planId, billingCycle, refCode, couponCode, onSuccess, onError }) {
  const [{ isPending, isResolved }] = usePayPalScriptReducer();

  const createOrder = useCallback(async () => {
    const res = await fetch("/api/paypal/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, billingCycle, refCode, couponCode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create order");
    return data.orderId;
  }, [planId, billingCycle, refCode, couponCode]);

  const onApprove = useCallback(async (data) => {
    const res = await fetch("/api/paypal/capture-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderID: data.orderID }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Capture failed");
    onSuccess(result);
  }, [onSuccess]);

  const onErrorHandler = useCallback((err) => {
    onError(err?.message || "PayPal payment failed");
  }, [onError]);

  return (
    <div className="space-y-3">
      <div className="min-h-[55px]">
        {isPending && (
          <div className="flex items-center justify-center h-[55px] bg-[#222] rounded-xl">
            <span className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {isResolved && (
          <PayPalButtons
            fundingSource="paypal"
            style={{ layout: "vertical", color: "gold", shape: "pill", label: "pay" }}
            createOrder={createOrder}
            onApprove={onApprove}
            onError={onErrorHandler}
          />
        )}
      </div>

      <div className="min-h-[55px]">
        {isPending && (
          <div className="flex items-center justify-center h-[55px] bg-[#222] rounded-xl">
            <span className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {isResolved && (
          <PayPalButtons
            fundingSource="card"
            style={{ layout: "vertical", color: "black", shape: "pill", label: "checkout" }}
            createOrder={createOrder}
            onApprove={onApprove}
            onError={onErrorHandler}
          />
        )}
      </div>
    </div>
  );
}

export default function PayPalCheckoutModal({ isOpen, onClose, planId, billingCycle }) {
  const [step, setStep] = useState("payment");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [refCodeInput, setRefCodeInput] = useState("");
  const [refCodeApplied, setRefCodeApplied] = useState("");
  const [refCodeValidating, setRefCodeValidating] = useState(false);
  const [refCodeError, setRefCodeError] = useState("");

  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

  const plan = PLANS_DATA[planId] || { name: planId, monthly: 0, credits: 0 };
  const planName = plan.name;

  const discountMultiplier = (100 - couponDiscount) / 100;

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

  const handleSuccess = (result) => {
    setSuccess(result);
    setStep("success");
  };

  useEffect(() => {
    if (!isOpen) {
      setStep("payment");
      setError("");
      setSuccess(null);
      setRefCodeInput("");
      setRefCodeApplied("");
      setRefCodeError("");
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
        className="relative w-full max-w-[580px] max-h-[90vh] rounded-3xl border border-white/10 shadow-2xl animate-fade-in-up"
        style={{ background: "#161616" }}
      >
        <div className="overflow-y-auto max-h-[90vh] rounded-3xl">
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

            <div className="bg-white/[0.03] border border-white/5 rounded-xl px-5 py-3 mb-4 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-white">{planName} Plan</span>
                <span className="text-[11px] text-on-surface-variant/50 ml-2 capitalize">{billingLabel}</span>
                <p className="text-[10px] text-yellow-400 font-medium mt-0.5">{credits.toLocaleString()} credits/{billingCycle === "weekly" ? "week" : billingCycle === "annual" ? "year" : "month"}</p>
              </div>
              <div className="text-right">
                {couponDiscount > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-on-surface-variant/50 line-through">${amount}</span>
                    <span className="text-lg font-extrabold text-green-400">${(amount * discountMultiplier).toFixed(0)}</span>
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
                  <span className="text-xs text-green-400">{couponCode} applied — {couponDiscount}% off</span>
                  <button onClick={() => { setCouponCode(""); setCouponDiscount(0); setCouponError(""); }} className="ml-auto text-[10px] text-on-surface-variant hover:text-white transition-all">Remove</button>
                </div>
              )}
              {couponError && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <Icon name="error" className="text-red-400 shrink-0" size={14} />
                  <span className="text-xs text-red-400">{couponError}</span>
                </div>
              )}
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={refCodeInput}
                  onChange={(e) => setRefCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  placeholder="Referral code"
                  className="flex-1 px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 transition-colors uppercase tracking-wider"
                />
                <button
                  onClick={async () => {
                    if (!refCodeInput.trim()) return;
                    setRefCodeValidating(true);
                    setRefCodeError("");
                    setRefCodeApplied("");
                    try {
                      const res = await fetch("/api/affiliates/validate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ code: refCodeInput }),
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        setRefCodeError(data.error || "Invalid referral code");
                      } else {
                        setRefCodeApplied(refCodeInput);
                      }
                    } catch {
                      setRefCodeError("Server error");
                    }
                    setRefCodeValidating(false);
                  }}
                  disabled={refCodeValidating || !refCodeInput.trim()}
                  className="px-4 py-3 rounded-xl text-xs font-semibold bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 transition-all whitespace-nowrap disabled:opacity-40"
                >
                  {refCodeValidating ? "..." : "Apply"}
                </button>
              </div>
              {refCodeApplied && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Icon name="check_circle" className="text-blue-400 shrink-0" size={14} />
                  <span className="text-xs text-blue-400">{refCodeApplied} applied</span>
                  <button onClick={() => { setRefCodeInput(""); setRefCodeApplied(""); setRefCodeError(""); }} className="ml-auto text-[10px] text-on-surface-variant hover:text-white transition-all">Remove</button>
                </div>
              )}
              {refCodeError && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <Icon name="error" className="text-red-400 shrink-0" size={14} />
                  <span className="text-xs text-red-400">{refCodeError}</span>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {error}
              </div>
            )}

            {paypalClientId && (
              <>
                <PayPalScriptProvider
                  options={{
                    clientId: paypalClientId,
                    currency: "USD",
                    intent: "capture",
                    components: "buttons",
                  }}
                >
                  <PayPalButtonGroup
                    planId={planId}
                    billingCycle={billingCycle}
                    refCode={refCodeApplied}
                    couponCode={couponDiscount > 0 ? couponCode : ""}
                    onSuccess={handleSuccess}
                    onError={setError}
                  />
                </PayPalScriptProvider>

              </>
            )}

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
    </div>
  );
}

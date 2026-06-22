"use client";
import { useState, useEffect, useCallback } from "react";
import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer,
} from "@paypal/react-paypal-js";

const PLAN_NAMES = {
  starter: "Starter",
  professional: "Professional",
  team: "Team",
};

function PayPalButtonGroup({ amount, planId, billingCycle, onSuccess, onError }) {
  const [{ isPending, isResolved }] = usePayPalScriptReducer();
  const [cardEligible, setCardEligible] = useState(true);

  const createOrder = useCallback(async () => {
    const res = await fetch("/api/paypal/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, billingCycle }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create order");
    return data.orderId;
  }, [planId, billingCycle]);

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
    console.error("PayPal error:", err);
    onError(err?.message || "PayPal payment failed");
  }, [onError]);

  return (
    <div className="space-y-4">
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

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-[11px] text-on-surface-variant/40 font-medium uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <div className="min-h-[55px]">
        {isPending && (
          <div className="flex items-center justify-center h-[55px] bg-[#222] rounded-xl">
            <span className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {isResolved && cardEligible && (
          <PayPalButtons
            fundingSource="card"
            style={{ layout: "vertical", color: "black", shape: "pill", label: "checkout" }}
            createOrder={createOrder}
            onApprove={onApprove}
            onError={(err) => {
              if (err?.message?.includes("not eligible") || err?.data?.details?.[0]?.issue === "INSTRUMENT_DECLINED") {
                setCardEligible(false);
              } else {
                onErrorHandler(err);
              }
            }}
          />
        )}
        {isResolved && !cardEligible && (
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl px-5 py-4 text-center">
            <p className="text-xs text-on-surface-variant/60">
              Card payment is not available for this account. Please use PayPal or try another payment method.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function YouCanPayButton({ amount, planId, billingCycle, onSuccess, onError }) {
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
      if (!res.ok) throw new Error(data.error || "YouCan Pay failed");
      window.open(data.paymentUrl, "_blank");
      onSuccess?.();
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
          Credit
        </>
      )}
    </button>
  );
}

export default function PayPalCheckoutModal({ isOpen, onClose, planId, billingCycle }) {
  const [step, setStep] = useState("payment");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

  const planName = PLAN_NAMES[planId] || planId;
  const amount = billingCycle === "annual"
    ? ({ starter: 151, professional: 294, team: 697 })[planId] || 0
    : ({ starter: 18, professional: 25, team: 83 })[planId] || 0;

  useEffect(() => {
    if (!isOpen) {
      setStep("payment");
      setError("");
      setSuccess(null);
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

  const handleSuccess = (result) => {
    setSuccess(result);
    setStep("success");
  };

  const handleError = (msg) => {
    setError(msg);
  };

  const billingLabel = billingCycle === "annual" ? "Annual" : "Monthly";

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

            {!paypalClientId ? (
              <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl px-5 py-4 text-center">
                <p className="text-sm text-yellow-300 font-medium">PayPal not configured</p>
                <p className="text-[11px] text-on-surface-variant/60 mt-1">Please contact support to complete your purchase.</p>
              </div>
            ) : (
              <PayPalScriptProvider
                options={{
                  clientId: paypalClientId,
                  currency: "USD",
                  intent: "capture",
                  components: "buttons",
                }}
              >
                <PayPalButtonGroup
                  amount={amount}
                  planId={planId}
                  billingCycle={billingCycle}
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
              </PayPalScriptProvider>
            )}

            <div className="mt-4">
              <YouCanPayButton
                amount={amount}
                planId={planId}
                billingCycle={billingCycle}
                onSuccess={() => {}}
                onError={handleError}
              />
            </div>

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
            <p className="text-lg font-bold text-yellow-400 mb-6">{success?.credits?.toLocaleString()} credits</p>
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

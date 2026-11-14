"use client";

declare global {
  interface Window {
    Paddle?: any;
    __viralStudioPaddleInitialized?: boolean;
  }
}

import { useState } from "react";
import { useAuth } from "../../app/lib/AuthContext";

export default function PaddleCheckoutModal({ isOpen, onClose, planId, billingCycle = "one_time" }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const startCheckout = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/payments/paddle/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billingCycle }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to start checkout");
      if (!data.clientToken || !data.priceId) {
        throw new Error("Paddle setup is incomplete. Please contact support.");
      }

      const openCheckout = () => {
        if (!window.Paddle) throw new Error("Paddle Checkout could not be loaded.");
        if (!window.__viralStudioPaddleInitialized) {
          if (data.environment === "sandbox") window.Paddle.Environment.set("sandbox");
          window.Paddle.Initialize({ token: data.clientToken });
          window.__viralStudioPaddleInitialized = true;
        }
        window.Paddle.Checkout.open({
          items: [{ priceId: data.priceId, quantity: 1 }],
          customer: user?.email ? { email: user.email } : undefined,
          customData: {
            transactionId: data.transactionId,
            userId: data.userId,
            planId: data.planId,
            credits: data.credits,
          },
          settings: {
            displayMode: "overlay",
            theme: "dark",
            successUrl: `${window.location.origin}/pricing?transactionId=${encodeURIComponent(data.transactionId)}`,
          },
        });
      };

      if (window.Paddle) openCheckout();
      else {
        const existing = document.querySelector('script[data-paddle-js="true"]');
        if (existing) {
          const retry = () => { if (window.Paddle) openCheckout(); else setError("Paddle Checkout could not be loaded. Please refresh and try again."); };
          existing.addEventListener("load", retry, { once: true });
          return;
        }
        const script = document.createElement("script");
        script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
        script.async = true;
        script.dataset.paddleJs = "true";
        script.onload = openCheckout;
        script.onerror = () => setError("Could not load Paddle Checkout. Please try again.");
        document.head.appendChild(script);
      }
    } catch (err) {
      setError(err.message || "Unable to start checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <button aria-label="Close payment dialog" className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#17171b] p-7 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-white/50 hover:text-white" aria-label="Close">✕</button>
        <div className="w-12 h-12 rounded-2xl bg-violet-500/15 text-violet-300 flex items-center justify-center text-2xl mb-5">↗</div>
        <h2 className="text-xl font-extrabold text-white mb-2">Secure checkout</h2>
        <p className="text-sm text-white/60 leading-6 mb-6">Complete your credit purchase securely with Paddle. Your credits are added after Paddle confirms the payment.</p>
        {error && <p role="alert" className="text-sm text-red-300 mb-4">{error}</p>}
        <button onClick={startCheckout} disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3.5 text-sm font-bold text-white disabled:opacity-60">
          {loading ? "Preparing checkout..." : "Continue with Paddle"}
        </button>
        <p className="text-[11px] text-center text-white/35 mt-4">Secure payment powered by Paddle</p>
      </div>
    </div>
  );
}

"use client";

declare global {
  interface Window {
    Paddle?: any;
    __viralStudioPaddleInitialized?: boolean;
  }
}

import { useEffect, useState } from "react";
import { useAuth } from "../../app/lib/AuthContext";

function loadPaddle(): Promise<void> {
  if (window.Paddle) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-paddle-js="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Could not load Paddle Checkout.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.dataset.paddleJs = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Paddle Checkout."));
    document.head.appendChild(script);
  });
}

export default function PaddleCheckoutModal({ isOpen, onClose, planId, billingCycle = "one_time" }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

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

        await loadPaddle();
        if (cancelled) return;
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
            displayMode: "inline",
            theme: "dark",
            variant: "multi-page",
            frameTarget: "viralstudio-paddle-checkout",
            frameInitialHeight: 650,
            frameStyle: "width: 100%; min-width: 312px; background-color: transparent; border: none;",
            successUrl: `${window.location.origin}/pricing?transactionId=${encodeURIComponent(data.transactionId)}`,
          },
        });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to start checkout");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    startCheckout();
    return () => { cancelled = true; };
  }, [isOpen, planId, billingCycle, user?.email]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-start justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:items-center sm:p-5">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="paddle-checkout-title"
        className="relative my-3 w-full max-w-2xl rounded-3xl border border-white/10 bg-[#17191c] p-4 shadow-2xl sm:my-6 sm:p-6"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-lg px-2 py-1 text-white/55 transition hover:bg-white/10 hover:text-white"
          aria-label="Close checkout"
        >
          ✕
        </button>
        <div className="mb-4 pr-10">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#06C668]">ViralStudio AI</p>
          <h2 id="paddle-checkout-title" className="text-xl font-extrabold text-white">Secure checkout</h2>
          <p className="mt-1 text-sm text-white/55">Complete your purchase securely with Paddle. Credits are added after payment confirmation.</p>
        </div>
        {loading && (
          <div className="flex min-h-40 items-center justify-center gap-3 text-sm text-white/65">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-[#06C668]" />
            Preparing secure checkout…
          </div>
        )}
        {error && (
          <div role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}
        <div id="viralstudio-paddle-checkout" className="w-full overflow-hidden rounded-xl" />
        <p className="mt-4 text-center text-[11px] text-white/35">Secure payment powered by Paddle</p>
      </section>
    </div>
  );
}

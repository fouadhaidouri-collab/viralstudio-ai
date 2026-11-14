"use client";

declare global {
  interface Window {
    Paddle?: any;
    __viralStudioPaddleInitialized?: boolean;
    __viralStudioPaddleEventCallback?: (event: any) => void;
  }
}

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../app/lib/AuthContext";

const PACK_DETAILS = {
  beginner: { name: "Starter Credit Pack", price: 10, credits: 1000 },
  builder: { name: "Basic Credit Pack", price: 25, credits: 2625 },
  creator: { name: "Pro Credit Pack", price: 50, credits: 5500 },
  pro: { name: "Business Credit Pack", price: 100, credits: 11500 },
  elite: { name: "Premium Credit Pack", price: 200, credits: 24000 },
  ultimate: { name: "Elite Credit Pack", price: 500, credits: 60000 },
};

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

function money(value: number, currency = "USD") {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
}

export default function PaddleCheckoutModal({ isOpen, onClose, planId, billingCycle = "one_time" }) {
  const { user } = useAuth();
  const pack = useMemo(() => PACK_DETAILS[planId] || PACK_DETAILS.pro, [planId]);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [totals, setTotals] = useState<{ subtotal?: number; tax?: number; total?: number; currency?: string } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setLoading(false);
      setStarted(false);
      setAccepted(false);
      setError("");
      setTotals(null);
    }
  }, [isOpen]);

  const startCheckout = async () => {
    if (!accepted || loading || started) return;
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
        throw new Error("Secure checkout is temporarily unavailable. Please try again later.");
      }

      await loadPaddle();
      if (!window.Paddle) throw new Error("Paddle Checkout could not be loaded.");

      window.__viralStudioPaddleEventCallback = (event) => {
        if (event?.name === "checkout.loaded" || event?.name === "checkout.updated" || event?.name === "checkout.items.updated") {
          const value = event.data?.totals;
          if (value) {
            setTotals({
              subtotal: Number(value.subtotal ?? 0),
              tax: Number(value.tax ?? 0),
              total: Number(value.total ?? value.balance ?? 0),
              currency: event.data?.currency_code || "USD",
            });
          }
        }
      };

      if (!window.__viralStudioPaddleInitialized) {
        if (data.environment === "sandbox") window.Paddle.Environment.set("sandbox");
        window.Paddle.Initialize({
          token: data.clientToken,
          eventCallback: (event) => window.__viralStudioPaddleEventCallback?.(event),
        });
        window.__viralStudioPaddleInitialized = true;
      }

      setStarted(true);
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
          frameInitialHeight: "650",
          frameStyle: "width: 100%; min-width: 312px; background-color: transparent; border: none;",
          successUrl: `${window.location.origin}/pricing?transactionId=${encodeURIComponent(data.transactionId)}`,
        },
      });
    } catch (err) {
      setStarted(false);
      setError(err instanceof Error ? err.message : "Unable to start checkout");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-start justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:items-center sm:p-5">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="paddle-checkout-title"
        className="relative my-3 w-full max-w-3xl rounded-3xl border border-white/10 bg-[#17191c] p-4 shadow-2xl sm:my-6 sm:p-6"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-lg px-2 py-1 text-white/55 transition hover:bg-white/10 hover:text-white"
          aria-label="Close checkout"
        >
          ✕
        </button>

        <div className="mb-5 pr-10">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#06C668]">ViralStudio AI</p>
          <h2 id="paddle-checkout-title" className="text-xl font-extrabold text-white">Secure checkout</h2>
          <p className="mt-1 text-sm text-white/55">Review your one-time credit purchase before continuing to Paddle.</p>
        </div>

        <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-bold text-white">{pack.name}</p>
              <p className="mt-1 text-sm text-white/55">{pack.credits.toLocaleString()} credits · one-time purchase · no automatic renewal</p>
            </div>
            <p className="text-xl font-extrabold text-white">{money(pack.price)}</p>
          </div>
          <div className="mt-4 space-y-2 border-t border-white/10 pt-3 text-sm">
            <div className="flex justify-between text-white/65"><span>Subtotal</span><span>{totals ? money(totals.subtotal ?? pack.price, totals.currency) : money(pack.price)}</span></div>
            <div className="flex justify-between text-white/65"><span>Tax</span><span>{totals ? money(totals.tax ?? 0, totals.currency) : "Calculated by Paddle at checkout"}</span></div>
            <div className="flex justify-between border-t border-white/10 pt-2 font-bold text-white"><span>Total</span><span>{totals ? money(totals.total ?? pack.price, totals.currency) : "Final total shown by Paddle"}</span></div>
          </div>
          <p className="mt-3 text-[11px] leading-5 text-white/40">Taxes are calculated by Paddle based on the billing location entered at checkout. The final amount is shown before payment is submitted.</p>
        </div>

        {!started && (
          <div className="mb-5">
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-white/75">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-[#06C668]"
              />
              <span>
                I have read and agree to the <a href="/terms" target="_blank" rel="noreferrer" className="text-[#06C668] underline underline-offset-2">Terms of Service</a> and <a href="/refund-policy" target="_blank" rel="noreferrer" className="text-[#06C668] underline underline-offset-2">Refund Policy</a>, and acknowledge the <a href="/privacy" target="_blank" rel="noreferrer" className="text-[#06C668] underline underline-offset-2">Privacy Policy</a>.
              </span>
            </label>
          </div>
        )}

        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {!started && (
          <button
            onClick={startCheckout}
            disabled={!accepted || loading}
            className="w-full rounded-xl bg-[#06C668] px-5 py-3.5 text-sm font-bold text-[#06130b] transition hover:bg-[#05b85e] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Preparing secure checkout…" : "Continue to secure payment"}
          </button>
        )}
        <div
          id="viralstudio-paddle-checkout"
          className="viralstudio-paddle-checkout min-h-[450px] w-full overflow-hidden rounded-xl"
          style={{ display: started ? "block" : "none" }}
        >
          {loading && <p className="py-5 text-center text-sm text-white/55">Loading secure payment form…</p>}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-white/40">
          <span>Secure payment powered by Paddle</span>
          <a href="https://www.paddle.com/legal/buyer-terms" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-white/70">Paddle Buyer Terms</a>
          <a href="https://www.paddle.com/legal/refund-policy" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-white/70">Paddle Refund Policy</a>
        </div>
      </section>
    </div>
  );
}

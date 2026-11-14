"use client";

declare global {
  interface Window {
    Paddle?: any;
    __viralStudioPaddleInitialized?: boolean;
    __viralStudioPaddleEventCallback?: (event: any) => void;
  }
}

import { useEffect, useRef } from "react";
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
  const openingRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      openingRef.current = false;
      return;
    }

    if (openingRef.current) return;
    openingRef.current = true;
    let cancelled = false;

    const openOfficialCheckout = async () => {
      try {
        const response = await fetch("/api/payments/paddle/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId, billingCycle }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to start checkout");
        if (!data.clientToken || !data.priceId) {
          throw new Error("Paddle Checkout is temporarily unavailable.");
        }

        await loadPaddle();
        if (cancelled) return;
        if (!window.Paddle) throw new Error("Paddle Checkout could not be loaded.");

        window.__viralStudioPaddleEventCallback = (event) => {
          if (event?.name === "checkout.closed") onClose?.();
        };

        if (!window.__viralStudioPaddleInitialized) {
          if (data.environment === "sandbox") window.Paddle.Environment.set("sandbox");
          window.Paddle.Initialize({
            token: data.clientToken,
            eventCallback: (event) => window.__viralStudioPaddleEventCallback?.(event),
          });
          window.__viralStudioPaddleInitialized = true;
        }

        if (cancelled) return;
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
            variant: "multi-page",
            showAddDiscounts: true,
            successUrl: `${window.location.origin}/pricing?transactionId=${encodeURIComponent(data.transactionId)}`,
          },
        });
      } catch (error) {
        console.error("[ViralStudio] Could not open Paddle Checkout:", error);
        if (!cancelled) {
          window.alert("Unable to open secure Paddle Checkout. Please try again.");
          onClose?.();
        }
      }
    };

    void openOfficialCheckout();

    return () => {
      cancelled = true;
      openingRef.current = false;
    };
  }, [isOpen, planId, billingCycle, user?.email]);

  return null;
}

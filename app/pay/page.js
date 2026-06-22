"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import PayPalCheckoutModal from "../../components/payment/PayPalCheckoutModal";

function PayContent() {
  const searchParams = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [planId, setPlanId] = useState("professional");
  const [billingCycle, setBillingCycle] = useState("annual");

  useEffect(() => {
    const p = searchParams.get("plan");
    const b = searchParams.get("billing");
    if (p && ["starter", "professional", "team"].includes(p)) setPlanId(p);
    if (b === "monthly" || b === "annual") setBillingCycle(b);
    setModalOpen(true);
  }, [searchParams]);

  if (!modalOpen) {
    return (
      <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-48 -right-48 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[180px] opacity-60" />
        <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] bg-yellow-500/6 rounded-full blur-[150px] opacity-40" />
      </div>

      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-primary">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-xl font-extrabold text-white mb-2">Complete Your Purchase</h1>
        <p className="text-sm text-on-surface-variant/60 mb-6">Preparing your checkout experience...</p>
      </div>

      <PayPalCheckoutModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        planId={planId}
        billingCycle={billingCycle}
      />
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PayContent />
    </Suspense>
  );
}

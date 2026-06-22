"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Icon from "../../components/Icon";

function CancelContent() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get("transactionId");

  return (
    <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-48 -right-48 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[180px] opacity-60" />
        <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] bg-yellow-500/6 rounded-full blur-[150px] opacity-40" />
      </div>

      <div className="glass-card rounded-2xl border border-white/5 p-8 card-glow max-w-md w-full text-center" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.02), transparent)" }}>
        <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-5">
          <Icon name="cancel" className="text-3xl text-yellow-400" />
        </div>
        <h1 className="text-xl font-extrabold mb-2">Payment cancelled</h1>
        <p className="text-sm text-on-surface-variant/70 mb-6">Your payment was not completed. No charges have been made. You can try again anytime.</p>
        <a
          href="/pay"
          className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-primary to-purple-700 text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all"
        >
          <Icon name="arrow_back" className="text-sm" /> Back to Checkout
        </a>
        {transactionId && (
          <p className="text-[10px] text-on-surface-variant/40 mt-4">Reference: {transactionId}</p>
        )}
      </div>
    </div>
  );
}

export default function CancelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CancelContent />
    </Suspense>
  );
}

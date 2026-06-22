"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Icon from "../../components/Icon";

function SuccessContent() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get("transactionId");
  const [status, setStatus] = useState("loading");
  const [data, setData] = useState(null);
  const [retries, setRetries] = useState(0);

  useEffect(() => {
    if (!transactionId) {
      setStatus("error");
      return;
    }

    const check = async () => {
      try {
        const res = await fetch(`/api/payments/status?transactionId=${transactionId}`);
        const d = await res.json();
        if (d.status === "completed") {
          setData(d);
          setStatus("completed");
        } else if (retries < 20) {
          setTimeout(() => setRetries((r) => r + 1), 3000);
        } else {
          setStatus("timeout");
        }
      } catch {
        if (retries < 20) {
          setTimeout(() => setRetries((r) => r + 1), 3000);
        } else {
          setStatus("timeout");
        }
      }
    };
    check();
  }, [transactionId, retries]);

  return (
    <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-48 -right-48 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[180px] opacity-60" />
        <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] bg-green-500/6 rounded-full blur-[150px] opacity-40" />
      </div>

      <div className="glass-card rounded-2xl border border-white/5 p-8 card-glow max-w-md w-full text-center" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.02), transparent)" }}>
        {status === "loading" && (
          <>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5 animate-pulse">
              <Icon name="hourglass_top" className="text-3xl text-primary" />
            </div>
            <h1 className="text-xl font-extrabold mb-2">Payment received!</h1>
            <p className="text-sm text-on-surface-variant/70">Activating your credits, please wait...</p>
            <div className="mt-6 w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </>
        )}

        {status === "completed" && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-5">
              <Icon name="check_circle" className="text-3xl text-green-400" />
            </div>
            <h1 className="text-xl font-extrabold mb-2">Payment confirmed!</h1>
            <p className="text-sm text-on-surface-variant/70 mb-4">Your plan has been activated and credits added.</p>
            <div className="bg-surface-container-low border border-surface-border/60 rounded-xl p-4 mb-6 text-left space-y-2">
              <div className="flex justify-between text-sm"><span className="text-on-surface-variant/70">Plan</span><span className="font-semibold">{data?.planId}</span></div>
              <div className="flex justify-between text-sm"><span className="text-on-surface-variant/70">Billing</span><span className="font-semibold capitalize">{data?.billingCycle}</span></div>
              <div className="flex justify-between text-sm"><span className="text-on-surface-variant/70">Credits</span><span className="font-semibold text-yellow-400">{data?.credits?.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span className="text-on-surface-variant/70">Amount</span><span className="font-semibold">${data?.amount}</span></div>
            </div>
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-primary to-purple-700 text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all"
            >
              <Icon name="dashboard" className="text-sm" /> Go to Dashboard
            </a>
          </>
        )}

        {(status === "error" || status === "timeout") && (
          <>
            <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-5">
              <Icon name="hourglass_bottom" className="text-3xl text-yellow-400" />
            </div>
            <h1 className="text-xl font-extrabold mb-2">Still processing</h1>
            <p className="text-sm text-on-surface-variant/70 mb-6">Your payment went through, credits are being activated. Please check your dashboard or contact support if credits don't appear within a few minutes.</p>
            <div className="flex flex-col gap-3">
              <a href="/" className="inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-primary to-purple-700 text-white shadow-lg shadow-primary/30">Go to Dashboard</a>
              <a href="mailto:support@viralstudio.ai" className="inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm btn-subtle text-white border border-surface-border/60">Contact Support</a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

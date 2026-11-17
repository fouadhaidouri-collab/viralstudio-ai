"use client";

import PageHeader from "../components/PageHeader";
import Icon from "../../components/Icon";

const requiredSettings = [
  { name: "PADDLE_ENVIRONMENT", detail: "sandbox" },
  { name: "NEXT_PUBLIC_PADDLE_TEST_CLIENT_TOKEN", detail: "Sandbox client-side token" },
  { name: "PADDLE_TEST_API_KEY", detail: "Sandbox API key with transaction.write permission" },
  { name: "PADDLE_TEST_WEBHOOK_SECRET", detail: "Sandbox notification destination secret" },
  { name: "PADDLE_TEST_PRICE_ID_BEGINNER … ULTIMATE", detail: "Six active one-time USD price IDs" },
];

export default function PaymentMethodsPage() {
  return (
    <div className="space-y-5 animate-fade-in-up">
      <PageHeader
        title="Payment Provider"
        subtitle="ViralStudio uses the official Paddle Checkout. Testing is isolated to Paddle Sandbox."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Payment Provider" }]}
      />
      <div className="max-w-3xl rounded-2xl border border-primary/20 bg-surface-container-lowest/60 overflow-hidden">
        <div className="p-5 border-b border-surface-border/50 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon name="shield-check" className="text-primary" size={22} />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-white">Paddle Billing</h2>
            <p className="text-xs text-on-surface-variant">Official hosted checkout · One-page · Sandbox only</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold border border-yellow-500/30 text-yellow-400">TEST MODE</span>
        </div>
        <div className="p-5 space-y-3">
          {requiredSettings.map((item) => (
            <div key={item.name} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 rounded-xl bg-surface-container-low px-4 py-3">
              <span className="text-xs font-mono text-white">{item.name}</span>
              <span className="text-[11px] text-on-surface-variant">{item.detail}</span>
            </div>
          ))}
        </div>
        <div className="mx-5 mb-5 rounded-xl border border-surface-border/50 p-4">
          <div className="flex items-start gap-2">
            <Icon name="info" size={15} className="text-primary mt-0.5" />
            <p className="text-xs leading-5 text-on-surface-variant">
              Configure secrets and price IDs in Vercel Environment Variables, and set the Sandbox Default Payment Link in Paddle Checkout settings. This page is informational; it does not store or expose secret keys.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

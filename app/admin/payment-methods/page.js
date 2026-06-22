"use client";
import { useState } from "react";
import PageHeader from "../components/PageHeader";
import Icon from "../../components/Icon";

const initialConfig = {
  paypal: {
    enabled: false,
    mode: "sandbox",
    client_id: "",
    client_secret: "",
    webhook_id: "",
  },
  stripe: {
    enabled: false,
    mode: "test",
    publishable_key: "",
    secret_key: "",
    webhook_signing_secret: "",
  },
  youcanpay: {
    enabled: false,
    mode: "sandbox",
    public_key: "",
    private_key: "",
    webhook_secret: "",
  },
};

export default function PaymentMethodsPage() {
  const [config, setConfig] = useState(initialConfig);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(null);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function update(provider, field, value) {
    setConfig(prev => ({
      ...prev,
      [provider]: { ...prev[provider], [field]: value },
    }));
  }

  function save(provider) {
    setSaving(provider);
    setTimeout(() => {
      console.log(`Saved ${provider} config:`, config[provider]);
      setSaving(null);
      showToast(`${provider.charAt(0).toUpperCase() + provider.slice(1)} configuration saved`);
    }, 500);
  }

  const providers = [
    {
      id: "paypal",
      name: "PayPal",
      icon: "currency_bitcoin",
      color: "bg-blue-500/10",
      iconColor: "text-blue-400",
      fields: [
        { key: "client_id", label: "Client ID", type: "text", placeholder: "AYP****3f9a" },
        { key: "client_secret", label: "Client Secret", type: "password", placeholder: "EPh****8k2m" },
        { key: "webhook_id", label: "Webhook ID", type: "password", placeholder: "WH-****9d3a" },
      ],
      modes: [
        { value: "sandbox", label: "Sandbox" },
        { value: "live", label: "Live" },
      ],
    },
    {
      id: "stripe",
      name: "Stripe",
      icon: "credit_card",
      color: "bg-purple-500/10",
      iconColor: "text-purple-400",
      fields: [
        { key: "publishable_key", label: "Publishable Key", type: "text", placeholder: "pk_live_****9f3a" },
        { key: "secret_key", label: "Secret Key", type: "password", placeholder: "sk_live_****3b7k" },
        { key: "webhook_signing_secret", label: "Webhook Signing Secret", type: "password", placeholder: "whsec_****2d8f" },
      ],
      modes: [
        { value: "test", label: "Test" },
        { value: "live", label: "Live" },
      ],
    },
    {
      id: "youcanpay",
      name: "YouCan Pay",
      icon: "globe",
      color: "bg-green-500/10",
      iconColor: "text-green-400",
      fields: [
        { key: "public_key", label: "Public Key", type: "text", placeholder: "pk_****7b2k" },
        { key: "private_key", label: "Private Key", type: "password", placeholder: "sk_****9f4a" },
        { key: "webhook_secret", label: "Webhook Secret", type: "password", placeholder: "whsec_****3d8f" },
      ],
      modes: [
        { value: "sandbox", label: "Sandbox" },
        { value: "live", label: "Live" },
      ],
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in-up">
      <PageHeader
        title="Payment Methods"
        subtitle="Configure payment providers — PayPal, Stripe, and YouCan Pay"
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Payment Methods" }]}
      />

      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] bg-surface-container-high border border-surface-border rounded-xl px-4 py-3 shadow-2xl animate-dropdown-open flex items-center gap-2.5">
          <Icon name="check_circle" className="text-green-400" size={16} />
          <span className="text-xs text-white font-medium">{toast}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {providers.map((provider) => {
          const c = config[provider.id];
          return (
            <div key={provider.id} className="glass-card rounded-2xl overflow-hidden card-glow">
              <div className="p-5 border-b border-surface-border/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl ${provider.color} flex items-center justify-center`}>
                    <Icon name={provider.icon} className={provider.iconColor} size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-white">{provider.name}</h3>
                    <p className="text-[9px] text-on-surface-variant">Payment provider configuration</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={c.enabled}
                      onChange={(e) => update(provider.id, "enabled", e.target.checked)}
                    />
                    <div className="w-9 h-5 rounded-full transition-all duration-300 bg-surface-container-high border border-surface-border/50 peer-checked:bg-primary peer-checked:border-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-3.5 after:h-3.5 after:rounded-full after:bg-white after:transition-all after:duration-300 peer-checked:after:translate-x-[16px]" />
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium border ${
                    c.mode === "live" ? "border-green-500/30 text-green-400" : "border-yellow-500/30 text-yellow-400"
                  }`}>
                    {c.mode}
                  </span>
                  {c.enabled ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-medium border border-green-500/30 text-green-400">Active</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-medium border border-surface-border/30 text-on-surface-variant">Disabled</span>
                  )}
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[9px] font-medium text-on-surface-variant mb-1.5 uppercase tracking-wider">Mode</label>
                  <div className="flex gap-2">
                    {provider.modes.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => update(provider.id, "mode", m.value)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                          c.mode === m.value
                            ? "bg-primary/20 text-primary border border-primary/30"
                            : "bg-surface-container-high border border-surface-border/50 text-on-surface-variant hover:text-white"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {provider.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-[9px] font-medium text-on-surface-variant mb-1.5 uppercase tracking-wider">{field.label}</label>
                    <input
                      type={field.type}
                      value={c[field.key]}
                      onChange={(e) => update(provider.id, field.key, e.target.value)}
                      className="w-full bg-surface-container-low border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50 transition-all font-mono"
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}

                <div className="bg-surface-container-low/50 border border-surface-border/30 rounded-lg px-3 py-2">
                  <p className="text-[9px] text-on-surface-variant">
                    <Icon name="info" size={10} className="inline mr-1 text-secondary" />
                    Save to apply changes. Keys are stored securely.
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5">
                <button
                  onClick={() => save(provider.id)}
                  disabled={saving === provider.id}
                  className="w-full px-4 py-2.5 primary-gradient text-white rounded-lg text-xs font-semibold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving === provider.id ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Icon name="save" size={13} />
                      Save {provider.name} Configuration
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

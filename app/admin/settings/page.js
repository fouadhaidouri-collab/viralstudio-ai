"use client";
import { useState } from "react";
import PageHeader from "../components/PageHeader";
import Icon from "../../components/Icon";
import StatusBadge from "../components/StatusBadge";

const defaultSettings = {
  general: { app_name: "ViralStudio AI", logo: null, default_language: "en", default_currency: "USD", maintenance_mode: false, signup_enabled: true },
  credits: { default_credits: 100, minimum_purchase: 10, credit_value: 0.05, auto_refund_failed: true },
  api: { fal_ai: "sk-...", openrouter: "sk-...", elevenlabs: "sk-...", stripe: "sk-...", paypal: "..." },
  storage: { provider: "Supabase", max_upload_size: 500, allowed_file_types: "mp4,mov,avi,jpg,png,gif,mp3,wav", auto_delete_old: false },
  branding: { primary_color: "#a855f7", accent_color: "#22d3ee", button_style: "gradient", dark_mode_default: true, arabic_rtl_enabled: true },
};

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-10 h-5 rounded-full transition-all duration-200 ${value ? "bg-primary" : "bg-surface-container-high"}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 ${value ? "left-5" : "left-0.5"}`} />
    </button>
  );
}

function SettingCard({ title, description, icon, children }) {
  return (
    <div className="glass-card rounded-xl p-5 card-glow" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.02), transparent)" }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon name={icon} className="text-primary" size={18} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">{title}</h3>
          {description && <p className="text-[10px] text-on-surface-variant mt-0.5">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const updateGeneral = (key, value) => setSettings({ ...settings, general: { ...settings.general, [key]: value } });
  const updateCredits = (key, value) => setSettings({ ...settings, credits: { ...settings.credits, [key]: value } });
  const updateApi = (key, value) => setSettings({ ...settings, api: { ...settings.api, [key]: value } });
  const updateStorage = (key, value) => setSettings({ ...settings, storage: { ...settings.storage, [key]: value } });
  const updateBranding = (key, value) => setSettings({ ...settings, branding: { ...settings.branding, [key]: value } });

  return (
    <div className="space-y-5 animate-fade-in-up">
      <PageHeader
        title="Settings"
        subtitle="Configure your ViralStudio AI platform"
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Settings" }]}
      />

      {toast && (
        <div className="px-4 py-2.5 bg-surface-container border border-surface-border/80 rounded-xl text-xs text-white flex items-center gap-2 animate-dropdown-open">
          <Icon name="check_circle" className="text-primary shrink-0" size={14} />
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        <SettingCard title="General Settings" description="Basic platform configuration" icon="settings">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-on-surface-variant block mb-1">App Name</label>
              <input type="text" value={settings.general.app_name} onChange={(e) => updateGeneral("app_name", e.target.value)} className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary transition-all" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-on-surface-variant block mb-1">Default Language</label>
                <select value={settings.general.default_language} onChange={(e) => updateGeneral("default_language", e.target.value)} className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary transition-all">
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-on-surface-variant block mb-1">Default Currency</label>
                <select value={settings.general.default_currency} onChange={(e) => updateGeneral("default_currency", e.target.value)} className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary transition-all">
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between bg-surface-container-lowest rounded-lg px-3 py-2.5">
                <span className="text-xs text-on-surface-variant">Maintenance Mode</span>
                <Toggle value={settings.general.maintenance_mode} onChange={(v) => updateGeneral("maintenance_mode", v)} />
              </div>
              <div className="flex items-center justify-between bg-surface-container-lowest rounded-lg px-3 py-2.5">
                <span className="text-xs text-on-surface-variant">Signup Enabled</span>
                <Toggle value={settings.general.signup_enabled} onChange={(v) => updateGeneral("signup_enabled", v)} />
              </div>
            </div>
            <button onClick={() => showToast("General settings saved")} className="px-4 py-2 primary-gradient text-white rounded-lg text-xs font-semibold hover:brightness-110 transition-all">
              Save Changes
            </button>
          </div>
        </SettingCard>

        <SettingCard title="Credits Settings" description="Configure credit system" icon="currency_bitcoin">
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-on-surface-variant block mb-1">Default Credits</label>
                <input type="number" value={settings.credits.default_credits} onChange={(e) => updateCredits("default_credits", Number(e.target.value))} className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary transition-all" />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant block mb-1">Minimum Purchase</label>
                <input type="number" value={settings.credits.minimum_purchase} onChange={(e) => updateCredits("minimum_purchase", Number(e.target.value))} className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary transition-all" />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant block mb-1">Credit Value ($)</label>
                <input type="number" step="0.001" value={settings.credits.credit_value} onChange={(e) => updateCredits("credit_value", Number(e.target.value))} className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary transition-all" />
              </div>
            </div>
            <div className="flex items-center justify-between bg-surface-container-lowest rounded-lg px-3 py-2.5">
              <span className="text-xs text-on-surface-variant">Auto Refund Failed Generations</span>
              <Toggle value={settings.credits.auto_refund_failed} onChange={(v) => updateCredits("auto_refund_failed", v)} />
            </div>
            <button onClick={() => showToast("Credit settings saved")} className="px-4 py-2 primary-gradient text-white rounded-lg text-xs font-semibold hover:brightness-110 transition-all">
              Save Changes
            </button>
          </div>
        </SettingCard>

        <SettingCard title="API Settings" description="Configure third-party API integrations" icon="key">
          <div className="space-y-3">
            {[
              { key: "fal_ai", label: "FAL.ai" },
              { key: "openrouter", label: "OpenRouter" },
              { key: "elevenlabs", label: "ElevenLabs" },
              { key: "stripe", label: "Stripe" },
              { key: "paypal", label: "PayPal" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-xs text-on-surface-variant block mb-1">{label}</label>
                  <input type="password" value={settings.api[key]} onChange={(e) => updateApi(key, e.target.value)} className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary transition-all" />
                </div>
                <button onClick={() => showToast(`${label} API key saved`)} className="mt-5 px-3 py-2 btn-subtle rounded-lg text-xs font-medium transition-all">
                  Save
                </button>
              </div>
            ))}
            <p className="text-[10px] text-on-surface-variant/60 italic">Do not expose real API keys in frontend. Use environment variables only.</p>
          </div>
        </SettingCard>

        <SettingCard title="Storage Settings" description="File storage configuration" icon="folder">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-on-surface-variant block mb-1">Provider</label>
              <input type="text" value={settings.storage.provider} disabled className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-on-surface-variant/50 focus:outline-none cursor-not-allowed" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-on-surface-variant block mb-1">Max Upload Size (MB)</label>
                <input type="number" value={settings.storage.max_upload_size} onChange={(e) => updateStorage("max_upload_size", Number(e.target.value))} className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary transition-all" />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant block mb-1">Allowed File Types</label>
                <input type="text" value={settings.storage.allowed_file_types} onChange={(e) => updateStorage("allowed_file_types", e.target.value)} className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary transition-all" />
              </div>
            </div>
            <div className="flex items-center justify-between bg-surface-container-lowest rounded-lg px-3 py-2.5">
              <span className="text-xs text-on-surface-variant">Auto Delete Old Files</span>
              <Toggle value={settings.storage.auto_delete_old} onChange={(v) => updateStorage("auto_delete_old", v)} />
            </div>
            <button onClick={() => showToast("Storage settings saved")} className="px-4 py-2 primary-gradient text-white rounded-lg text-xs font-semibold hover:brightness-110 transition-all">
              Save Changes
            </button>
          </div>
        </SettingCard>

        <SettingCard title="Branding Settings" description="Customize platform appearance" icon="palette">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-on-surface-variant block mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg border border-surface-border/50 shrink-0" style={{ backgroundColor: settings.branding.primary_color }} />
                  <input type="text" value={settings.branding.primary_color} onChange={(e) => updateBranding("primary_color", e.target.value)} className="flex-1 bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary transition-all" />
                </div>
              </div>
              <div>
                <label className="text-xs text-on-surface-variant block mb-1">Accent Color</label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg border border-surface-border/50 shrink-0" style={{ backgroundColor: settings.branding.accent_color }} />
                  <input type="text" value={settings.branding.accent_color} onChange={(e) => updateBranding("accent_color", e.target.value)} className="flex-1 bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary transition-all" />
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs text-on-surface-variant block mb-1">Button Style</label>
              <select value={settings.branding.button_style} onChange={(e) => updateBranding("button_style", e.target.value)} className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary transition-all">
                <option value="gradient">Gradient</option>
                <option value="subtle">Subtle</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between bg-surface-container-lowest rounded-lg px-3 py-2.5">
                <span className="text-xs text-on-surface-variant">Dark Mode Default</span>
                <Toggle value={settings.branding.dark_mode_default} onChange={(v) => updateBranding("dark_mode_default", v)} />
              </div>
              <div className="flex items-center justify-between bg-surface-container-lowest rounded-lg px-3 py-2.5">
                <span className="text-xs text-on-surface-variant">Arabic RTL Enabled</span>
                <Toggle value={settings.branding.arabic_rtl_enabled} onChange={(v) => updateBranding("arabic_rtl_enabled", v)} />
              </div>
            </div>
            <button onClick={() => showToast("Branding settings saved")} className="px-4 py-2 primary-gradient text-white rounded-lg text-xs font-semibold hover:brightness-110 transition-all">
              Save Changes
            </button>
          </div>
        </SettingCard>
      </div>
    </div>
  );
}

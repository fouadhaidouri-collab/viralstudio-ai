"use client";
import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader";
import Icon from "../../components/Icon";
import StatusBadge from "../components/StatusBadge";
import SettingsSplash from "../components/SettingsSplash";

const defaultSettings = {
  general: { app_name: "", logo: null, default_language: "en", default_currency: "USD", maintenance_mode: false, signup_enabled: true },
  credits: { default_credits: 0, minimum_purchase: 10, credit_value: 0.05, auto_refund_failed: true },
  api: { renderful: "", openrouter: "", elevenlabs: "", stripe: "", paypal: "" },
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

function SettingCard({ title, description, icon, id, children }) {
  return (
    <div id={id} className="glass-card rounded-xl p-5 card-glow" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.02), transparent)" }}>
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
  const [splash, setSplash] = useState(true);
  const [splashLeaving, setSplashLeaving] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingError, setLoadingError] = useState(null);
  const [loadingAttempt, setLoadingAttempt] = useState(0);
  const [renderfulKey, setRenderfulKey] = useState("");
  const [renderfulStatus, setRenderfulStatus] = useState({ loading: true, configured: false, masked: "", source: "" });
  const [renderfulBusy, setRenderfulBusy] = useState("");
  const [renderfulMessage, setRenderfulMessage] = useState("");
  const [renderfulVerified, setRenderfulVerified] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const waitForPaint = () => new Promise((resolve) => {
      if (typeof window === "undefined" || !window.requestAnimationFrame || document.visibilityState === "hidden") {
        return resolve();
      }
      window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
    });

    const waitForFonts = () => {
      if (typeof document === "undefined" || !document.fonts?.ready) return Promise.resolve();
      return document.fonts.ready;
    };

    const run = async () => {
      const tasks = [
        async () => {
          const sessionResponse = await fetch("/api/auth/session", {
            cache: "no-store",
            signal: controller.signal,
          });
          if (!sessionResponse.ok) {
            throw new Error("We couldn't verify your session. Please try again.");
          }
          const session = await sessionResponse.json().catch(() => null);
          if (!session?.user) {
            throw new Error("Your session has expired. Please sign in and try again.");
          }
        },
        waitForFonts,
        waitForPaint,
      ];

      try {
        for (let index = 0; index < tasks.length; index++) {
          await tasks[index]();
          if (cancelled) return;
          setLoadingProgress(Math.round(((index + 1) / tasks.length) * 100));
          await waitForPaint();
          if (cancelled) return;
        }

        if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || document.visibilityState === "hidden") {
          setSplash(false);
        } else {
          setSplashLeaving(true);
        }
      } catch (err) {
        if (cancelled || err?.name === "AbortError") return;
        setLoadingError(
          err?.name === "TypeError"
            ? "Network error. Check your connection and try again."
            : err?.message || "We couldn't load Settings. Please try again."
        );
      }
    };

    run();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [loadingAttempt]);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/renderful-key", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Could not load Renderful key status");
        if (active) setRenderfulStatus({ loading: false, ...data });
      })
      .catch((err) => {
        if (active) setRenderfulStatus({ loading: false, configured: false, error: err.message });
      });
    return () => { active = false; };
  }, []);

  const retrySettingsLoad = () => {
    setLoadingError(null);
    setLoadingProgress(0);
    setSplashLeaving(false);
    setSplash(true);
    setLoadingAttempt((attempt) => attempt + 1);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const updateGeneral = (key, value) => setSettings({ ...settings, general: { ...settings.general, [key]: value } });
  const updateCredits = (key, value) => setSettings({ ...settings, credits: { ...settings.credits, [key]: value } });
  const updateApi = (key, value) => setSettings({ ...settings, api: { ...settings.api, [key]: value } });

  const runRenderfulAction = async (action) => {
    if (action === "save" && !renderfulKey.trim()) {
      setRenderfulMessage("Enter a Renderful API key first.");
      return;
    }
    setRenderfulBusy(action);
    setRenderfulMessage("");
    try {
      const res = await fetch("/api/admin/renderful-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, key: renderfulKey.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || "Request failed");
      if (action === "save") {
        setRenderfulKey("");
        setRenderfulVerified(false);
        setRenderfulStatus({ loading: false, configured: true, masked: data.masked, source: data.source || "database" });
        setRenderfulMessage("New Renderful API key saved. Generation requests now use this key.");
      } else if (action === "remove") {
        setRenderfulKey("");
        setRenderfulVerified(false);
        setRenderfulStatus({ loading: false, configured: false, masked: "", source: "removed" });
        setRenderfulMessage("Renderful API key removed. Add a new key to enable Renderful generation.");
      } else {
        setRenderfulVerified(Boolean(data.valid));
        setRenderfulMessage(data.valid
          ? `Connection successful${data.balance != null ? ` · Balance: ${data.balance}` : ""}${data.tier ? ` · ${data.tier}` : ""}`
          : (data.message || "Renderful rejected this key."));
      }
    } catch (err) {
      setRenderfulMessage(err.message || "Could not complete the request.");
    } finally {
      setRenderfulBusy("");
    }
  };

  return (
    <>
      {splash && (
        <SettingsSplash
          leaving={splashLeaving}
          progress={loadingProgress}
          error={loadingError}
          onRetry={retrySettingsLoad}
          onExited={() => setSplash(false)}
        />
      )}
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

        <SettingCard id="renderful-api-key" title="Renderful.ai" description="Active provider connection used by AI generation. Replace or remove the API key at any time." icon="key">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-surface-border/50 bg-surface-container-lowest px-3 py-2.5">
              <div>
                <p className="text-xs font-semibold text-white">Connection status</p>
                <p className="mt-0.5 text-[10px] text-on-surface-variant">
                  {renderfulStatus.loading ? "Checking saved key..." : renderfulStatus.configured ? `Active key · ${renderfulStatus.masked || "Hidden"} · ${renderfulStatus.source || "secure storage"}` : "No active Renderful API key"}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${renderfulStatus.configured ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"}`}>
                {renderfulStatus.loading ? "Checking" : renderfulVerified ? "Working" : renderfulStatus.configured ? "Saved · Not tested" : "Not connected"}
              </span>
            </div>
            <div>
              <label className="mb-1 block text-xs text-on-surface-variant">New Renderful API Key</label>
              <input
                type="password"
                autoComplete="new-password"
                value={renderfulKey}
                onChange={(e) => setRenderfulKey(e.target.value)}
                placeholder={renderfulStatus.configured ? "Enter a new key to replace the saved key" : "Paste Renderful API key"}
                className="w-full rounded-lg border border-surface-border/50 bg-surface-container-lowest px-3 py-2.5 text-xs text-white focus:border-primary focus:outline-none"
              />
              <p className="mt-1 text-[10px] text-on-surface-variant/70">The full key is never returned to the browser or displayed after saving.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {renderfulStatus.configured && <button onClick={() => runRenderfulAction("test_saved")} disabled={!!renderfulBusy} className="rounded-lg border border-surface-border/70 bg-surface-container-high px-4 py-2 text-xs font-semibold text-white transition-all hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-40">{renderfulBusy === "test_saved" ? "Checking..." : "Check Current Key"}</button>}
              <button onClick={() => runRenderfulAction("test")} disabled={!renderfulKey.trim() || !!renderfulBusy} className="rounded-lg border border-surface-border/70 bg-surface-container-high px-4 py-2 text-xs font-semibold text-white transition-all hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-40">
                {renderfulBusy === "test" ? "Testing..." : "Test Connection"}
              </button>
              <button onClick={() => runRenderfulAction("save")} disabled={!renderfulKey.trim() || !!renderfulBusy} className="rounded-lg primary-gradient px-4 py-2 text-xs font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">
                {renderfulBusy === "save" ? "Saving..." : "Save API Key"}
              </button>
              {renderfulStatus.configured && <button onClick={() => { if (window.confirm("Remove the active Renderful API key? AI generation will stop using Renderful until a new key is saved.")) runRenderfulAction("remove"); }} disabled={!!renderfulBusy} className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-300 transition-all hover:bg-red-500/15 disabled:opacity-40">{renderfulBusy === "remove" ? "Removing..." : "Remove Key"}</button>}
            </div>
            {renderfulMessage && <p role="status" className="rounded-lg border border-surface-border/50 bg-surface-container-lowest px-3 py-2 text-xs text-on-surface-variant">{renderfulMessage}</p>}
            {renderfulStatus.error && <p className="text-xs text-amber-400">{renderfulStatus.error}</p>}
          </div>
        </SettingCard>

      </div>
    </div>
    </>
  );
}

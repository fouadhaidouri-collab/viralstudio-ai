"use client";

import { useState, useEffect } from "react";

export default function AdminPricingPage() {
  const [settings, setSettings] = useState(null);
  const [modulePrices, setModulePrices] = useState({});
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    fetch("/api/admin/pricing/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setForm({
          credit_pack_price_usd: data.credit_pack_price_usd,
          credit_pack_credits: data.credit_pack_credits,
          default_markup_multiplier: data.default_markup_multiplier,
          minimum_generation_credits: data.minimum_generation_credits,
        });
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/pricing/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        setMessage("Settings saved. Module prices recalculated.");
      } else {
        setMessage(data.error || "Failed to save");
      }
    } catch {
      setMessage("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/pricing/sync", { method: "POST" });
      const data = await res.json();
      setSyncResult(data);
      if (data.success) {
        const mres = await fetch("/api/pricing/settings");
        const mdata = await mres.json();
        setModulePrices(mdata);
      }
    } catch {
      setSyncResult({ success: false, error: "Sync failed" });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-full bg-background text-white p-8" style={{ fontFamily: "Geist, sans-serif" }}>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Pricing Settings</h1>
          <p className="text-sm text-on-surface-variant mt-1">Manage credit pricing and sync fal.ai model prices</p>
        </div>

        {settings && (
          <div className="bg-surface-container-low border border-surface-border rounded-xl p-4 space-y-4">
            <h2 className="text-sm font-semibold">Credit Pack Settings</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-on-surface-variant">Pack Price (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.credit_pack_price_usd}
                  onChange={(e) => setForm({ ...form, credit_pack_price_usd: parseFloat(e.target.value) || 29 })}
                  className="w-full bg-surface-container-lowest border border-surface-border rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-on-surface-variant">Pack Credits</label>
                <input
                  type="number"
                  value={form.credit_pack_credits}
                  onChange={(e) => setForm({ ...form, credit_pack_credits: parseInt(e.target.value) || 1000 })}
                  className="w-full bg-surface-container-lowest border border-surface-border rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-on-surface-variant">Default Markup Multiplier</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.default_markup_multiplier}
                  onChange={(e) => setForm({ ...form, default_markup_multiplier: parseFloat(e.target.value) || 2 })}
                  className="w-full bg-surface-container-lowest border border-surface-border rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-on-surface-variant">Minimum Credits Per Generation</label>
                <input
                  type="number"
                  value={form.minimum_generation_credits}
                  onChange={(e) => setForm({ ...form, minimum_generation_credits: parseInt(e.target.value) || 1 })}
                  className="w-full bg-surface-container-lowest border border-surface-border rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="text-xs text-on-surface-variant bg-surface-container-high rounded-lg px-3 py-2">
              1 credit = ${settings.credit_usd_value} &middot; {settings.credit_pack_price_usd} USD = {settings.credit_pack_credits} credits
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-4 py-2 primary-gradient text-white rounded-lg text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
            >
              {saving ? "Saving & Recalculating..." : "Save Settings"}
            </button>

            {message && (
              <div className={`text-xs px-3 py-2 rounded-lg ${message.includes("saved") ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
                {message}
              </div>
            )}
          </div>
        )}

        <div className="bg-surface-container-low border border-surface-border rounded-xl p-4 space-y-4">
          <h2 className="text-sm font-semibold">Sync fal.ai Prices</h2>
          <p className="text-xs text-on-surface-variant">Fetch latest pricing from fal.ai for all models and recalculate credit costs.</p>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full px-4 py-3 bg-surface-container-high border border-surface-border rounded-xl text-sm font-medium hover:bg-surface-container-higher transition-all disabled:opacity-50"
          >
            {syncing ? "Syncing..." : "Sync Prices Now"}
          </button>

          {syncResult && (
            <div className={`text-xs space-y-1 ${syncResult.success ? "" : "text-red-400"}`}>
              {syncResult.success ? (
                <>
                  <p className="text-green-400">Synced: {syncResult.synced} models</p>
                  {syncResult.pricing_unavailable > 0 && <p className="text-yellow-400">Pricing unavailable: {syncResult.pricing_unavailable} models</p>}
                  {syncResult.failed > 0 && <p className="text-red-400">Failed: {syncResult.failed} models</p>}
                  <p className="text-on-surface-variant">Total: {syncResult.total} models</p>
                </>
              ) : (
                <p>{syncResult.error || "Sync failed"}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

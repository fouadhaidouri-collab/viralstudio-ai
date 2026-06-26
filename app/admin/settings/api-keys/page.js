"use client";

import { useState, useEffect } from "react";

export default function ApiKeysPage() {
  const [falKey, setFalKey] = useState("");
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [keyInfo, setKeyInfo] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetch("/api/admin/settings/fal-key/status")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setKeyInfo(data);
      })
      .catch(() => {});
  }, []);

  const testKey = async () => {
    if (!falKey.trim()) return;
    setTesting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings/fal-key/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ falKey: falKey.trim() }),
      });
      const data = await res.json();
      setStatus(data.valid ? "connected" : "invalid");
      setMessage(data.message || (data.valid ? "Key works" : "Key invalid"));
    } catch {
      setStatus("error");
      setMessage("Failed to test key");
    } finally {
      setTesting(false);
    }
  };

  const saveKey = async () => {
    if (!falKey.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings/fal-key/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ falKey: falKey.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Key saved: ${data.masked}`);
        setFalKey("");
        setKeyInfo({ ...keyInfo, hasKey: true, source: "database", masked: data.masked });
      } else {
        setMessage(data.message || "Failed to save");
      }
    } catch {
      setMessage("Failed to save key");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-background text-white p-8" style={{ fontFamily: "Geist, sans-serif" }}>
      <div className="max-w-lg mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold">API Settings</h1>
          <p className="text-sm text-on-surface-variant mt-1">Manage your fal.ai API key</p>
        </div>

        {keyInfo && (
          <div className="bg-surface-container-low border border-surface-border rounded-xl p-4 space-y-2">
            <h2 className="text-sm font-semibold">Current Status</h2>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${keyInfo.hasKey ? "bg-green-400" : "bg-red-400"}`} />
              <span className="text-sm">{keyInfo.hasKey ? "Connected" : "Missing"}</span>
            </div>
            {keyInfo.hasKey && (
              <div className="text-xs text-on-surface-variant space-y-1">
                <p>Source: {keyInfo.source}</p>
                <p>Key: {keyInfo.masked}</p>
              </div>
            )}
          </div>
        )}

        <div className="bg-surface-container-low border border-surface-border rounded-xl p-4 space-y-4">
          <h2 className="text-sm font-semibold">{keyInfo?.hasKey ? "Update Key" : "Add Key"}</h2>

          <input
            type="password"
            value={falKey}
            onChange={(e) => setFalKey(e.target.value)}
            placeholder="Paste your fal.ai API key"
            className="w-full bg-surface-container-lowest border border-surface-border rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />

          <div className="flex gap-2">
            <button
              onClick={testKey}
              disabled={testing || !falKey.trim()}
              className="flex-1 px-3 py-2 bg-surface-container-high border border-surface-border rounded-lg text-sm font-medium hover:bg-surface-container-higher transition-colors disabled:opacity-50"
            >
              {testing ? "Testing..." : "Test Key"}
            </button>
            <button
              onClick={saveKey}
              disabled={saving || !falKey.trim()}
              className="flex-1 px-3 py-2 primary-gradient text-white rounded-lg text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Key"}
            </button>
          </div>

          {message && (
            <div className={`text-xs px-3 py-2 rounded-lg ${status === "connected" ? "bg-green-900/30 text-green-400" : status === "invalid" ? "bg-red-900/30 text-red-400" : "bg-surface-container-high text-on-surface-variant"}`}>
              {message}
            </div>
          )}
        </div>

        <div className="text-xs text-on-surface-variant space-y-1">
          <p>Your API key is stored server-side only. It is never exposed to the frontend.</p>
          <p>On Vercel, use the FAL_KEY environment variable for production.</p>
        </div>
      </div>
    </div>
  );
}

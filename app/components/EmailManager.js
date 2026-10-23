"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";
import { useAuth } from "../lib/AuthContext";

export default function EmailManager() {
  const { user, refreshUser } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null); // "change" | "add"
  const [step, setStep] = useState("email"); // "email" | "code"
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    try {
      const res = await fetch("/api/account/emails", { cache: "no-store" });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || "Failed to load emails");
        return;
      }
      setData(d);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const primaryEmail = data?.primary?.email || user?.email || "";
  const total = data ? 1 + data.additional.length : 1;
  const max = data?.max || 3;
  const canAdd = total < max;

  const start = (nextMode) => {
    setMode(nextMode);
    setStep("email");
    setEmail("");
    setCode("");
    setError("");
    setNotice("");
  };

  const cancel = () => {
    setMode(null);
    setStep("email");
    setEmail("");
    setCode("");
    setError("");
  };

  const sendCode = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const res = await fetch("/api/account/emails/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: mode }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d.error || "Could not send the verification code");
        return;
      }
      setStep("code");
      setCode("");
      setNotice(`Code sent to ${d.email || email}. Check your inbox.`);
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const res = await fetch("/api/account/emails/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, purpose: mode }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d.error || "Could not verify the code");
        return;
      }
      setNotice(d.primary ? "Primary email updated." : "Email added and verified.");
      setMode(null);
      setStep("email");
      setEmail("");
      setCode("");
      await load();
      if (d.primary) await refreshUser();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Remove ${item.email} from your account?`)) return;
    setError("");
    setNotice("");
    setRemoving(item.id);
    try {
      const res = await fetch(`/api/account/emails?id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d.error || "Could not remove email");
        return;
      }
      setNotice("Email removed.");
      await load();
    } catch {
      setError("Network error");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="rounded-2xl p-6 md:p-8 border border-white/5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
          <Icon name="mail" className="text-primary" size={18} />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-white">Email Address</h2>
          <p className="text-[11px] text-on-surface-variant">Manage your verified emails. Up to {max} per account.</p>
        </div>
        <span className="ml-auto shrink-0 text-[11px] text-on-surface-variant">{total}/{max}</span>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 mb-4">
          <Icon name="error" size={14} className="shrink-0" />{error}
        </div>
      )}
      {notice && (
        <div className="p-3.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs flex items-center gap-2 mb-4">
          <Icon name="check_circle" size={14} className="shrink-0" />{notice}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-surface-container-low rounded-xl border border-surface-border/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-2 h-2 rounded-full bg-green-500 shrink-0 shadow-sm shadow-green-500/50" />
            <div className="min-w-0">
              <div className="text-sm text-white truncate font-medium">{loading ? "Loading..." : primaryEmail}</div>
              <div className="text-[10px] text-on-surface-variant mt-0.5">Primary email</div>
            </div>
          </div>
          <span className="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">Primary</span>
        </div>

        {(data?.additional || []).map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 px-5 py-3.5 bg-surface-container-low rounded-xl border border-surface-border/40">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-2 h-2 rounded-full bg-green-500 shrink-0 shadow-sm shadow-green-500/50" />
              <div className="min-w-0">
                <div className="text-sm text-white truncate font-medium">{item.email}</div>
                <div className="text-[10px] text-on-surface-variant mt-0.5">Additional email</div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-green-500/10 text-green-400 border border-green-500/20">Verified</span>
              <button
                type="button"
                onClick={() => remove(item)}
                disabled={removing === item.id}
                className="px-2.5 py-1 rounded-lg text-[10px] font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 border border-red-400/20 transition-all disabled:opacity-50"
              >
                {removing === item.id ? "..." : "Remove"}
              </button>
            </div>
          </div>
        ))}

        {!loading && data && data.additional.length === 0 && (
          <p className="text-[11px] text-on-surface-variant px-1">No additional emails yet.</p>
        )}
      </div>

      {!mode && (
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            type="button"
            onClick={() => start("add")}
            disabled={!canAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon name="add" size={14} /> Add email
          </button>
          <button
            type="button"
            onClick={() => start("change")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white bg-surface-container-high border border-white/10 hover:bg-surface-container transition-all"
          >
            <Icon name="edit" size={14} /> Change primary
          </button>
          {!canAdd && <span className="self-center text-[10px] text-on-surface-variant">Maximum {max} emails reached.</span>}
        </div>
      )}

      {mode && (
        <form onSubmit={step === "email" ? sendCode : verify} className="mt-5 p-4 rounded-xl bg-surface-container-low border border-surface-border/50 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-semibold text-white">{mode === "change" ? "Change primary email" : "Add a new email"}</div>
            <button type="button" onClick={cancel} className="text-[11px] text-on-surface-variant hover:text-white transition-colors">Cancel</button>
          </div>

          {step === "email" ? (
            <>
              <div>
                <label className="text-[11px] font-medium text-on-surface-variant mb-1.5 block">
                  {mode === "change" ? "New primary email" : "Email address"}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  placeholder="you@example.com"
                  className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-xl px-4 py-3 text-sm text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>
              <p className="text-[10px] text-on-surface-variant">We&apos;ll send an 8-digit verification code to this address.</p>
              <div className="flex gap-2">
                <button type="submit" disabled={busy} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold primary-gradient text-white hover:opacity-90 transition-all disabled:opacity-60">
                  {busy ? "Sending..." : "Send code"}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-[11px] text-on-surface-variant">Enter the code sent to <strong className="text-white">{email}</strong>.</p>
              <div>
                <label className="text-[11px] font-medium text-on-surface-variant mb-1.5 block">Verification code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  required
                  autoFocus
                  maxLength={8}
                  placeholder="8-digit code"
                  className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-xl px-4 py-3 text-sm text-white tracking-[0.3em] placeholder:tracking-normal placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={busy || code.length !== 8} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold primary-gradient text-white hover:opacity-90 transition-all disabled:opacity-60">
                  {busy ? "Verifying..." : "Verify"}
                </button>
                <button type="button" disabled={busy} onClick={sendCode} className="px-4 py-2.5 rounded-xl text-xs font-medium text-white bg-surface-container-high border border-white/10 hover:bg-surface-container transition-all disabled:opacity-60">
                  Resend code
                </button>
                <button type="button" onClick={cancel} className="px-4 py-2.5 rounded-xl text-xs font-medium text-on-surface-variant hover:text-white transition-colors">
                  Cancel
                </button>
              </div>
            </>
          )}
        </form>
      )}
    </div>
  );
}

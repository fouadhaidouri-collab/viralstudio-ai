"use client";
import { useState } from "react";
import Link from "next/link";
import Icon from "../components/Icon";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Please enter your email"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong"); return; }
      setSent(true);
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-[16px] flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 50%, #3b0764 100%)', boxShadow: '0 0 30px rgba(168,85,247,0.4)' }}>
            <Icon name="lock" className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Geist, sans-serif' }}>Recover Password</h1>
          <p className="text-sm text-on-surface-variant mt-1">Send recovery link to your email</p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-sm flex items-start gap-3">
              <Icon name="check" className="text-green-400 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-green-400 font-medium">Check your email</p>
                <p className="text-on-surface-variant mt-1">
                  We've sent a password reset link to <span className="text-white">{email}</span>.
                  Open it to set a new password. Also check your spam folder.
                </p>
              </div>
            </div>
            <button
              onClick={() => { setSent(false); setError(""); }}
              className="w-full text-center text-sm text-primary hover:underline"
            >
              Didn't get it? Try again
            </button>
            <p className="text-center text-sm text-on-surface-variant">
              <Link href="/login" className="text-primary hover:underline">Back to Sign In</Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all" />
            </div>
            <button type="submit" disabled={loading} className="w-full primary-gradient text-white py-3 rounded-xl font-medium hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="send" size={16} />}
              Send Link
            </button>
            <p className="text-center text-sm text-on-surface-variant">
              <Link href="/login" className="text-primary hover:underline">Back to Sign In</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
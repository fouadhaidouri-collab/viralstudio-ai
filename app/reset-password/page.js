"use client";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "../components/Icon";

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!email || !token) { setError("Invalid reset link"); return; }
    if (!password) { setError("Please enter a new password"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong"); return; }
      setMessage("Password updated successfully!");
      setTimeout(() => router.push("/login"), 2000);
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  };

  if (!email || !token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm text-center">
          <Icon name="error" className="text-red-400 mx-auto mb-4" size={48} />
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Link</h1>
          <p className="text-on-surface-variant mb-6">This reset link is invalid or expired.</p>
          <Link href="/forgot-password" className="text-primary hover:underline">Request a new link</Link>
        </div>
      </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}>
      <ResetForm />
    </Suspense>
  );
}

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-[16px] flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 50%, #3b0764 100%)', boxShadow: '0 0 30px rgba(168,85,247,0.4)' }}>
            <Icon name="lock" className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Geist, sans-serif' }}>Set New Password</h1>
          <p className="text-sm text-on-surface-variant mt-1">Set a strong password to protect your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
          {message && <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">{message}</div>}
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Email</label>
            <input type="email" value={email} disabled className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-xl px-4 py-3 text-white/60 focus:outline-none cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1.5">New Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter new password" className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Confirm New Password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all" />
          </div>
          <button type="submit" disabled={loading} className="w-full primary-gradient text-white py-3 rounded-xl font-medium hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="lock" size={16} />}
            Update Password
          </button>
          <p className="text-center text-sm text-on-surface-variant">
            <Link href="/login" className="text-primary hover:underline">Back to Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

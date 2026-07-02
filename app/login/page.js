"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "../components/Icon";
import { useAuth } from "../lib/AuthContext";

export default function LoginPage() {
  const [tab, setTab] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [refCode, setRefCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, loginError, setLoginError, login, signUp } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  const handleCreateAccount = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setLoginError("All fields are required");
      return;
    }
    if (password.length < 6) {
      setLoginError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    setLoginError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, ref_code: refCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Failed to create account");
        setLoading(false);
        return;
      }
      const loginOk = await login(email.trim(), password);
      if (loginOk) router.push("/");
    } catch {
      setLoginError("Server error. Please try again.");
    }
    setLoading(false);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setLoginError("Please enter email and password");
      return;
    }
    const ok = await login(email.trim(), password);
    if (ok) router.push("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-[16px] flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 50%, #3b0764 100%)', boxShadow: '0 0 30px rgba(168,85,247,0.4)' }}>
            <Icon name="bolt" className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Geist, sans-serif' }}>{tab === "signin" ? "Welcome back" : "Create account"}</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {tab === "signin" ? "Sign in to your account" : "Sign up to get started"}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 mb-6 p-1 bg-surface-container-low rounded-xl border border-surface-border/40">
          <button
            onClick={() => { setTab("signin"); setLoginError(""); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${tab === "signin" ? "bg-surface-container-high text-white shadow-sm" : "text-on-surface-variant hover:text-white"}`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab("signup"); setLoginError(""); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${tab === "signup" ? "bg-surface-container-high text-white shadow-sm" : "text-on-surface-variant hover:text-white"}`}
          >
            Sign Up
          </button>
        </div>

        {tab === "signin" ? (
          <form onSubmit={handleSignIn} className="glass-card rounded-2xl p-6 border border-white/5 card-glow space-y-4" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
            {loginError && (
              <div className="text-xs bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5 flex items-start gap-2">
                <Icon name="error" className="text-red-400 shrink-0 mt-0.5" size={14} />
                <span className="text-red-400">{loginError}</span>
              </div>
            )}
            <div>
              <label className="text-[11px] font-medium text-on-surface-variant mb-1.5 block">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 transition-colors" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-on-surface-variant mb-1.5 block">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 transition-colors" />
            </div>
            <div className="flex justify-end -mt-1">
              <Link href="/forgot-password" className="text-[11px] text-primary hover:text-primary/80 hover:underline underline-offset-2 transition-all">Forgot password?</Link>
            </div>
            <button type="submit" className="w-full primary-gradient text-white font-semibold py-2.5 rounded-xl text-sm hover:opacity-90 transition-all active:scale-[0.98]">
              Sign In
            </button>
          </form>
        ) : (
          <div className="glass-card rounded-2xl p-6 border border-white/5 card-glow space-y-4" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
            {loginError && (
              <div className="text-xs bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5 flex items-start gap-2">
                <Icon name="error" className="text-red-400 shrink-0 mt-0.5" size={14} />
                <span className="text-red-400">{loginError}</span>
              </div>
            )}
            <div>
              <label className="text-[11px] font-medium text-on-surface-variant mb-1.5 block">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 transition-colors" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-on-surface-variant mb-1.5 block">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 transition-colors" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-on-surface-variant mb-1.5 block">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 transition-colors" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-on-surface-variant mb-1.5 block">Referral Code (optional)</label>
              <input type="text" value={refCode} onChange={(e) => setRefCode(e.target.value)} placeholder="Enter referral code" className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 transition-colors" />
            </div>
            <button onClick={handleCreateAccount} disabled={loading} className="w-full primary-gradient text-white font-semibold py-2.5 rounded-xl text-sm hover:opacity-90 transition-all active:scale-[0.98]">
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

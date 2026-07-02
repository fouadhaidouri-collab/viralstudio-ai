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
  const [signupStep, setSignupStep] = useState("form");
  const [code, setCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const { isAuthenticated, loginError, setLoginError, login, signUp } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  const handleSendCode = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setLoginError("All fields are required");
      return;
    }
    if (password.length < 6) {
      setLoginError("Password must be at least 6 characters");
      return;
    }
    setSendingCode(true);
    setLoginError("");
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Failed to send code");
        setSendingCode(false);
        return;
      }
      setCodeSent(true);
      setSignupStep("verify");
    } catch {
      setLoginError("Server error. Please try again.");
    }
    setSendingCode(false);
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setLoginError("Please enter the verification code");
      return;
    }
    const ok = await signUp(name.trim(), email.trim(), password, refCode.trim(), code.trim());
    if (ok) router.push("/");
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
        ) : signupStep === "form" ? (
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
            <button onClick={handleSendCode} disabled={sendingCode} className="w-full primary-gradient text-white font-semibold py-2.5 rounded-xl text-sm hover:opacity-90 transition-all active:scale-[0.98]">
              {sendingCode ? "Sending code..." : "Create Account"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleVerifyCode} className="glass-card rounded-2xl p-6 border border-white/5 card-glow space-y-4" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
            {loginError && (
              <div className="text-xs bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5 flex items-start gap-2">
                <Icon name="error" className="text-red-400 shrink-0 mt-0.5" size={14} />
                <span className="text-red-400">{loginError}</span>
              </div>
            )}
            <div className="text-center mb-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Icon name="mail" className="text-primary" size={20} />
              </div>
              <p className="text-sm text-white font-semibold">Check your email</p>
              <p className="text-xs text-on-surface-variant mt-1">We sent a 6-digit code to <span className="text-white font-medium">{email}</span></p>
            </div>
            <div>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Enter 6-digit code"
                className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-xl px-4 py-3 text-center text-xl font-bold tracking-[8px] text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <button type="submit" className="w-full primary-gradient text-white font-semibold py-2.5 rounded-xl text-sm hover:opacity-90 transition-all active:scale-[0.98]">
              Verify & Create Account
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => { setSignupStep("form"); setCode(""); setLoginError(""); }}
                className="text-xs text-on-surface-variant hover:text-white transition-colors"
              >
                Back
              </button>
              <span className="text-xs text-on-surface-variant mx-2">·</span>
              <button
                type="button"
                onClick={handleSendCode}
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                Resend code
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}

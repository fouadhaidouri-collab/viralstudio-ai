"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Icon from "../components/Icon";
import { useAuth } from "../lib/AuthContext";

export default function LoginPage() {
  const [tab, setTab] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, signUp, googleLogin, verifyEmail, isAuthenticated, pendingVerification, verificationEmail, isVerified } = useAuth();
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verified, setVerified] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && isVerified && !pendingVerification) router.replace("/");
  }, [isAuthenticated, isVerified, pendingVerification, router]);

  const handleSignUp = (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    signUp(name, email, password);
  };

  const handleSignIn = (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password");
      return;
    }
    login(email, password);
  };

  const handleVerify = (e) => {
    e.preventDefault();
    setVerifyError("");
    if (!verifyCode.trim()) { setVerifyError("Enter verification code"); return; }
    const ok = verifyEmail(verifyCode);
    if (ok) {
      setVerified(true);
      setTimeout(() => router.push("/"), 1200);
    } else {
      setVerifyError("Invalid code. Try 123456");
    }
  };

  const handleGoogle = () => {
    googleLogin();
  };

  if (pendingVerification && !verified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-[16px] flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 50%, #3b0764 100%)', boxShadow: '0 0 30px rgba(168,85,247,0.4)' }}>
              <Icon name="mail" className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Geist, sans-serif' }}>Verify your email</h1>
            <p className="text-sm text-on-surface-variant mt-1">We sent a code to <span className="text-white font-medium">{verificationEmail}</span></p>
          </div>

          <form onSubmit={handleVerify} className="glass-card rounded-2xl p-6 border border-white/5 card-glow space-y-4" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
            {verifyError && <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5">{verifyError}</div>}
            <div>
              <label className="text-[11px] font-medium text-on-surface-variant mb-1.5 block">Verification Code</label>
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 transition-colors tracking-widest text-center text-lg font-mono"
              />
            </div>
            <button type="submit" className="w-full primary-gradient text-white font-semibold py-2.5 rounded-xl text-sm hover:opacity-90 transition-all active:scale-[0.98]">
              Verify Email
            </button>
            <p className="text-xs text-center text-on-surface-variant">
              Code: <span className="text-primary font-mono">123456</span>
            </p>
          </form>
        </div>
      </div>
    );
  }

  if (verified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <Icon name="check" className="text-green-400" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Geist, sans-serif' }}>Email Verified!</h1>
          <p className="text-sm text-on-surface-variant">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

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
            onClick={() => { setTab("signin"); setError(""); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${tab === "signin" ? "bg-surface-container-high text-white shadow-sm" : "text-on-surface-variant hover:text-white"}`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab("signup"); setError(""); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${tab === "signup" ? "bg-surface-container-high text-white shadow-sm" : "text-on-surface-variant hover:text-white"}`}
          >
            Sign Up
          </button>
        </div>

        {tab === "signin" ? (
          <form onSubmit={handleSignIn} className="glass-card rounded-2xl p-6 border border-white/5 card-glow space-y-4" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
            {error && <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5">{error}</div>}
            <div>
              <label className="text-[11px] font-medium text-on-surface-variant mb-1.5 block">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 transition-colors" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-on-surface-variant mb-1.5 block">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 transition-colors" />
            </div>
            <button type="submit" className="w-full primary-gradient text-white font-semibold py-2.5 rounded-xl text-sm hover:opacity-90 transition-all active:scale-[0.98]">
              Sign In
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="glass-card rounded-2xl p-6 border border-white/5 card-glow space-y-4" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
            {error && <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5">{error}</div>}
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
            <button type="submit" className="w-full primary-gradient text-white font-semibold py-2.5 rounded-xl text-sm hover:opacity-90 transition-all active:scale-[0.98]">
              Create Account
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-surface-border/40" />
          <span className="text-[11px] text-on-surface-variant">OR</span>
          <div className="flex-1 h-px bg-surface-border/40" />
        </div>

        {/* Google Login */}
        <button onClick={handleGoogle} className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-surface-border/60 bg-surface-container-low hover:bg-surface-container-high transition-all text-sm font-medium text-white active:scale-[0.98]">
          <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}

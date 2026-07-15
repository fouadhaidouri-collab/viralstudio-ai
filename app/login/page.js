"use client";

import { useState, useEffect, useRef } from "react";
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
  const [verifyEmail, setVerifyEmail] = useState("");
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);
  const { isAuthenticated, loginError, setLoginError, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

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
      setVerifyEmail(email.trim());
      setOtp(Array(6).fill(""));
      setOtpError("");
      setResendTimer(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setLoginError("Server error. Please try again.");
    }
    setLoading(false);
  };

  const handleOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError("");
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") handleVerifyOtp();
  };

  const handleOtpPaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      const newOtp = text.split("");
      setOtp(newOtp);
      otpRefs.current[5]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      setOtpError("Enter the full 6-digit code");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifyEmail, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || "Invalid code");
        setOtpLoading(false);
        return;
      }
      const loginOk = await login(verifyEmail, password);
      if (loginOk) window.location.href = "/";
    } catch {
      setOtpError("Server error. Please try again.");
    }
    setOtpLoading(false);
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    setResendTimer(60);
    try {
      await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifyEmail }),
      });
    } catch {}
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setLoginError("Please enter email and password");
      return;
    }
    const ok = await login(email.trim(), password);
    if (ok) window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-[16px] flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 50%, #3b0764 100%)', boxShadow: '0 0 30px rgba(168,85,247,0.4)' }}>
            <Icon name="bolt" className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Geist, sans-serif' }}>
            {verifyEmail ? "Verify your email" : tab === "signin" ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {verifyEmail
              ? `Enter the 6-digit code sent to ${verifyEmail}`
              : tab === "signin" ? "Sign in to your account" : "Sign up to get started"}
          </p>
        </div>

        {!verifyEmail && (
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
        )}

        {verifyEmail ? (
          <div className="glass-card rounded-2xl p-6 border border-white/5 card-glow" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
            <div className="flex justify-center gap-2 mb-6" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => otpRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  className="w-11 h-14 md:w-14 md:h-16 text-center text-2xl font-bold rounded-xl border-2 transition-all duration-150 ${digit ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/20' : 'bg-surface-container border-surface-border/40 text-white hover:border-primary/40 hover:bg-surface-container-high'}"
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {otpError && (
              <div className="text-xs bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5 mb-4 flex items-start gap-2">
                <Icon name="error" className="text-red-400 shrink-0 mt-0.5" size={14} />
                <span className="text-red-400">{otpError}</span>
              </div>
            )}

            <button onClick={handleVerifyOtp} disabled={otpLoading} className="w-full primary-gradient text-white font-semibold py-2.5 rounded-xl text-sm hover:opacity-90 transition-all active:scale-[0.98] mb-3">
              {otpLoading ? "Verifying..." : "Verify Email"}
            </button>

            <div className="text-center">
              <button onClick={handleResendCode} disabled={resendTimer > 0} className="text-xs text-on-surface-variant hover:text-primary transition-all disabled:opacity-40">
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend code"}
              </button>
            </div>
          </div>
        ) : tab === "signin" ? (
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
              <label className="text-[11px] font-medium text-on-surface-variant mb-1.5 block">Coupon Code (optional)</label>
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

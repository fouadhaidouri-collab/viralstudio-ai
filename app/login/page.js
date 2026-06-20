"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Icon from "../components/Icon";
import { useAuth } from "../lib/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password");
      return;
    }
    login(email, password);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-[16px] flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 50%, #3b0764 100%)', boxShadow: '0 0 30px rgba(168,85,247,0.4)' }}>
            <Icon name="bolt" className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Geist, sans-serif' }}>Welcome back</h1>
          <p className="text-sm text-on-surface-variant mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 border border-white/5 card-glow space-y-4" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
          {error && (
            <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5">{error}</div>
          )}

          <div>
            <label className="text-[11px] font-medium text-on-surface-variant mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-on-surface-variant mb-1.5 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <button type="submit" className="w-full primary-gradient text-white font-semibold py-2.5 rounded-xl text-sm hover:opacity-90 transition-all active:scale-[0.98]">
            Sign In
          </button>

          <p className="text-xs text-center text-on-surface-variant">
            Don&apos;t have an account? <button type="button" className="text-primary hover:underline font-medium">Sign up</button>
          </p>
        </form>
      </div>
    </div>
  );
}

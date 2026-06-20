"use client";

import { useState } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import AuthGuard from "../components/AuthGuard";
import { SidebarProvider } from "../components/SidebarContext";
import { useAuth } from "../lib/AuthContext";
import Icon from "../components/Icon";

export default function ProfilePage() {
  const [tab, setTab] = useState("overview");
  const { user, logout } = useAuth();

  const sample = {
    email: "user@example.com",
    credits: "1,250",
    plan: "Pro Plan",
    memberSince: "Jan 2026",
  };

  const tabs = [
    { key: "overview", label: "Overview", icon: "person" },
    { key: "security", label: "Security", icon: "lock" },
  ];

  return (
    <AuthGuard>
    <div className="h-screen overflow-hidden no-x-scroll">
      <SidebarProvider>
      <Sidebar />
      <TopBar />
      <main className="fixed top-14 md:top-16 right-0 w-full md:w-[calc(100%-16rem)] bottom-0 overflow-y-auto smooth-scroll">
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-10">

          {/* Profile Header */}
          <div className="glass-card rounded-2xl p-6 md:p-8 border border-white/5 card-glow mb-6" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
            <div className="flex items-start gap-5">
              <div className="relative shrink-0">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full p-[2px]" style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}>
                  <div className="w-full h-full rounded-full bg-surface flex items-center justify-center">
                    <Icon name="person" className="text-primary" size={32} />
                  </div>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-500 border-2 border-surface rounded-full" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl md:text-2xl font-bold text-white truncate">{sample.email}</h1>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-primary/15 text-primary border border-primary/20">
                    <Icon name="workspace_premium" size={12} /> {sample.plan}
                  </span>
                  <span className="text-[11px] text-on-surface-variant">Member since {sample.memberSince}</span>
                </div>
              </div>
              <button onClick={() => { logout(); }} className="shrink-0 px-4 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 border border-red-400/20 transition-all flex items-center gap-1.5">
                <Icon name="logout" size={14} /> Logout
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 p-1 bg-surface-container-low rounded-xl border border-surface-border/40">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  tab === t.key
                    ? "bg-surface-container-high text-white shadow-sm"
                    : "text-on-surface-variant hover:text-white"
                }`}
              >
                <Icon name={t.icon} size={16} />
                {t.label}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <div className="space-y-5">

              {/* Credits Card */}
              <div className="glass-card rounded-2xl p-6 border border-white/5 card-glow relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.06), rgba(99,102,241,0.03), transparent)' }}>
                <div className="absolute top-0 right-0 w-40 h-40 opacity-5" style={{ background: 'radial-gradient(circle, #a855f7, transparent 70%)' }} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-on-surface-variant">Available Credits</span>
                    <Icon name="bolt" className="text-yellow-400" size={18} />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-white mb-3">{sample.credits.toLocaleString()}</div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 rounded-full bg-surface-container-high overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: '65%', background: 'linear-gradient(90deg, #a855f7, #6366f1)' }} />
                    </div>
                    <span className="text-[11px] text-on-surface-variant shrink-0">65% remaining</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="glass-card rounded-2xl p-6 border border-white/5 card-glow" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
                <h2 className="text-sm font-semibold text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-surface-container-low border border-surface-border/50 hover:border-primary/30 hover:bg-surface-container-high transition-all text-left group">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Icon name="edit" className="text-primary" size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Change Email</div>
                      <div className="text-[11px] text-on-surface-variant">Update your email address</div>
                    </div>
                  </button>
                  <button className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-surface-container-low border border-surface-border/50 hover:border-primary/30 hover:bg-surface-container-high transition-all text-left group">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Icon name="lock" className="text-primary" size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Reset Password</div>
                      <div className="text-[11px] text-on-surface-variant">Change your password</div>
                    </div>
                  </button>
                  <button className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-surface-container-low border border-surface-border/50 hover:border-primary/30 hover:bg-surface-container-high transition-all text-left group">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Icon name="refresh" className="text-primary" size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Recover Password</div>
                      <div className="text-[11px] text-on-surface-variant">استيراد كلمة السر</div>
                    </div>
                  </button>
                  <button className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-surface-container-low border border-surface-border/50 hover:border-primary/30 hover:bg-surface-container-high transition-all text-left group">
                    <div className="w-10 h-10 rounded-lg bg-yellow-400/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Icon name="bolt" className="text-yellow-400" size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Buy Credits</div>
                      <div className="text-[11px] text-on-surface-variant">Top up your balance</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === "security" && (
            <div className="space-y-5">

              {/* Email Section */}
              <div className="glass-card rounded-2xl p-6 border border-white/5 card-glow" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon name="mail" className="text-primary" size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">Email Address</h2>
                    <p className="text-[11px] text-on-surface-variant">Your current login email</p>
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-surface-container-low rounded-xl border border-surface-border/40">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                    <span className="text-sm text-white truncate">{sample.email}</span>
                  </div>
                  <button className="text-xs font-medium text-primary hover:text-primary/80 transition-colors shrink-0 ml-3">Change</button>
                </div>
              </div>

              {/* Password Section */}
              <div className="glass-card rounded-2xl p-6 border border-white/5 card-glow" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon name="lock" className="text-primary" size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">Password</h2>
                    <p className="text-[11px] text-on-surface-variant">Set a strong password to protect your account</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-medium text-on-surface-variant mb-1.5 block">Current Password</label>
                    <input type="password" placeholder="Enter current password" className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 transition-colors" />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-on-surface-variant mb-1.5 block">New Password</label>
                    <input type="password" placeholder="Enter new password" className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 transition-colors" />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-on-surface-variant mb-1.5 block">Confirm New Password</label>
                    <input type="password" placeholder="Confirm new password" className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 transition-colors" />
                  </div>
                  <button className="w-full primary-gradient text-white font-semibold py-2.5 rounded-xl text-sm hover:opacity-90 transition-all active:scale-[0.98]">
                    Update Password
                  </button>
                </div>
              </div>

              {/* Recover Password */}
              <div className="glass-card rounded-2xl p-6 border border-white/5 card-glow" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon name="refresh" className="text-primary" size={18} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-sm font-semibold text-white">Recover Password</h2>
                    <p className="text-[11px] text-on-surface-variant">استيراد كلمة السر — Send recovery link to your email</p>
                  </div>
                  <button className="text-xs font-medium text-primary hover:text-primary/80 transition-colors shrink-0">Send Link</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
      </SidebarProvider>
    </div>
    </AuthGuard>
  );
}

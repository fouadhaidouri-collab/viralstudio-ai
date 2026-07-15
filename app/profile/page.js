"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import AuthGuard from "../components/AuthGuard";
import { SidebarProvider } from "../components/SidebarContext";
import { useAuth } from "../lib/AuthContext";
import Icon from "../components/Icon";

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return "0 GB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
}

function gravatarUrl(email) {
  let hash = 0;
  const str = email.trim().toLowerCase();
  for (let i = 0; i < str.length; i++) { const chr = str.charCodeAt(i); hash = ((hash << 5) - hash) + chr; hash |= 0; }
  const h = Math.abs(hash).toString(16).padStart(8, "0");
  return `https://www.gravatar.com/avatar/${h}?s=200&d=retro`;
}

export default function ProfilePage() {
  const router = useRouter();
  const [tab, setTab] = useState("overview");
  const { user, logout } = useAuth();
  const email = user?.email || "user@example.com";
  const name = user?.name || email.split("@")[0];
  const username = email.split("@")[0];
  const photoURL = user?.photoURL || gravatarUrl(email);
  const [realCredits, setRealCredits] = useState(null);
  const [storageData, setStorageData] = useState(null);
  const [subData, setSubData] = useState(null);
  const creditsDisplay = (realCredits ?? user?.credits ?? 0).toLocaleString();
  const plan = user?.plan || "Free";
  const planIcon = plan === "Free" ? "person" : "workspace_premium";
  const planColor = plan === "Free" ? "text-on-surface-variant bg-surface-container-high border-surface-border/40" : "text-primary bg-primary/15 border-primary/20";
  const memberSince = user?.memberSince || "Jan 2026";
  const isGoogleUser = user?.provider === "google";

  const [cpCurrent, setCpCurrent] = useState("");
  const [cpNew, setCpNew] = useState("");
  const [cpConfirm, setCpConfirm] = useState("");
  const [cpError, setCpError] = useState("");
  const [cpMessage, setCpMessage] = useState("");
  const [cpLoading, setCpLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setCpError(""); setCpMessage("");
    if (!cpCurrent) { setCpError("Enter your current password"); return; }
    if (!cpNew) { setCpError("Enter a new password"); return; }
    if (cpNew.length < 6) { setCpError("New password must be at least 6 characters"); return; }
    if (cpNew !== cpConfirm) { setCpError("Passwords do not match"); return; }
    setCpLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: cpCurrent, newPassword: cpNew }),
      });
      const data = await res.json();
      if (!res.ok) { setCpError(data.error || "Failed"); return; }
      setCpMessage("Password updated successfully!");
      setCpCurrent(""); setCpNew(""); setCpConfirm("");
    } catch { setCpError("Network error"); }
    finally { setCpLoading(false); }
  };

  useEffect(() => {
    fetch("/api/credits").then(r => r.json()).then(d => { if (d.balance != null) setRealCredits(d.balance); }).catch(() => {});
    fetch("/api/subscription").then(r => r.json()).then(d => { if (d.plan) setSubData(d); }).catch(() => {});
    const uid = user?.id;
    if (uid) {
      fetch("/api/storage", { headers: { "x-user-id": uid } }).then(r => r.json()).then(d => { if (d.limit_bytes != null) setStorageData(d); }).catch(() => {});
    }
  }, [user?.id]);

  const tabs = [
    { key: "overview", label: "Overview", icon: "person" },
    ...(!isGoogleUser ? [{ key: "security", label: "Security", icon: "lock" }] : []),
  ];

  return (
    <AuthGuard>
    <div className="h-screen overflow-hidden no-x-scroll">
      <SidebarProvider>
      <Sidebar />
      <TopBar />
      <main className="fixed top-14 md:top-16 right-0 w-full md:w-[calc(100%-16rem)] bottom-0 overflow-y-auto smooth-scroll">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10">

          {/* Profile Header */}
          <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 mb-6 border border-white/5" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(99,102,241,0.04), transparent)' }}>
            <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.04]" style={{ background: 'radial-gradient(circle, #a855f7, transparent 70%)' }} />
            <div className="absolute bottom-0 left-0 w-48 h-48 opacity-[0.03]" style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }} />
            <div className="relative z-10 flex items-start gap-5">
              <div className="relative shrink-0">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full p-[2px]" style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}>
                  <div className="w-full h-full rounded-full bg-surface overflow-hidden">
                    <img src={photoURL} alt={email} className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-500 border-2 border-surface rounded-full" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl md:text-2xl font-bold text-white truncate">{name}</h1>
                <p className="text-sm text-on-surface-variant mt-0.5">{email} · @{username}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${planColor}`}>
                    <Icon name={planIcon} size={12} /> {plan}
                  </span>
                  <span className="text-[11px] text-on-surface-variant">Member since {memberSince}</span>
                </div>
              </div>
              <button onClick={() => { logout(); }} className="shrink-0 px-4 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 border border-red-400/20 transition-all flex items-center gap-1.5">
                <Icon name="logout" size={14} /> Logout
              </button>
            </div>
          </div>

          {/* Plan Card */}
          {subData && subData.billing && (
            <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 mb-6 border border-white/5" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(245,158,11,0.04), transparent)' }}>
              <div className="absolute top-0 right-0 w-48 h-48 opacity-[0.04]" style={{ background: 'radial-gradient(circle, #f59e0b, transparent 70%)' }} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 flex items-center justify-center">
                      <Icon name="workspace_premium" className="text-yellow-400" size={24} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">{subData.plan}</h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 uppercase font-semibold">{subData.billing}</span>
                        <span className="text-[11px] text-on-surface-variant">
                          {subData.is_yearly ? "Paid 12 Months" : "Active"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {subData.status === "active" && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      <span className="text-[11px] font-medium text-green-400">Active</span>
                    </div>
                  )}
                </div>

                {subData.is_yearly ? (
                  <div>
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-3xl font-bold text-white">{subData.months_used}</span>
                      <span className="text-sm text-on-surface-variant">/ {subData.total_months} months</span>
                    </div>
                    <div className="w-full h-2 bg-surface-container-high rounded-full mb-4 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(subData.months_used / subData.total_months) * 100}%`, background: 'linear-gradient(90deg, #f59e0b, #d97706)' }} />
                    </div>
                    <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 mb-4">
                      {Array.from({ length: subData.total_months }, (_, i) => {
                        const monthNum = i + 1;
                        const isPast = monthNum <= subData.months_used;
                        const isCurrent = monthNum === subData.months_used + 1;
                        return (
                          <div key={monthNum} className={`flex flex-col items-center gap-1 p-2 rounded-xl text-center transition-all ${
                            isPast ? "bg-yellow-400/10 border border-yellow-400/20" :
                            isCurrent ? "bg-blue-500/10 border border-blue-500/20" :
                            "bg-surface-container-high border border-white/5"
                          }`}>
                            <span className="text-[9px] font-medium text-on-surface-variant">Month</span>
                            <span className={`text-sm font-bold ${isPast ? "text-yellow-400" : isCurrent ? "text-blue-400" : "text-on-surface-variant"}`}>{monthNum}</span>
                            <span className="text-[10px]">{isPast ? "✅" : isCurrent ? "⏳" : ""}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-on-surface-variant">Expires <span className="text-white font-medium">{new Date(subData.expires_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</span></span>
                      {subData.auto_renew && <span className="text-[11px] text-yellow-400/70">Auto-renewal ON</span>}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      <div className="p-3 rounded-xl bg-surface-container-low border border-white/5">
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">Current Cycle</span>
                        <p className="text-xs text-white mt-1">
                          {new Date(subData.starts_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                          <span className="text-on-surface-variant"> → </span>
                          {new Date(subData.expires_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-surface-container-low border border-white/5">
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">Days Left</span>
                        <p className="text-2xl font-bold text-white mt-1">{subData.days_left}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-surface-container-low border border-white/5">
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">Next Payment</span>
                        <p className="text-xs text-white mt-1">{new Date(subData.next_payment).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-surface-container-low border border-white/5">
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">Credits</span>
                        <p className="text-xl font-bold text-yellow-400 mt-1">{subData.credits_per_cycle || "—"}/mo</p>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-yellow-400 transition-all duration-500" style={{ width: `${Math.min(100, (subData.months_used / subData.total_months) * 100)}%` }} />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[11px] text-on-surface-variant">{Math.min(100, Math.round((subData.months_used / subData.total_months) * 100))}% complete</span>
                      {subData.auto_renew && <span className="text-[11px] text-yellow-400/70">Auto-renewal ON</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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
            <div className="space-y-6">

              {/* Credits Card */}
              <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 border border-white/5" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(99,102,241,0.05), rgba(0,0,0,0.2))' }}>
                <div className="absolute top-0 right-0 w-48 h-48 opacity-[0.06]" style={{ background: 'radial-gradient(circle, #a855f7, transparent 70%)' }} />
                <div className="absolute bottom-0 left-0 w-36 h-36 opacity-[0.04]" style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }} />
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-on-surface-variant">Available Credits</span>
                    </div>
                    <div className="text-4xl md:text-5xl font-bold text-white tracking-tight">{creditsDisplay}</div>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-yellow-400/10 flex items-center justify-center">
                    <Icon name="bolt" className="text-yellow-400" size={28} />
                  </div>
                </div>
              </div>

              {/* Storage Card */}
              {storageData && (
                <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 border border-white/5" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(16,185,129,0.04), transparent)' }}>
                  <div className="absolute top-0 right-0 w-48 h-48 opacity-[0.05]" style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-on-surface-variant">Storage</span>
                      </div>
                      <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                        <Icon name="folder" className="text-blue-400" size={20} />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-2xl font-bold text-white">{formatBytes(storageData.used_bytes)}</span>
                      <span className="text-sm text-on-surface-variant">/ {formatBytes(storageData.limit_bytes)}</span>
                    </div>
                    <div className="w-full h-2 bg-surface-container-high rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${storageData.used_percent}%`,
                          background: storageData.used_percent > 90
                            ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                            : "linear-gradient(90deg, #3b82f6, #10b981)",
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[11px] text-on-surface-variant">{storageData.used_percent}% used</span>
                      <span className="text-[11px] text-on-surface-variant">{formatBytes(storageData.free_bytes)} free</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="rounded-2xl p-6 md:p-8 border border-white/5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
                <h2 className="text-sm font-semibold text-white mb-5">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button onClick={() => router.push("/affiliate")} className="flex items-center gap-4 px-5 py-4 rounded-xl bg-surface-container-low border border-surface-border/50 hover:border-primary/40 hover:bg-surface-container-high hover:translate-y-[-1px] transition-all text-left group shadow-sm">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/10 transition-all">
                      <Icon name="edit" className="text-primary" size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Affiliate</div>
                    </div>
                    <div className="ml-auto text-on-surface-variant/30 group-hover:text-primary/50 transition-all">
                      <Icon name="chevron_right" size={18} />
                    </div>
                  </button>
                  {!isGoogleUser && (
                    <button onClick={() => setTab("security")} className="flex items-center gap-4 px-5 py-4 rounded-xl bg-surface-container-low border border-surface-border/50 hover:border-primary/40 hover:bg-surface-container-high hover:translate-y-[-1px] transition-all text-left group shadow-sm">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/10 transition-all">
                        <Icon name="lock" className="text-primary" size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">Reset Password</div>
                        <div className="text-[11px] text-on-surface-variant">Change your password</div>
                      </div>
                      <div className="ml-auto text-on-surface-variant/30 group-hover:text-primary/50 transition-all">
                        <Icon name="chevron_right" size={18} />
                      </div>
                    </button>
                  )}
                  {!isGoogleUser && (
                    <button onClick={() => router.push("/forgot-password")} className="flex items-center gap-4 px-5 py-4 rounded-xl bg-surface-container-low border border-surface-border/50 hover:border-primary/40 hover:bg-surface-container-high hover:translate-y-[-1px] transition-all text-left group shadow-sm">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/10 transition-all">
                        <Icon name="refresh" className="text-primary" size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">Recover Password</div>
                        <div className="text-[11px] text-on-surface-variant">Recover your password</div>
                      </div>
                      <div className="ml-auto text-on-surface-variant/30 group-hover:text-primary/50 transition-all">
                        <Icon name="chevron_right" size={18} />
                      </div>
                    </button>
                  )}
                  <button onClick={() => router.push("/pricing")} className="flex items-center gap-4 px-5 py-4 rounded-xl bg-surface-container-low border border-surface-border/50 hover:border-yellow-400/40 hover:bg-surface-container-high hover:translate-y-[-1px] transition-all text-left group shadow-sm">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-yellow-400/20 to-yellow-400/5 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-yellow-400/10 transition-all">
                      <Icon name="bolt" className="text-yellow-400" size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Buy Credits</div>
                      <div className="text-[11px] text-on-surface-variant">Top up your balance</div>
                    </div>
                    <div className="ml-auto text-on-surface-variant/30 group-hover:text-yellow-400/50 transition-all">
                      <Icon name="chevron_right" size={18} />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === "security" && (
            <div className="space-y-6">

              {/* Email Section */}
              <div className="rounded-2xl p-6 md:p-8 border border-white/5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Icon name="mail" className="text-primary" size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">Email Address</h2>
                    <p className="text-[11px] text-on-surface-variant">Your current login email</p>
                  </div>
                </div>
                <div className="flex items-center justify-between px-5 py-3.5 bg-surface-container-low rounded-xl border border-surface-border/40">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-green-500 shrink-0 shadow-sm shadow-green-500/50" />
                    <span className="text-sm text-white truncate font-medium">{email}</span>
                  </div>
                  <button className="shrink-0 ml-3 px-4 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-all">Change</button>
                </div>
              </div>

              {!isGoogleUser && (
                <div className="rounded-2xl p-6 md:p-8 border border-white/5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Icon name="lock" className="text-primary" size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-white">Password</h2>
                      <p className="text-[11px] text-on-surface-variant">Set a strong password to protect your account</p>
                    </div>
                  </div>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    {cpError && <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2"><Icon name="error" size={14} className="shrink-0" />{cpError}</div>}
                    {cpMessage && <div className="p-3.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs flex items-center gap-2"><Icon name="check_circle" size={14} className="shrink-0" />{cpMessage}</div>}
                    <div>
                      <label className="text-[11px] font-medium text-on-surface-variant mb-1.5 block">Current Password</label>
                      <input type="password" value={cpCurrent} onChange={(e) => setCpCurrent(e.target.value)} placeholder="Enter current password" className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-xl px-4 py-3 text-sm text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all" />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-on-surface-variant mb-1.5 block">New Password</label>
                      <input type="password" value={cpNew} onChange={(e) => setCpNew(e.target.value)} placeholder="Enter new password" className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-xl px-4 py-3 text-sm text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all" />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-on-surface-variant mb-1.5 block">Confirm New Password</label>
                      <input type="password" value={cpConfirm} onChange={(e) => setCpConfirm(e.target.value)} placeholder="Confirm new password" className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-xl px-4 py-3 text-sm text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all" />
                    </div>
                    <button type="submit" disabled={cpLoading} className="w-full primary-gradient text-white font-semibold py-3 rounded-xl text-sm hover:opacity-90 hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                      {cpLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="lock" size={14} />}
                      Update Password
                    </button>
                  </form>
                </div>
              )}

              {!isGoogleUser && (
                <div className="rounded-2xl p-6 md:p-8 border border-white/5 hover:border-primary/20 transition-all" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.04), transparent)' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                      <Icon name="refresh" className="text-primary" size={20} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-sm font-semibold text-white">Recover Password</h2>
                      <p className="text-[11px] text-on-surface-variant">Send recovery link to your email</p>
                    </div>
                    <button onClick={() => router.push("/forgot-password")} className="shrink-0 px-5 py-2 rounded-xl text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-all">Send Link</button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
      </SidebarProvider>
    </div>
    </AuthGuard>
  );
}

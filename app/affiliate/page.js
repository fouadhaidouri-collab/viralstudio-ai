"use client";

import { useState } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import AuthGuard from "../components/AuthGuard";
import { SidebarProvider } from "../components/SidebarContext";
import { useAuth } from "../lib/AuthContext";
import Icon from "../components/Icon";

export default function AffiliatePage() {
  const { user } = useAuth();
  const email = user?.email || "user@example.com";
  const name = user?.name || email.split("@")[0];
  const username = email.split("@")[0];
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(`https://viralstudio.ai/ref/${username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(`${username.toUpperCase()}20`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = [
    { label: "Total Clicks", value: "1,248" },
    { label: "Signups", value: "82" },
    { label: "Paid Customers", value: "19" },
    { label: "Conversion", value: "23%" },
    { label: "Total Earnings", value: "$486", green: true },
    { label: "Pending", value: "$120" },
    { label: "Paid", value: "$366" },
    { label: "Commission", value: "30%" },
  ];

  const referrals = [
    { name: "John", plan: "Pro Monthly", amount: 8.7, status: "Paid" },
    { name: "Sarah", plan: "Pro Yearly", amount: 29.7, status: "Pending" },
    { name: "Mike", plan: "Credits", amount: 4.5, status: "Paid" },
  ];

  return (
    <AuthGuard>
    <div className="h-screen overflow-hidden no-x-scroll">
      <SidebarProvider>
      <Sidebar />
      <TopBar />
      <main className="fixed top-14 md:top-16 right-0 w-full md:w-[calc(100%-16rem)] bottom-0 overflow-y-auto smooth-scroll">
        <div className="max-w-full mx-auto px-4 md:px-8 py-6 md:py-10">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white">Affiliate Dashboard</h1>
            <p className="text-sm text-on-surface-variant mt-1">Invite creators and earn 30% commission on every successful payment.</p>
          </div>

          {/* Profile Info */}
          <div className="glass-card rounded-2xl p-8 border border-white/5 card-glow mb-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.06), rgba(99,102,241,0.03), transparent)' }}>
            <div className="absolute top-0 right-0 w-48 h-48 opacity-5" style={{ background: 'radial-gradient(circle, #a855f7, transparent 70%)' }} />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="text-lg font-bold text-white">{name?.charAt(0) || "?"}</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{name}</h3>
                  <p className="text-xs text-on-surface-variant">Affiliate Program</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-xs font-semibold text-green-400">Active</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="px-5 py-4 bg-surface-container-low rounded-xl border border-surface-border/40">
                  <div className="text-[11px] text-on-surface-variant mb-1">Email</div>
                  <div className="text-sm font-medium text-white">{email}</div>
                </div>
                <div className="px-5 py-4 bg-surface-container-low rounded-xl border border-surface-border/40">
                  <div className="text-[11px] text-on-surface-variant mb-1">Referral Code</div>
                  <div className="text-sm font-bold text-primary tracking-wider uppercase">{username}20</div>
                </div>
              </div>
            </div>
          </div>

          {/* Referral Link */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 card-glow mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon name="link" className="text-primary" size={16} />
              </div>
              <h3 className="text-sm font-semibold text-white">Your Referral Link</h3>
            </div>
            <div className="flex">
              <input
                readOnly
                value={`https://viralstudio.ai/ref/${username}`}
                className="flex-1 px-4 py-3.5 bg-surface-container-lowest border border-surface-border/60 text-white text-sm rounded-l-xl outline-none"
              />
              <button onClick={copyLink} className="w-[120px] primary-gradient text-white font-semibold text-sm rounded-r-xl hover:opacity-90 transition-all">
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((s, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 border border-white/5 card-glow">
                <h2 className="text-xs font-medium text-on-surface-variant mb-2">{s.label}</h2>
                <div className={`text-2xl md:text-3xl font-bold ${s.green ? 'text-green-400' : 'text-white'}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Withdraw */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 card-glow mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-green-400/10 flex items-center justify-center">
                <Icon name="payments" className="text-green-400" size={16} />
              </div>
              <h3 className="text-sm font-semibold text-white">Withdraw Earnings</h3>
            </div>
            <select className="w-full px-4 py-3.5 bg-surface-container-lowest border border-surface-border/60 text-white text-sm rounded-xl outline-none mb-4">
              <option>PayPal</option>
              <option>USDT (TRC20)</option>
              <option>Bank Transfer</option>
            </select>
            <button className="w-full primary-gradient text-white font-semibold py-3.5 rounded-xl text-base hover:opacity-90 transition-all active:scale-[0.98]">
              Request Withdrawal
            </button>
          </div>

          {/* Referrals Table */}
          <div className="glass-card rounded-2xl border border-white/5 card-glow overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-container-higher/50">
                  <th className="text-left px-5 py-4 text-xs font-semibold text-on-surface-variant">Customer</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-on-surface-variant">Plan</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-on-surface-variant">Amount</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-on-surface-variant">Status</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r, i) => (
                  <tr key={i} className="border-t border-surface-border/50">
                    <td className="px-5 py-4 text-sm text-white">{r.name}</td>
                    <td className="px-5 py-4 text-sm text-on-surface-variant">{r.plan}</td>
                    <td className="px-5 py-4 text-sm font-bold text-green-400">+${r.amount}</td>
                    <td className="px-5 py-4 text-sm text-on-surface-variant">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </main>
      </SidebarProvider>
    </div>
    </AuthGuard>
  );
}

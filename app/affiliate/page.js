"use client";

import { useState } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import AuthGuard from "../components/AuthGuard";
import { SidebarProvider } from "../components/SidebarContext";
import { useAuth } from "../lib/AuthContext";

export default function AffiliatePage() {
  const { user } = useAuth();
  const username = user?.email?.split("@")[0] || "fouad123";
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

          {/* Referral Link */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 card-glow mb-6" style={{ background: '#111114', border: '1px solid #232323' }}>
            <h2 className="text-sm font-medium text-on-surface-variant mb-3">Your Referral Link</h2>
            <div className="flex">
              <input
                readOnly
                value={`https://viralstudio.ai/ref/${username}`}
                className="flex-1 px-4 py-3.5 bg-[#1a1a1f] text-white text-sm rounded-l-xl border-none outline-none"
              />
              <button onClick={copyLink} className="w-[120px] bg-[#6366f1] hover:bg-[#5558e6] text-white font-semibold text-sm rounded-r-xl transition-all">
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((s, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 border border-white/5 card-glow" style={{ background: '#111114', border: '1px solid #232323' }}>
                <h2 className="text-xs font-medium text-on-surface-variant mb-2">{s.label}</h2>
                <div className={`text-2xl md:text-3xl font-bold ${s.green ? 'text-green-400' : 'text-white'}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Withdraw */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 card-glow mb-6" style={{ background: '#111114', border: '1px solid #232323' }}>
            <h2 className="text-sm font-semibold text-white mb-4">Withdraw Earnings</h2>
            <select className="w-full px-4 py-3.5 bg-[#1a1a1f] text-white text-sm rounded-xl border-none outline-none mb-4">
              <option>PayPal</option>
              <option>USDT (TRC20)</option>
              <option>Bank Transfer</option>
            </select>
            <button className="w-full bg-[#6366f1] hover:bg-[#5558e6] text-white font-semibold py-3.5 rounded-xl text-base transition-all">
              Request Withdrawal
            </button>
          </div>

          {/* Referrals Table */}
          <div className="glass-card rounded-2xl border border-white/5 card-glow overflow-hidden" style={{ background: '#111114', border: '1px solid #232323' }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#18181b]">
                  <th className="text-left px-5 py-4 text-xs font-semibold text-on-surface-variant">Customer</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-on-surface-variant">Plan</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-on-surface-variant">Amount</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-on-surface-variant">Status</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r, i) => (
                  <tr key={i} className="border-t border-[#222]">
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

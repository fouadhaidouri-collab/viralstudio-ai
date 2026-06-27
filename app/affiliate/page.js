"use client";

import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import AuthGuard from "../components/AuthGuard";
import { SidebarProvider } from "../components/SidebarContext";
import { useAuth } from "../lib/AuthContext";
import Icon from "../components/Icon";

export default function AffiliatePage() {
  const { user } = useAuth();
  const email = user?.email || "";
  const name = user?.name || email.split("@")[0];
  const [data, setData] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [copied, setCopied] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState("PayPal");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawStatus, setWithdrawStatus] = useState("");

  useEffect(() => {
    fetch("/api/affiliate/stats").then((r) => r.json()).then(setData).catch(() => {});
    fetch("/api/affiliate/referrals").then((r) => r.json()).then((d) => setReferrals(d.referrals || [])).catch(() => {});
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(`https://viralstudio.ai/ref/${email.split("@")[0]}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(`${email.split("@")[0].toUpperCase()}20`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) return;
    setWithdrawStatus("processing");
    const res = await fetch("/api/affiliate/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amt, method: withdrawMethod }),
    });
    if (res.ok) {
      setWithdrawStatus("success");
      setWithdrawAmount("");
      fetch("/api/affiliate/stats").then((r) => r.json()).then(setData).catch(() => {});
      setTimeout(() => setWithdrawStatus(""), 3000);
    } else {
      const err = await res.json();
      setWithdrawStatus(err.error || "error");
      setTimeout(() => setWithdrawStatus(""), 3000);
    }
  };

  const stats = data ? [
    { label: "Total Clicks", value: data.clicks_total.toLocaleString() },
    { label: "Signups", value: data.signups_total.toLocaleString() },
    { label: "Paid Customers", value: data.paid_customers.toLocaleString() },
    { label: "Conversion", value: `${data.conversion_rate}%` },
    { label: "Total Earnings", value: `$${data.total_earnings.toFixed(2)}`, green: true },
    { label: "Pending", value: `$${data.pending.toFixed(2)}` },
    { label: "Paid", value: `$${data.paid.toFixed(2)}` },
    { label: "Commission", value: `${data.commission_rate}%` },
  ] : [];

  const statusLabel = data?.affiliate?.status === "active" ? "Active" : "Inactive";
  const statusColor = data?.affiliate?.status === "active" ? "text-green-400" : "text-on-surface-variant";
  const statusDot = data?.affiliate?.status === "active" ? "bg-green-400" : "bg-on-surface-variant";

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
            <p className="text-sm text-on-surface-variant mt-1">Invite creators and earn {data?.commission_rate || 30}% commission on every successful payment.</p>
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
                  <span className={`w-2 h-2 rounded-full ${statusDot}`} />
                  <span className={`text-xs font-semibold ${statusColor}`}>{statusLabel}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="px-5 py-4 bg-surface-container-low rounded-xl border border-surface-border/40">
                  <div className="text-[11px] text-on-surface-variant mb-1">Email</div>
                  <div className="text-sm font-medium text-white">{email}</div>
                </div>
                <div className="px-5 py-4 bg-surface-container-low rounded-xl border border-surface-border/40">
                  <div className="text-[11px] text-on-surface-variant mb-1">Referral Code</div>
                  <div className="text-sm font-bold text-primary tracking-wider uppercase">{email.split("@")[0]}20</div>
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
                value={`https://viralstudio.ai/ref/${email.split("@")[0]}`}
                className="flex-1 px-4 py-3.5 bg-surface-container-lowest border border-surface-border/60 text-white text-sm rounded-l-xl outline-none"
              />
              <button onClick={copyLink} className="w-[120px] primary-gradient text-white font-semibold text-sm rounded-r-xl hover:opacity-90 transition-all">
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          {data && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((s, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 border border-white/5 card-glow">
                <h2 className="text-xs font-medium text-on-surface-variant mb-2">{s.label}</h2>
                <div className={`text-2xl md:text-3xl font-bold ${s.green ? 'text-green-400' : 'text-white'}`}>{s.value}</div>
              </div>
            ))}
          </div>
          )}

          {/* Withdraw */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 card-glow mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-green-400/10 flex items-center justify-center">
                <Icon name="payments" className="text-green-400" size={16} />
              </div>
              <h3 className="text-sm font-semibold text-white">Withdraw Earnings</h3>
            </div>
            <div className="flex gap-3 mb-4">
              <select
                value={withdrawMethod}
                onChange={(e) => setWithdrawMethod(e.target.value)}
                className="w-[180px] px-4 py-3.5 bg-surface-container-lowest border border-surface-border/60 text-white text-sm rounded-xl outline-none"
              >
                <option>PayPal</option>
                <option>USDT (TRC20)</option>
                <option>Bank Transfer</option>
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="Amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="flex-1 px-4 py-3.5 bg-surface-container-lowest border border-surface-border/60 text-white text-sm rounded-xl outline-none"
              />
            </div>
            <button
              onClick={handleWithdraw}
              className="w-full primary-gradient text-white font-semibold py-3.5 rounded-xl text-base hover:opacity-90 transition-all active:scale-[0.98]"
              disabled={withdrawStatus === "processing"}
            >
              {withdrawStatus === "processing" ? "Processing..." : withdrawStatus === "success" ? "Withdrawal Requested!" : "Request Withdrawal"}
            </button>
            {withdrawStatus && withdrawStatus !== "processing" && withdrawStatus !== "success" && (
              <p className="text-xs text-red-400 mt-2">{withdrawStatus}</p>
            )}
            {data && (
              <p className="text-xs text-on-surface-variant mt-2">Available: ${data.pending.toFixed(2)}</p>
            )}
          </div>

          {/* Referrals Table */}
          <div className="glass-card rounded-2xl border border-white/5 card-glow overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-border/50">
              <h3 className="text-sm font-semibold text-white">My Referrals</h3>
            </div>
            {referrals.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-on-surface-variant">No referrals yet. Share your link to start earning!</div>
            ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-container-higher/50">
                  <th className="text-left px-5 py-4 text-xs font-semibold text-on-surface-variant">Referred Email</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-on-surface-variant">Plan</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-on-surface-variant">Amount</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-on-surface-variant">Commission</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-on-surface-variant">Status</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-on-surface-variant">Date</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r, i) => (
                  <tr key={r.id || i} className="border-t border-surface-border/50">
                    <td className="px-5 py-4 text-sm text-white">{r.referred_email}</td>
                    <td className="px-5 py-4 text-sm text-on-surface-variant">{r.plan || "-"}</td>
                    <td className="px-5 py-4 text-sm text-white">{r.amount ? `$${r.amount}` : "-"}</td>
                    <td className="px-5 py-4 text-sm font-bold text-green-400">{r.commission_earned ? `+$${r.commission_earned}` : "-"}</td>
                    <td className="px-5 py-4 text-sm">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        r.status === "paid" ? "bg-green-500/10 text-green-400" :
                        r.status === "pending" ? "bg-yellow-500/10 text-yellow-400" :
                        "bg-surface-container-high text-on-surface-variant"
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${
                          r.status === "paid" ? "bg-green-400" :
                          r.status === "pending" ? "bg-yellow-400" :
                          "bg-on-surface-variant"
                        }`} />
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-on-surface-variant">{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>

        </div>
      </main>
      </SidebarProvider>
    </div>
    </AuthGuard>
  );
}

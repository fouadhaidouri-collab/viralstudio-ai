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
  const [withdrawDetails, setWithdrawDetails] = useState("");
  const [withdrawStatus, setWithdrawStatus] = useState("");
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawDetail, setWithdrawDetail] = useState(null);
  const [editingWdr, setEditingWdr] = useState(null);
  const [editMethod, setEditMethod] = useState("");
  const [editAccount, setEditAccount] = useState("");

  const couponCode = data?.affiliate?.referral_code || "";
  const referralLink = `https://viralstudio-ai.com/ref/${data?.affiliate?.referral_code || name}`;

  useEffect(() => {
    fetch("/api/affiliate/stats").then((r) => r.json()).then(setData).catch(() => {});
    fetch("/api/affiliate/referrals").then((r) => r.json()).then((d) => setReferrals(d.referrals || [])).catch(() => {});
    fetch("/api/affiliate/withdrawals").then((r) => r.json()).then((d) => setWithdrawals(d.withdrawals || [])).catch(() => {});
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) return;
    if (amt < 100) { setWithdrawStatus("Minimum withdrawal is $100"); setTimeout(() => setWithdrawStatus(""), 3000); return; }
    if (amt > 10000) { setWithdrawStatus("Maximum withdrawal is $10,000"); setTimeout(() => setWithdrawStatus(""), 3000); return; }
    if (!withdrawDetails) { setWithdrawStatus(`Please enter your ${withdrawMethod} details`); setTimeout(() => setWithdrawStatus(""), 3000); return; }
    setWithdrawStatus("processing");
    try {
      const res = await fetch("/api/affiliate/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, method: withdrawMethod, account_details: withdrawDetails }),
      });
      if (res.ok) {
        setWithdrawStatus("success");
        setWithdrawAmount("");
        fetch("/api/affiliate/stats").then((r) => r.json()).then(setData).catch(() => {});
        fetch("/api/affiliate/withdrawals").then((r) => r.json()).then((d) => setWithdrawals(d.withdrawals || [])).catch(() => {});
        setTimeout(() => setWithdrawStatus(""), 3000);
      } else {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        setWithdrawStatus(err.error || "error");
        setTimeout(() => setWithdrawStatus(""), 3000);
      }
    } catch (e) {
      setWithdrawStatus("Network error. Please try again.");
      setTimeout(() => setWithdrawStatus(""), 3000);
    }
  };

  const stats = data ? [
    { label: "Total Clicks", value: data.clicks_total.toLocaleString() },
    { label: "Signups", value: data.signups_total.toLocaleString() },
    { label: "Paid Customers", value: data.paid_customers.toLocaleString() },
    { label: "Conversion", value: `${data.conversion_rate}%` },
    { label: "Total Profit", value: `$${data.paid.toFixed(2)}`, green: true },
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
             <p className="text-sm text-on-surface-variant mt-1">Invite creators and earn {data?.commission_rate || 20}% commission on every successful payment.</p>
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
                  <div className="text-[11px] text-on-surface-variant mb-1">Coupon Code</div>
                  <div className="text-sm font-bold text-primary tracking-wider uppercase">{couponCode}</div>
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
                value={referralLink}
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
                onChange={(e) => { setWithdrawMethod(e.target.value); setWithdrawDetails(""); }}
                className="w-[180px] px-4 py-3.5 bg-surface-container-lowest border border-surface-border/60 text-white text-sm rounded-xl outline-none"
              >
                <option>PayPal</option>
                <option>USDT (TRC20)</option>
                <option>Bank Transfer</option>
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="Amount ($100 - $10,000)"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="flex-1 px-4 py-3.5 bg-surface-container-lowest border border-surface-border/60 text-white text-sm rounded-xl outline-none"
              />
            </div>
            <div className="mb-4">
              <input
                type="text"
                placeholder={
                  withdrawMethod === "PayPal" ? "PayPal Email" :
                  withdrawMethod === "USDT (TRC20)" ? "USDT (TRC20) Wallet Address" :
                  "Bank Account Details (Account name, IBAN, Routing#)"
                }
                value={withdrawDetails}
                onChange={(e) => setWithdrawDetails(e.target.value)}
                className="w-full px-4 py-3.5 bg-surface-container-lowest border border-surface-border/60 text-white text-sm rounded-xl outline-none"
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
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-on-surface-variant">Available: <span className="text-white font-semibold">${data.pending.toFixed(2)}</span></p>
                <p className="text-xs text-on-surface-variant">Min $100 · Max $10,000 · Once per 30 days</p>
              </div>
            )}
          </div>

          {/* Withdrawal History */}
          <div className="glass-card rounded-2xl border border-white/5 card-glow overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-surface-border/50">
              <h3 className="text-sm font-semibold text-white">Withdrawal History</h3>
            </div>
            {withdrawals.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-on-surface-variant">No withdrawal requests yet.</div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-container-higher/50">
                    <th className="text-left px-5 py-4 text-xs font-semibold text-on-surface-variant">Date</th>
                    <th className="text-left px-5 py-4 text-xs font-semibold text-on-surface-variant">Amount</th>
                    <th className="text-left px-5 py-4 text-xs font-semibold text-on-surface-variant">Method</th>
                    <th className="text-left px-5 py-4 text-xs font-semibold text-on-surface-variant">Account</th>
                    <th className="text-left px-5 py-4 text-xs font-semibold text-on-surface-variant">Status</th>
                    <th className="text-left px-5 py-4 text-xs font-semibold text-on-surface-variant"></th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w, i) => (
                    <tr key={w.id || i} className="border-t border-surface-border/50">
                      <td className="px-5 py-4 text-sm text-on-surface-variant whitespace-nowrap">{new Date(w.created_at).toLocaleDateString()}</td>
                      <td className="px-5 py-4 text-sm text-white font-semibold">${Number(w.amount).toFixed(2)}</td>
                      <td className="px-5 py-4 text-sm text-on-surface-variant">{w.payment_method || w.method}</td>
                      <td className="px-5 py-4 text-sm text-on-surface-variant max-w-[150px] truncate" title={w.payment_account}>{w.payment_account || "-"}</td>
                      <td className="px-5 py-4 text-sm">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          w.status === "approved" || w.status === "completed" ? "bg-green-500/10 text-green-400" :
                          w.status === "rejected" ? "bg-red-500/10 text-red-400" :
                          "bg-yellow-500/10 text-yellow-400"
                        }`}>
                          {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm">
                        <div className="flex gap-2">
                          {w.status === "pending" && (
                            <>
                              <button onClick={() => { setEditingWdr(w); setEditMethod(w.payment_method || w.method); setEditAccount(w.payment_account || ""); }} className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-all">Edit</button>
                              <button onClick={async () => { if (!confirm("Cancel this withdrawal request?")) return; await fetch(`/api/affiliate/withdrawals/${w.id}`, { method: "DELETE" }); fetch("/api/affiliate/withdrawals").then(r=>r.json()).then(d=>setWithdrawals(d.withdrawals||[])).catch(()=>{}); fetch("/api/affiliate/stats").then(r=>r.json()).then(setData).catch(()=>{}); }} className="text-xs font-semibold text-red-400 hover:text-red-300 transition-all">Cancel</button>
                            </>
                          )}
                          <button onClick={() => setWithdrawDetail(w)} className="text-xs font-semibold text-secondary hover:text-primary transition-all">View</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>

          {editingWdr && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditingWdr(null)}>
              <div className="bg-surface-container border border-surface-border/80 rounded-2xl max-w-sm w-full mx-4 animate-dropdown-open" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 pb-3">
                  <h3 className="text-sm font-bold text-white">Edit Withdrawal</h3>
                  <button onClick={() => setEditingWdr(null)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container-high hover:bg-surface-container-higher transition-all">
                    <span className="text-on-surface-variant text-lg leading-none">&times;</span>
                  </button>
                </div>
                <div className="px-5 pb-5 space-y-3">
                  <p className="text-xs text-on-surface-variant">Update your withdrawal details for request <span className="text-white font-mono">{editingWdr.id.slice(0, 12)}...</span></p>
                  <select value={editMethod} onChange={(e) => setEditMethod(e.target.value)} className="w-full px-4 py-3 bg-surface-container-lowest border border-surface-border/60 text-white text-sm rounded-xl outline-none">
                    <option>PayPal</option>
                    <option>USDT (TRC20)</option>
                    <option>Bank Transfer</option>
                  </select>
                  <input type="text" value={editAccount} onChange={(e) => setEditAccount(e.target.value)} placeholder={
                    editMethod === "PayPal" ? "PayPal Email" :
                    editMethod === "USDT (TRC20)" ? "USDT (TRC20) Wallet Address" :
                    "Bank Account Details"
                  } className="w-full px-4 py-3 bg-surface-container-lowest border border-surface-border/60 text-white text-sm rounded-xl outline-none" />
                  <button onClick={async () => {
                    if (!editAccount) return;
                    await fetch(`/api/affiliate/withdrawals/${editingWdr.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ payment_method: editMethod, payment_account: editAccount }) });
                    setEditingWdr(null);
                    fetch("/api/affiliate/withdrawals").then(r=>r.json()).then(d=>setWithdrawals(d.withdrawals||[])).catch(()=>{});
                  }} className="w-full primary-gradient text-white font-semibold py-3 rounded-xl text-sm hover:opacity-90 transition-all">Save Changes</button>
                </div>
              </div>
            </div>
          )}

          {withdrawDetail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setWithdrawDetail(null)}>
              <div className="bg-surface-container border border-surface-border/80 rounded-2xl max-w-sm w-full mx-4 animate-dropdown-open" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 pb-3">
                  <h3 className="text-sm font-bold text-white">Withdrawal Details</h3>
                  <button onClick={() => setWithdrawDetail(null)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container-high hover:bg-surface-container-higher transition-all">
                    <span className="text-on-surface-variant text-lg leading-none">&times;</span>
                  </button>
                </div>
                <div className="px-5 pb-5 space-y-3">
                  <div className="flex justify-between"><span className="text-xs text-on-surface-variant">Amount</span><span className="text-xs text-white font-semibold">${Number(withdrawDetail.amount).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-on-surface-variant">Method</span><span className="text-xs text-white">{withdrawDetail.payment_method || withdrawDetail.method}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-on-surface-variant">Account</span><span className="text-xs text-white break-all max-w-[200px] text-right">{withdrawDetail.payment_account || withdrawDetail.account_details}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-on-surface-variant">Status</span>
                    <span className={`text-xs font-semibold ${
                      withdrawDetail.status === "approved" || withdrawDetail.status === "completed" ? "text-green-400" :
                      withdrawDetail.status === "rejected" ? "text-red-400" :
                      "text-yellow-400"
                    }`}>{withdrawDetail.status.charAt(0).toUpperCase() + withdrawDetail.status.slice(1)}</span>
                  </div>
                  <div className="flex justify-between"><span className="text-xs text-on-surface-variant">Date</span><span className="text-xs text-white">{new Date(withdrawDetail.created_at).toLocaleString()}</span></div>
                  {withdrawDetail.admin_note && <div className="flex justify-between"><span className="text-xs text-on-surface-variant">Admin Note</span><span className="text-xs text-white max-w-[200px] text-right">{withdrawDetail.admin_note}</span></div>}
                </div>
              </div>
            </div>
          )}

          {/* Recent Visits */}
          {data?.clicks_latest?.length > 0 && (
          <div className="glass-card rounded-2xl border border-white/5 card-glow overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-surface-border/50">
              <h3 className="text-sm font-semibold text-white">Recent Visits</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-container-higher/50">
                    <th className="text-left px-5 py-4 text-xs font-semibold text-on-surface-variant">Date</th>
                    <th className="text-left px-5 py-4 text-xs font-semibold text-on-surface-variant">IP</th>
                    <th className="text-left px-5 py-4 text-xs font-semibold text-on-surface-variant">Referrer</th>
                    <th className="text-left px-5 py-4 text-xs font-semibold text-on-surface-variant">User Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {data.clicks_latest.slice(0, 20).map((c, i) => (
                    <tr key={c.id || i} className="border-t border-surface-border/50">
                      <td className="px-5 py-4 text-sm text-on-surface-variant whitespace-nowrap">{new Date(c.created_at).toLocaleString()}</td>
                      <td className="px-5 py-4 text-sm text-white font-mono">{c.ip}</td>
                      <td className="px-5 py-4 text-sm text-on-surface-variant max-w-[200px] truncate">{c.referrer || "-"}</td>
                      <td className="px-5 py-4 text-sm text-on-surface-variant max-w-[250px] truncate" title={c.user_agent}>{c.user_agent?.slice(0, 60) || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )}

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

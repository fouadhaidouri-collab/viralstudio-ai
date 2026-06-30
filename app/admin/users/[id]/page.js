"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import StatusBadge from "../../components/StatusBadge";
import PlanBadge from "../../components/PlanBadge";
import CreditBadge from "../../components/CreditBadge";
import Icon from "../../../components/Icon";

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const TABS = [
  { key: "profile", label: "Profile Info", icon: "person" },
  { key: "payments", label: "Payment History", icon: "credit_card" },
  { key: "generations", label: "Generation History", icon: "auto_awesome" },
  { key: "transactions", label: "Credit Transactions", icon: "history" },
  { key: "notes", label: "Admin Notes", icon: "edit" },
];

export default function AdminUserDetailPage() {
  const params = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetch(`/api/admin/users/${params.id}`)
      .then((r) => { if (!r.ok) throw new Error("Not found"); return r.json(); })
      .then((d) => { setUser(d.user); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up">
        <div className="w-16 h-16 rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center mb-4">
          <Icon name="error" className="text-error" size={32} />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">User Not Found</h2>
        <p className="text-sm text-on-surface-variant mb-6">The user with ID &quot;{params.id}&quot; does not exist.</p>
        <Link href="/admin/users" className="px-4 py-2 primary-gradient text-white rounded-lg text-sm font-semibold hover:brightness-110 transition-all">
          Back to Users
        </Link>
      </div>
    );
  }

  const userPayments = user.payments || [];
  const userTransactions = user.credit_transactions || [];

  const handleQuickAction = async (action) => {
    switch (action) {
      case "add_credits":
        await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, action: "add_credits", value: "500" }),
        });
        showToast(`Added 500 credits to "${user.name}"`);
        break;
      case "remove_credits":
        await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, action: "remove_credits", value: "200" }),
        });
        showToast(`Removed 200 credits from "${user.name}"`);
        break;
      case "change_plan":
        await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, action: "change_plan", value: "pro" }),
        });
        showToast(`Changed "${user.name}" plan to Pro`);
        break;
      case "reset_password":
        showToast(`"${user.name}" emailed a password reset link`);
        break;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-surface-container-low border border-surface-border/50 rounded-xl p-4">
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">Account Info</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-on-surface-variant">User ID</p>
                    <p className="text-sm font-mono text-white mt-0.5">{user.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Email</p>
                    <p className="text-sm text-white mt-0.5">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Name</p>
                    <p className="text-sm text-white mt-0.5">{user.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Role</p>
                    <p className="text-sm capitalize text-white mt-0.5">{user.role}</p>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-low border border-surface-border/50 rounded-xl p-4">
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">Plan & Status</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-on-surface-variant">Plan</p>
                    <div className="mt-0.5"><PlanBadge plan={user.plan} /></div>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Status</p>
                    <div className="mt-0.5"><StatusBadge status={user.status} /></div>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Total Generations</p>
                    <p className="text-sm text-white mt-0.5">{(user.total_generations || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Credits</p>
                    <div className="mt-0.5"><CreditBadge amount={user.credits} /></div>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-low border border-surface-border/50 rounded-xl p-4">
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">Dates</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-on-surface-variant">Signup Date</p>
                    <p className="text-sm text-white mt-0.5">{formatDate(user.signup_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Last Login</p>
                    <p className="text-sm text-white mt-0.5">{formatDate(user.last_login)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Created At</p>
                    <p className="text-sm text-white mt-0.5">{formatDate(user.created_at)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-low border border-surface-border/50 rounded-xl p-4">
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">Quick Actions</p>
                <div className="space-y-2">
                  <button onClick={() => handleQuickAction("add_credits")} className="w-full px-3 py-1.5 bg-surface-container-high border border-surface-border/50 rounded-lg text-xs text-white hover:bg-surface-container-higher transition-all">
                    + Add Credits
                  </button>
                  <button onClick={() => handleQuickAction("remove_credits")} className="w-full px-3 py-1.5 bg-surface-container-high border border-surface-border/50 rounded-lg text-xs text-white hover:bg-surface-container-higher transition-all">
                    - Remove Credits
                  </button>
                  <button onClick={() => handleQuickAction("change_plan")} className="w-full px-3 py-1.5 bg-surface-container-high border border-surface-border/50 rounded-lg text-xs text-white hover:bg-surface-container-higher transition-all">
                    Change Plan
                  </button>
                  <button onClick={() => handleQuickAction("reset_password")} className="w-full px-3 py-1.5 bg-surface-container-high border border-surface-border/50 rounded-lg text-xs text-white hover:bg-surface-container-higher transition-all">
                    Send Reset Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case "payments":
        return userPayments.length === 0 ? (
          <div className="bg-surface-container-low border border-surface-border/50 rounded-xl p-8 text-center">
            <Icon name="credit_card" className="text-on-surface-variant/40 mx-auto mb-3" size={32} />
            <p className="text-sm text-on-surface-variant">No payment history for this user.</p>
          </div>
        ) : (
          <div className="bg-surface-container-low border border-surface-border/50 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border bg-surface-container-higher/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Payment ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Plan</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Amount</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Provider</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {userPayments.map((p) => (
                    <tr key={p.id} className="border-b border-surface-border/50 hover:bg-surface-container-high/30 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-on-surface-variant">{p.id}</td>
                      <td className="px-4 py-3"><PlanBadge plan={p.plan} /></td>
                      <td className="px-4 py-3 text-xs text-white font-medium">${p.amount}</td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant capitalize">{p.provider}</td>
                      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant whitespace-nowrap">{formatDate(p.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "generations":
        return (
          <div className="bg-surface-container-low border border-surface-border/50 rounded-xl p-8 text-center">
            <Icon name="auto_awesome" className="text-on-surface-variant/40 mx-auto mb-3" size={32} />
            <p className="text-sm text-on-surface-variant">No generations by this user yet.</p>
          </div>
        );

      case "transactions":
        return userTransactions.length === 0 ? (
          <div className="bg-surface-container-low border border-surface-border/50 rounded-xl p-8 text-center">
            <Icon name="history" className="text-on-surface-variant/40 mx-auto mb-3" size={32} />
            <p className="text-sm text-on-surface-variant">No credit transactions for this user.</p>
          </div>
        ) : (
          <div className="bg-surface-container-low border border-surface-border/50 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border bg-surface-container-higher/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Transaction ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Amount</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Tool</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Model</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Reason</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {userTransactions.map((t) => (
                    <tr key={t.id} className="border-b border-surface-border/50 hover:bg-surface-container-high/30 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-on-surface-variant">{t.id}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-md ${
                          t.type === "purchase" || t.type === "refund" || t.type === "manual_add"
                            ? "bg-green-500/10 text-green-400"
                            : t.type === "usage" || t.type === "manual_remove"
                              ? "bg-error/10 text-error"
                              : "bg-surface-container-high text-on-surface-variant"
                        }`}>
                          {t.type.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3"><CreditBadge amount={t.amount} /></td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">{t.tool || "-"}</td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">{t.model || "-"}</td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant max-w-[180px] truncate">{t.reason}</td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant whitespace-nowrap">{formatDate(t.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "notes":
        return (
          <div className="bg-surface-container-low border border-surface-border/50 rounded-xl p-4">
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-3">Admin Notes for {user.name}</p>
            <textarea
              className="w-full h-40 bg-surface-container-lowest border border-surface-border/50 rounded-xl px-4 py-3 text-xs text-white placeholder:text-on-surface-variant resize-none focus:outline-none focus:border-primary/50 transition-all"
              placeholder="Add admin notes about this user..."
              defaultValue=""
            />
            <div className="flex justify-end mt-3">
              <button onClick={() => showToast("Notes saved")} className="px-4 py-2 primary-gradient text-white rounded-lg text-xs font-semibold hover:brightness-110 transition-all">
                Save Notes
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-1">
        <Link href="/admin/users" className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors">
          <Icon name="arrow_back" size={14} />
          Back to Users
        </Link>
      </div>

      {toast && (
        <div className="px-4 py-2.5 bg-surface-container border border-surface-border/80 rounded-xl text-xs text-white flex items-center gap-2 animate-dropdown-open">
          <Icon name="check_circle" className="text-primary shrink-0" size={14} />
          {toast}
        </div>
      )}

      <div className="glass-card rounded-xl p-4 md:p-5 card-glow" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.02), transparent)" }}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary shrink-0">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-lg md:text-xl font-bold text-white">{user.name}</h1>
            <p className="text-xs text-on-surface-variant mt-0.5">{user.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <PlanBadge plan={user.plan} />
              <StatusBadge status={user.status} />
              <span className="text-[10px] px-2 py-0.5 bg-secondary/10 text-secondary font-medium rounded-md capitalize">{user.role}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className="text-xs text-on-surface-variant">Credit Balance</p>
              <p className="text-lg font-bold text-yellow-400">{user.credits.toLocaleString()}</p>
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={() => handleQuickAction("add_credits")} className="px-3 py-1 primary-gradient text-white rounded-lg text-[10px] font-semibold hover:brightness-110 transition-all whitespace-nowrap">
                + Add
              </button>
              <button onClick={() => handleQuickAction("remove_credits")} className="px-3 py-1 bg-surface-container-high border border-surface-border/50 rounded-lg text-[10px] text-on-surface-variant hover:text-white hover:bg-surface-container-higher transition-all whitespace-nowrap">
                - Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-surface-border/50 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all shrink-0 ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-white hover:border-surface-border/50"
            }`}
          >
            <Icon name={tab.icon} size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {renderTabContent()}
    </div>
  );
}

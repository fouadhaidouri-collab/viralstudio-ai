"use client";

import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";

export default function AdminWithdrawalRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState(null);
  const formatAccount = (acct) => { try { const p = JSON.parse(acct || "{}"); if (p.iban) return p.name + " - " + p.iban; if (p.wallet) return (p.coin||"") + " (" + (p.network||"") + ") - " + p.wallet; return p.email || acct || "-"; } catch { return acct || "-"; } };

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/withdrawal-requests");
      const data = await res.json();
      setRequests(data.requests || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const pending = requests.filter((r) => r.status === "pending");
  const approved = requests.filter((r) => r.status === "approved");
  const rejected = requests.filter((r) => r.status === "rejected");

  const handleApprove = async (id) => {
    if (!confirm("Approve this withdrawal request?")) return;
    await fetch("/api/admin/withdrawal-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "approved" }),
    });
    fetchData();
  };

  const handleReject = async (id) => {
    const note = prompt("Optional rejection note:");
    await fetch("/api/admin/withdrawal-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "rejected", admin_note: note || "" }),
    });
    fetchData();
  };

  const columns = [
    {
      key: "user",
      label: "User",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center text-[10px] font-bold text-secondary shrink-0">
            {row.user_name?.charAt(0) || "?"}
          </div>
          <div>
            <p className="text-xs font-medium text-white">{row.user_name}</p>
            <p className="text-[10px] text-on-surface-variant">{row.user_email}</p>
          </div>
        </div>
      ),
    },
    { key: "user_id", label: "User ID", render: (row) => <span className="text-xs text-on-surface-variant font-mono">{row.user_id}</span> },
    {
      key: "amount",
      label: "Amount",
      render: (row) => <span className="text-xs font-semibold text-white">${row.amount.toFixed(2)}</span>,
    },
    { key: "payment_method", label: "Method", render: (row) => <span className="text-xs text-on-surface-variant">{row.payment_method}</span> },
    {
      key: "payment_account",
      label: "Account",
      render: (row) => <span className="text-xs text-on-surface-variant max-w-[160px] truncate block" title={formatAccount(row.payment_account)}>{formatAccount(row.payment_account)}</span>,
    },
    { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
    {
      key: "created_at",
      label: "Date",
      render: (row) => <span className="text-xs text-on-surface-variant">{new Date(row.created_at).toLocaleDateString()}</span>,
    },
    {
      key: "actions",
      label: "",
      width: "120px",
      render: (row) => row.status === "pending" ? (
        <div className="flex gap-2">
          <button onClick={() => handleApprove(row.id)} className="text-xs font-semibold text-green-400 hover:text-green-300 transition-all">Approve</button>
          <button onClick={() => handleReject(row.id)} className="text-xs font-semibold text-red-400 hover:text-red-300 transition-all">Reject</button>
          <button onClick={() => setDetails(row)} className="text-xs font-semibold text-secondary hover:text-primary transition-all">View</button>
        </div>
      ) : (
        <button onClick={() => setDetails(row)} className="text-xs font-semibold text-secondary hover:text-primary transition-all">View</button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-full bg-background text-white p-6 flex items-center justify-center">
        <p className="text-sm text-on-surface-variant">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background text-white p-6">
      <PageHeader
        title="Withdrawal Requests"
        subtitle="Manage affiliate withdrawal requests"
        breadcrumbs={[{ label: "Admin" }, { label: "Withdrawal Requests" }]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Requests" value={requests.length} icon="payments" color="primary" />
        <StatCard title="Pending" value={pending.length} icon="hourglass" color="yellow" />
        <StatCard title="Approved" value={approved.length} icon="check_circle" color="green" />
        <StatCard title="Rejected" value={rejected.length} icon="cancel" color="red" />
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        {requests.length === 0 ? (
          <EmptyState icon="payments" title="No withdrawal requests" description="Withdrawal requests from affiliates will appear here." />
        ) : (
          <DataTable columns={columns} data={requests.slice().reverse()} />
        )}
      </div>

      {details && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDetails(null)}>
          <div className="bg-surface-container border border-surface-border/80 rounded-2xl max-w-md w-full mx-4 animate-dropdown-open" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 pb-3">
              <h3 className="text-sm font-bold text-white">Withdrawal Details</h3>
              <button onClick={() => setDetails(null)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container-high hover:bg-surface-container-higher transition-all">
                <span className="text-on-surface-variant text-lg leading-none">&times;</span>
              </button>
            </div>
            <div className="px-5 pb-5 space-y-3">
              <div className="flex justify-between"><span className="text-xs text-on-surface-variant">User</span><span className="text-xs text-white font-medium">{details.user_name} ({details.user_id})</span></div>
              <div className="flex justify-between"><span className="text-xs text-on-surface-variant">Email</span><span className="text-xs text-white">{details.user_email}</span></div>
              <div className="flex justify-between"><span className="text-xs text-on-surface-variant">Amount</span><span className="text-xs text-white font-semibold">${details.amount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-xs text-on-surface-variant">Method</span><span className="text-xs text-white">{details.payment_method}</span></div>
              <div className="flex justify-between"><span className="text-xs text-on-surface-variant">Account</span><span className="text-xs text-white break-all max-w-[200px] text-right">{formatAccount(details.payment_account)}</span></div>
              <div className="flex justify-between"><span className="text-xs text-on-surface-variant">Status</span><StatusBadge status={details.status} /></div>
              <div className="flex justify-between"><span className="text-xs text-on-surface-variant">Date</span><span className="text-xs text-white">{new Date(details.created_at).toLocaleString()}</span></div>
              {details.admin_note && <div className="flex justify-between"><span className="text-xs text-on-surface-variant">Admin Note</span><span className="text-xs text-white max-w-[200px] text-right">{details.admin_note}</span></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useMemo, useEffect } from "react";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import SearchInput from "../components/SearchInput";
import EmptyState from "../components/EmptyState";

function toUSD(amount, currency) {
  if (currency === "USD") return amount;
  if (currency === "MAD") return Math.round(amount * 0.1);
  return amount;
}

export default function AdminPaymentLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/payment-logs")
      .then((r) => r.json())
      .then((d) => { setLogs(d.logs || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const total = logs.length;
    const revenue = logs
      .filter((l) => l.status === "completed")
      .reduce((sum, l) => sum + toUSD(l.amount, l.currency), 0);
    const completed = logs.filter((l) => l.status === "completed").length;
    const failed = logs.filter((l) => l.status === "failed").length;
    const refunded = logs.filter((l) => l.status === "refunded").length;
    return { total, revenue, completed, failed, refunded };
  }, [logs]);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return l.user_name.toLowerCase().includes(q) || l.user_email.toLowerCase().includes(q);
    });
  }, [search, logs]);

  const columns = [
    {
      key: "user_id",
      label: "ID User",
      render: (row) => <span className="text-xs font-mono text-primary/80">{row.user_id}</span>,
    },
    {
      key: "user_name",
      label: "Name",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
            {row.user_name.charAt(0)}
          </div>
          <span className="text-xs font-medium text-white">{row.user_name}</span>
        </div>
      ),
    },
    {
      key: "user_email",
      label: "Email",
      render: (row) => <span className="text-xs text-on-surface-variant">{row.user_email}</span>,
    },
    {
      key: "plan_updated",
      label: "Plan",
      render: (row) => <span className="text-xs text-on-surface-variant">{row.plan_updated || "-"}</span>,
    },
    {
      key: "country",
      label: "Country",
      render: (row) => <span className="text-xs text-white">{row.country}</span>,
    },
    {
      key: "credits_added",
      label: "Credits",
      render: (row) => (
        <span className={`text-xs font-semibold ${row.credits_added >= 0 ? "text-green-400" : "text-error"}`}>
          {row.credits_added >= 0 ? `+${row.credits_added}` : row.credits_added}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Payment",
      render: (row) => (
        <span className="text-xs font-semibold text-white">{row.currency === "USD" ? `$${row.amount}` : `${row.amount} ${row.currency}`}</span>
      ),
    },
    {
      key: "created_at",
      label: "Date",
      render: (row) => (
        <span className="text-xs text-on-surface-variant whitespace-nowrap">
          {new Date(row.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-full bg-background text-white p-6">
      <PageHeader
        title="Payment Logs"
        subtitle="Track all payment transactions and events"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Payments" },
          { label: "Logs" },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard title="Total Transactions" value={stats.total} icon="receipt_long" color="primary" />
        <StatCard title="Total Revenue" value={stats.revenue} icon="payments" color="green" prefix="$" />
        <StatCard title="Successful Payments" value={stats.completed} icon="check_circle" color="secondary" />
        <StatCard title="Failed Payments" value={stats.failed} icon="error" color="error" />
        <StatCard title="Refunded Payments" value={stats.refunded} icon="refresh" color="accentOrange" />
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-surface-border/50">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email..." className="w-full sm:w-64" />
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="payments" title="No payment logs found" description="No payment transactions match your search." />
        ) : (
          <DataTable columns={columns} data={filtered} />
        )}
      </div>
    </div>
  );
}

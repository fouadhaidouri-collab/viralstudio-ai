"use client";

import { useState, useMemo } from "react";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import SearchInput from "../components/SearchInput";
import EmptyState from "../components/EmptyState";

const mockPaymentLogs = [
  { id: 'paylog_001', user_id: 'usr_002', user_name: 'Sarah Johnson', user_email: 'sarah@creatorhub.com', amount: 29, currency: 'USD', country: 'Canada', credits_added: 500, plan_updated: null, status: 'completed', created_at: '2026-06-20T10:00:00Z' },
  { id: 'paylog_002', user_id: 'usr_003', user_name: 'Michael Chen', user_email: 'mike@studios.pro', amount: 199, currency: 'USD', country: 'United States', credits_added: 5000, plan_updated: 'Agency', status: 'completed', created_at: '2026-06-19T14:00:00Z' },
  { id: 'paylog_003', user_id: 'usr_004', user_name: 'Emma Williams', user_email: 'emma@viralcontent.com', amount: 29, currency: 'USD', country: 'United Kingdom', credits_added: 0, plan_updated: null, status: 'failed', created_at: '2026-06-18T15:00:00Z' },
  { id: 'paylog_004', user_id: 'usr_010', user_name: 'Nina Kravitz', user_email: 'nina@agencyworld.com', amount: 199, currency: 'USD', country: 'Morocco', credits_added: 20000, plan_updated: 'Agency', status: 'completed', created_at: '2026-06-17T08:00:00Z' },
  { id: 'paylog_005', user_id: 'usr_007', user_name: 'David Thompson', user_email: 'david@marketing.pro', amount: 29, currency: 'USD', country: 'Australia', credits_added: 1000, plan_updated: 'Creator', status: 'completed', created_at: '2026-06-16T12:00:00Z' },
  { id: 'paylog_006', user_id: 'usr_012', user_name: 'Sophie Laurent', user_email: 'sophie@luxebrand.com', amount: 500, currency: 'MAD', country: 'Italy', credits_added: 0, plan_updated: null, status: 'pending', created_at: '2026-06-20T08:00:00Z' },
  { id: 'paylog_007', user_id: 'usr_015', user_name: 'Chris Evans', user_email: 'chris@businesspro.com', amount: 79, currency: 'USD', country: 'United States', credits_added: 5000, plan_updated: 'Pro', status: 'completed', created_at: '2026-06-15T10:00:00Z' },
  { id: 'paylog_008', user_id: 'usr_014', user_name: 'Rachel Green', user_email: 'rachel@influencer.io', amount: 29, currency: 'USD', country: 'Netherlands', credits_added: -1000, plan_updated: null, status: 'refunded', created_at: '2026-06-14T16:00:00Z' },
  { id: 'paylog_009', user_id: 'usr_005', user_name: 'James Rodriguez', user_email: 'james@agency.co', amount: 79, currency: 'USD', country: 'Spain', credits_added: 0, plan_updated: null, status: 'failed', created_at: '2026-05-01T08:00:00Z' },
  { id: 'paylog_010', user_id: 'usr_008', user_name: 'Anna Martinez', user_email: 'anna@socialmedia.com', amount: 300, currency: 'MAD', country: 'France', credits_added: 1200, plan_updated: null, status: 'completed', created_at: '2026-06-13T09:00:00Z' },
];

function toUSD(amount, currency) {
  if (currency === "USD") return amount;
  if (currency === "MAD") return Math.round(amount * 0.1);
  return amount;
}

export default function AdminPaymentLogsPage() {
  const [search, setSearch] = useState("");

  const stats = useMemo(() => {
    const total = mockPaymentLogs.length;
    const revenue = mockPaymentLogs
      .filter((l) => l.status === "completed")
      .reduce((sum, l) => sum + toUSD(l.amount, l.currency), 0);
    const completed = mockPaymentLogs.filter((l) => l.status === "completed").length;
    const failed = mockPaymentLogs.filter((l) => l.status === "failed").length;
    const refunded = mockPaymentLogs.filter((l) => l.status === "refunded").length;
    return { total, revenue, completed, failed, refunded };
  }, []);

  const filtered = useMemo(() => {
    return mockPaymentLogs.filter((l) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return l.user_name.toLowerCase().includes(q) || l.user_email.toLowerCase().includes(q);
    });
  }, [search]);

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
        {filtered.length === 0 ? (
          <EmptyState icon="payments" title="No payment logs found" description="No payment transactions match your search." />
        ) : (
          <DataTable columns={columns} data={filtered} />
        )}
      </div>
    </div>
  );
}

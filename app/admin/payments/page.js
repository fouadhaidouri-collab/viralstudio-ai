"use client";

import { useState, useMemo } from "react";
import { mockPayments } from "../data/mockPayments";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import SearchInput from "../components/SearchInput";
import FilterSelect from "../components/FilterSelect";
import ActionMenu from "../components/ActionMenu";
import ConfirmModal from "../components/ConfirmModal";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import Icon from "../../components/Icon";

const providerConfig = {
  stripe: { label: "Stripe", bg: "bg-purple-500/15", text: "text-purple-400", dot: "bg-purple-400" },
  paypal: { label: "PayPal", bg: "bg-blue-500/15", text: "text-blue-400", dot: "bg-blue-400" },
  manual: { label: "Manual", bg: "bg-gray-500/15", text: "text-gray-400", dot: "bg-gray-400" },
};

function ProviderBadge({ provider }) {
  const cfg = providerConfig[provider] || providerConfig.manual;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium rounded-md ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState(mockPayments);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [viewPayment, setViewPayment] = useState(null);
  const [refundPaymentId, setRefundPaymentId] = useState(null);

  const stats = useMemo(() => {
    const totalRevenue = payments.reduce((s, p) => s + (p.status === "paid" ? p.amount : 0), 0);
    const now = new Date();
    const monthlyRevenue = payments.filter((p) => {
      const d = new Date(p.created_at);
      return p.status === "paid" && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((s, p) => s + p.amount, 0);
    const totalTransactions = payments.length;
    const pendingPayments = payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
    return { totalRevenue, monthlyRevenue, totalTransactions, pendingPayments };
  }, [payments]);

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const matchesSearch = !search || p.user_name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !statusFilter || p.status === statusFilter;
      const matchesProvider = !providerFilter || p.provider === providerFilter;
      return matchesSearch && matchesStatus && matchesProvider;
    });
  }, [payments, search, statusFilter, providerFilter]);

  const handleRefund = () => {
    setPayments((prev) =>
      prev.map((p) => p.id === refundPaymentId ? { ...p, status: "refunded" } : p)
    );
    setRefundPaymentId(null);
  };

  const handleMarkPaid = (id) => {
    setPayments((prev) =>
      prev.map((p) => p.id === id ? { ...p, status: "paid" } : p)
    );
  };

  const handleExportCSV = () => {
    const headers = ["ID", "User", "Plan", "Amount", "Currency", "Provider", "Status", "Invoice Link", "Date"];
    const rows = filtered.map((p) => [p.id, p.user_name, p.plan, p.amount, p.currency, p.provider, p.status, p.invoice_link || "", p.created_at]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payments.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      key: "user",
      label: "User",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
            {row.user_name?.charAt(0) || "?"}
          </div>
          <div>
            <p className="text-xs font-medium text-white">{row.user_name}</p>
            <p className="text-[10px] text-on-surface-variant">{row.id}</p>
          </div>
        </div>
      ),
    },
    { key: "plan", label: "Plan", render: (row) => <span className="text-xs font-medium text-white">{row.plan}</span> },
    {
      key: "amount",
      label: "Amount",
      align: "right",
      render: (row) => <span className="text-xs font-semibold text-white">${row.amount.toLocaleString()} <span className="text-[10px] text-on-surface-variant font-normal">{row.currency}</span></span>,
    },
    { key: "provider", label: "Provider", render: (row) => <ProviderBadge provider={row.provider} /> },
    { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
    {
      key: "invoice",
      label: "Invoice",
      render: (row) =>
        row.invoice_link ? (
          <a
            href={row.invoice_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-secondary hover:text-secondary/80 transition-colors"
          >
            <Icon name="description" size={12} />
            View
          </a>
        ) : (
          <span className="text-xs text-on-surface-variant/50">-</span>
        ),
    },
    {
      key: "date",
      label: "Date",
      render: (row) => (
        <span className="text-[10px] text-on-surface-variant whitespace-nowrap" title={new Date(row.created_at).toLocaleString()}>
          {formatDate(row.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      width: "40px",
      render: (row) => (
        <ActionMenu
          items={[
            { label: "View Payment", icon: "visibility", onClick: () => setViewPayment(row) },
            ...(row.status === "pending" ? [{ label: "Mark as Paid", icon: "check_circle", variant: "success", onClick: () => handleMarkPaid(row.id) }] : []),
            ...(row.status === "paid" ? [{ label: "Refund", icon: "refresh", onClick: () => setRefundPaymentId(row.id) }] : []),
            { label: "Change User Plan", icon: "swap_horiz", onClick: () => alert(`Change plan for ${row.user_name} (placeholder)`) },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="min-h-full bg-background text-white p-6">
      <PageHeader
        title="Payments"
        subtitle="Track and manage payments"
        breadcrumbs={[{ label: "Admin" }, { label: "Payments" }]}
        actions={[
          { label: "Export CSV", icon: "download", onClick: handleExportCSV },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Revenue" value={stats.totalRevenue} icon="payments" color="primary" prefix="$" />
        <StatCard title="Monthly Revenue" value={stats.monthlyRevenue} icon="trending_up" color="secondary" prefix="$" />
        <StatCard title="Total Transactions" value={stats.totalTransactions} icon="receipt_long" color="green" />
        <StatCard title="Pending Payments" value={stats.pendingPayments} icon="hourglass_top" color="yellow" prefix="$" />
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-surface-border/50 flex flex-col sm:flex-row gap-3 flex-wrap">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by user name..." className="flex-1 min-w-[200px]" />
          <FilterSelect
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All Statuses"
            options={[
              { value: "paid", label: "Paid" },
              { value: "pending", label: "Pending" },
              { value: "failed", label: "Failed" },
              { value: "refunded", label: "Refunded" },
            ]}
          />
          <FilterSelect
            value={providerFilter}
            onChange={setProviderFilter}
            placeholder="All Providers"
            options={[
              { value: "stripe", label: "Stripe" },
              { value: "paypal", label: "PayPal" },
              { value: "manual", label: "Manual" },
            ]}
          />
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon="payments" title="No payments found" description="No payments match your current filters." />
        ) : (
          <DataTable columns={columns} data={filtered} />
        )}
      </div>

      {viewPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setViewPayment(null)}>
          <div className="bg-surface-container border border-surface-border/80 rounded-2xl max-w-lg w-full mx-4 animate-dropdown-open" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 pb-3">
              <h3 className="text-sm font-bold text-white">Payment Details</h3>
              <button onClick={() => setViewPayment(null)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container-high hover:bg-surface-container-higher transition-all">
                <Icon name="close" className="text-on-surface-variant" size={14} />
              </button>
            </div>
            <div className="px-5 pb-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-medium text-on-surface-variant mb-1">Payment ID</p>
                <p className="text-xs font-medium text-white">{viewPayment.id}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-on-surface-variant mb-1">User</p>
                <p className="text-xs font-medium text-white">{viewPayment.user_name}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-on-surface-variant mb-1">Plan</p>
                <p className="text-xs font-medium text-white">{viewPayment.plan}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-on-surface-variant mb-1">Amount</p>
                <p className="text-xs font-semibold text-white">${viewPayment.amount.toLocaleString()} {viewPayment.currency}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-on-surface-variant mb-1">Provider</p>
                <ProviderBadge provider={viewPayment.provider} />
              </div>
              <div>
                <p className="text-[10px] font-medium text-on-surface-variant mb-1">Status</p>
                <StatusBadge status={viewPayment.status} />
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-medium text-on-surface-variant mb-1">Date</p>
                <p className="text-xs text-white">{new Date(viewPayment.created_at).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
              </div>
              {viewPayment.invoice_link && (
                <div className="col-span-2">
                  <p className="text-[10px] font-medium text-on-surface-variant mb-1">Invoice</p>
                  <a href={viewPayment.invoice_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-secondary hover:text-secondary/80 transition-colors">
                    <Icon name="description" size={12} />
                    View Invoice
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!refundPaymentId}
        onClose={() => setRefundPaymentId(null)}
        onConfirm={handleRefund}
        title="Refund Payment"
        message="Are you sure you want to refund this payment? This action will mark the payment as refunded."
        confirmLabel="Refund"
        confirmVariant="primary"
      />
    </div>
  );
}

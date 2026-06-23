"use client";

import { useState, useMemo } from "react";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import SearchInput from "../components/SearchInput";
import FilterSelect from "../components/FilterSelect";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import Icon from "../../components/Icon";

const mockPaymentLogs = [
  { id: 'paylog_001', user_email: 'sarah@creatorhub.com', provider: 'stripe', amount: 29, currency: 'USD', country: 'United States', status: 'completed', event_type: 'checkout.session.completed', credits_added: 500, plan_updated: null, raw_event: '{"id":"evt_001","type":"checkout.session.completed","data":{"object":{"amount_total":2900,"currency":"usd"}}}', created_at: '2026-06-20T10:00:00Z' },
  { id: 'paylog_002', user_email: 'mike@studios.pro', provider: 'paypal', amount: 199, currency: 'USD', country: 'United States', status: 'completed', event_type: 'PAYMENT.CAPTURE.COMPLETED', credits_added: 5000, plan_updated: 'Agency', raw_event: '{"id":"evt_002","event_type":"PAYMENT.CAPTURE.COMPLETED"}', created_at: '2026-06-19T14:00:00Z' },
  { id: 'paylog_003', user_email: 'emma@viralcontent.com', provider: 'stripe', amount: 29, currency: 'USD', country: 'Canada', status: 'failed', event_type: 'checkout.session.expired', credits_added: 0, plan_updated: null, raw_event: '{"id":"evt_003","type":"checkout.session.expired"}', created_at: '2026-06-18T15:00:00Z' },
  { id: 'paylog_004', user_email: 'nina@agencyworld.com', provider: 'stripe', amount: 199, currency: 'USD', country: 'United States', status: 'completed', event_type: 'invoice.paid', credits_added: 20000, plan_updated: 'Agency', raw_event: '{"id":"evt_004","type":"invoice.paid"}', created_at: '2026-06-17T08:00:00Z' },
  { id: 'paylog_005', user_email: 'david@marketing.pro', provider: 'paypal', amount: 29, currency: 'USD', country: 'United Kingdom', status: 'completed', event_type: 'PAYMENT.CAPTURE.COMPLETED', credits_added: 1000, plan_updated: 'Creator', raw_event: '{"id":"evt_005","event_type":"PAYMENT.CAPTURE.COMPLETED"}', created_at: '2026-06-16T12:00:00Z' },
  { id: 'paylog_006', user_email: 'sophie@luxebrand.com', provider: 'youcanpay', amount: 500, currency: 'MAD', country: 'Morocco', status: 'pending', event_type: 'checkout.created', credits_added: 0, plan_updated: null, raw_event: '{"id":"evt_006","type":"checkout.created"}', created_at: '2026-06-20T08:00:00Z' },
  { id: 'paylog_007', user_email: 'chris@businesspro.com', provider: 'stripe', amount: 79, currency: 'USD', country: 'Australia', status: 'completed', event_type: 'checkout.session.completed', credits_added: 5000, plan_updated: 'Pro', raw_event: '{"id":"evt_007","type":"checkout.session.completed"}', created_at: '2026-06-15T10:00:00Z' },
  { id: 'paylog_008', user_email: 'rachel@influencer.io', provider: 'paypal', amount: 29, currency: 'USD', country: 'United States', status: 'refunded', event_type: 'PAYMENT.CAPTURE.REFUNDED', credits_added: -1000, plan_updated: null, raw_event: '{"id":"evt_008","event_type":"PAYMENT.CAPTURE.REFUNDED"}', created_at: '2026-06-14T16:00:00Z' },
  { id: 'paylog_009', user_email: 'james@agency.co', provider: 'stripe', amount: 79, currency: 'USD', country: 'France', status: 'failed', event_type: 'payment_intent.payment_failed', credits_added: 0, plan_updated: null, raw_event: '{"id":"evt_009","type":"payment_intent.payment_failed","data":{"object":{"failure_message":"card_declined"}}}', created_at: '2026-05-01T08:00:00Z' },
  { id: 'paylog_010', user_email: 'anna@socialmedia.com', provider: 'youcanstore', amount: 300, currency: 'MAD', country: 'Morocco', status: 'completed', event_type: 'order.paid', credits_added: 1200, plan_updated: null, raw_event: '{"id":"evt_010","type":"order.paid","data":{"order_id":"ORD-001"}}', created_at: '2026-06-13T09:00:00Z' },
];

const providerIcons = {
  stripe: "credit_card",
  paypal: "currency_bitcoin",
  youcanpay: "globe",
  youcanstore: "store",
};

function formatCurrency(amount, currency) {
  if (currency === "USD") return `$${amount}`;
  if (currency === "MAD") return `${amount} MAD`;
  return `${amount} ${currency}`;
}

function toUSD(amount, currency) {
  if (currency === "USD") return amount;
  if (currency === "MAD") return Math.round(amount * 0.1);
  return amount;
}

function isWithinDateRange(dateStr, range) {
  if (range === "all" || !range) return true;
  const date = new Date(dateStr);
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === "today") return date >= startOfDay;
  if (range === "week") return date >= new Date(startOfDay.getTime() - 7 * 86400000);
  if (range === "month") return date >= new Date(startOfDay.getTime() - 30 * 86400000);
  return true;
}

export default function AdminPaymentLogsPage() {
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const stats = useMemo(() => {
    const total = mockPaymentLogs.length;
    const revenue = mockPaymentLogs
      .filter((l) => l.status === "completed")
      .reduce((sum, l) => sum + toUSD(l.amount, l.currency), 0);
    const successful = mockPaymentLogs.filter((l) => l.status === "completed").length;
    const failed = mockPaymentLogs.filter((l) => l.status === "failed").length;
    return { total, revenue, successful, failed };
  }, []);

  const filtered = useMemo(() => {
    return mockPaymentLogs.filter((l) => {
      const matchesSearch = !search || l.user_email.toLowerCase().includes(search.toLowerCase());
      const matchesProvider = !providerFilter || l.provider === providerFilter;
      const matchesStatus = !statusFilter || l.status === statusFilter;
      const matchesDate = isWithinDateRange(l.created_at, dateFilter);
      return matchesSearch && matchesProvider && matchesStatus && matchesDate;
    });
  }, [search, providerFilter, statusFilter, dateFilter]);

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  const DetailModal = ({ log, onClose }) => {
    if (!log) return null;
    let parsedEvent = null;
    try { parsedEvent = JSON.parse(log.raw_event); } catch {}
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-surface-container border border-surface-border/80 rounded-2xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto animate-dropdown-open" onClick={(e) => e.stopPropagation()}>
          <div className="p-5 border-b border-surface-border/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Payment Details</h3>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container-high border border-surface-border/50 hover:bg-surface-container-higher transition-all">
              <Icon name="close" className="text-on-surface-variant" size={14} />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-medium text-on-surface-variant mb-1">Payment ID</p>
                <p className="text-xs text-white font-mono">{log.id}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-on-surface-variant mb-1">User Email</p>
                <p className="text-xs text-white">{log.user_email}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-on-surface-variant mb-1">Provider</p>
                <div className="flex items-center gap-1.5">
                  <Icon name={providerIcons[log.provider] || "payments"} size={14} className="text-on-surface-variant" />
                  <p className="text-xs text-white capitalize">{log.provider}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-medium text-on-surface-variant mb-1">Amount</p>
                <p className="text-xs text-white font-semibold">{formatCurrency(log.amount, log.currency)}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-on-surface-variant mb-1">Country</p>
                <p className="text-xs text-white">{log.country}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-on-surface-variant mb-1">Status</p>
                <StatusBadge status={log.status} />
              </div>
              <div>
                <p className="text-[10px] font-medium text-on-surface-variant mb-1">Credits Added</p>
                <p className={`text-xs font-semibold ${log.credits_added >= 0 ? "text-green-400" : "text-error"}`}>
                  {log.credits_added >= 0 ? `+${log.credits_added}` : log.credits_added}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-on-surface-variant mb-1">Event Type</p>
                <p className="text-xs text-white font-mono">{log.event_type}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-on-surface-variant mb-1">Plan Updated</p>
                <p className="text-xs text-white">{log.plan_updated || "-"}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-on-surface-variant mb-1">Created Date</p>
                <p className="text-xs text-white">{new Date(log.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-medium text-on-surface-variant">Raw Event JSON</p>
                <button
                  onClick={() => copyToClipboard(log.raw_event, `detail_${log.id}`)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-container-high border border-surface-border/50 text-[10px] font-medium text-on-surface-variant hover:text-white hover:bg-surface-container-higher transition-all"
                >
                  <Icon name={copiedId === `detail_${log.id}` ? "check" : "copy"} size={12} />
                  {copiedId === `detail_${log.id}` ? "Copied!" : "Copy Event"}
                </button>
              </div>
              <pre className="bg-[#050505] border border-surface-border/50 rounded-xl p-4 text-[11px] font-mono text-green-400/90 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(parsedEvent, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const columns = [
    {
      key: "id",
      label: "Payment ID",
      render: (row) => <span className="text-xs font-mono text-primary/80">{row.id}</span>,
    },
    {
      key: "user_email",
      label: "User Email",
      render: (row) => <span className="text-xs text-white">{row.user_email}</span>,
    },
    {
      key: "provider",
      label: "Provider",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Icon name={providerIcons[row.provider] || "payments"} size={14} className="text-on-surface-variant" />
          <span className="text-xs text-white capitalize">{row.provider}</span>
        </div>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (row) => <span className="text-xs font-semibold text-white">{formatCurrency(row.amount, row.currency)}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "country",
      label: "Country",
      render: (row) => <span className="text-xs text-white">{row.country}</span>,
    },
    {
      key: "event_type",
      label: "Event Type",
      render: (row) => <span className="text-[10px] font-mono text-on-surface-variant">{row.event_type}</span>,
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
      key: "plan_updated",
      label: "Plan",
      render: (row) => (
        <span className="text-xs text-on-surface-variant">{row.plan_updated || "-"}</span>
      ),
    },
    {
      key: "raw_event",
      label: "Raw Event",
      render: (row) => {
        const preview = row.raw_event.length > 40 ? row.raw_event.substring(0, 40) + "..." : row.raw_event;
        return <span className="text-[10px] font-mono text-on-surface-variant/60 truncate max-w-[140px] block">{preview}</span>;
      },
    },
    {
      key: "created_at",
      label: "Date",
      render: (row) => (
        <span className="text-[10px] text-on-surface-variant whitespace-nowrap">
          {new Date(row.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      width: "40px",
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedLog(row); }}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container-high border border-surface-border/50 hover:bg-surface-container-higher transition-all"
            title="View Details"
          >
            <Icon name="visibility" className="text-on-surface-variant" size={13} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); copyToClipboard(row.raw_event, `copy_${row.id}`); }}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container-high border border-surface-border/50 hover:bg-surface-container-higher transition-all"
            title="Copy Event"
          >
            <Icon name={copiedId === `copy_${row.id}` ? "check" : "copy"} className={`${copiedId === `copy_${row.id}` ? "text-green-400" : "text-on-surface-variant"}`} size={13} />
          </button>
          {row.status === "completed" && (
            <button
              onClick={(e) => { e.stopPropagation(); alert(`Refund initiated for ${row.id}`); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container-high border border-surface-border/50 hover:bg-error/10 hover:border-error/30 transition-all"
              title="Refund"
            >
              <Icon name="refresh" className="text-on-surface-variant" size={13} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background text-white p-6">
      <PageHeader
        title="Payment Logs"
        subtitle="Track all payment transactions and events"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Payments" },
          { label: "Logs" },
        ]}
        actions={[
          { label: "Export CSV", icon: "download", variant: "primary", onClick: () => {} },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Transactions" value={stats.total} icon="receipt_long" color="primary" />
        <StatCard title="Total Revenue" value={stats.revenue} icon="payments" color="green" prefix="$" />
        <StatCard title="Successful Payments" value={stats.successful} icon="check_circle" color="secondary" />
        <StatCard title="Failed Payments" value={stats.failed} icon="error" color="error" />
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-surface-border/50 flex flex-col sm:flex-row gap-3 flex-wrap">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by email..." className="flex-1 min-w-[180px]" />
          <FilterSelect
            value={providerFilter}
            onChange={setProviderFilter}
            placeholder="All Providers"
            options={[
              { value: "stripe", label: "Stripe" },
              { value: "paypal", label: "PayPal" },
              { value: "youcanpay", label: "YouCanPay" },
              { value: "youcanstore", label: "YouCanStore" },
            ]}
          />
          <FilterSelect
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All Statuses"
            options={[
              { value: "completed", label: "Completed" },
              { value: "failed", label: "Failed" },
              { value: "pending", label: "Pending" },
              { value: "refunded", label: "Refunded" },
            ]}
          />
          <FilterSelect
            value={dateFilter}
            onChange={setDateFilter}
            placeholder="All Time"
            options={[
              { value: "today", label: "Today" },
              { value: "week", label: "This Week" },
              { value: "month", label: "This Month" },
            ]}
          />
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon="payments" title="No payment logs found" description="No payment transactions match your current filters." />
        ) : (
          <DataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedLog(row)} />
        )}
      </div>

      <DetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}

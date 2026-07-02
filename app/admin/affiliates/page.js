"use client";

import { useState, useMemo, useEffect } from "react";
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

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [profitFilter, setProfitFilter] = useState("all");
  const [disableAffiliateId, setDisableAffiliateId] = useState(null);
  const [commissionAffiliate, setCommissionAffiliate] = useState(null);
  const [commissionRate, setCommissionRate] = useState(15);
  const [copiedId, setCopiedId] = useState(null);
  const [withdrawTab, setWithdrawTab] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/affiliates-list");
      const data = await res.json();
      setAffiliates(data.affiliates || []);
      setWithdrawals(data.withdrawals || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const stats = useMemo(() => {
    const total = affiliates.length;
    const active = affiliates.filter((a) => a.status === "active").length;
    const totalClicks = affiliates.reduce((s, a) => s + (a.total_clicks || 0), 0);
    const totalRevenue = affiliates.reduce((s, a) => s + (a.total_earnings || 0), 0);
    return { total, active, totalClicks, totalRevenue };
  }, [affiliates]);

  const filtered = useMemo(() => {
    return affiliates.filter((a) => {
      const q = search.toLowerCase();
      const matchesSearch = !search || a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q) || a.code?.toLowerCase().includes(q) || a.id?.toLowerCase().includes(q);
      const matchesStatus = !statusFilter || a.status === statusFilter;
      const matchesProfit = profitFilter === "all" || (profitFilter === "profit" && (a.total_earnings || 0) > 0) || (profitFilter === "active" && a.status === "active");
      return matchesSearch && matchesStatus && matchesProfit;
    });
  }, [affiliates, search, statusFilter, profitFilter]);

  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending");

  const handleDisable = async () => {
    await fetch("/api/admin/affiliates-update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "affiliate", id: disableAffiliateId, status: "inactive" }),
    });
    setDisableAffiliateId(null);
    fetchData();
  };

  const handleApprove = async (id) => {
    await fetch("/api/admin/affiliates-update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "affiliate", id, status: "active" }),
    });
    fetchData();
  };

  const handleUpdateCommission = async () => {
    if (!commissionAffiliate) return;
    await fetch("/api/admin/affiliates-update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "affiliate", id: commissionAffiliate.id, commission_rate: commissionRate }),
    });
    setCommissionAffiliate(null);
    fetchData();
  };

  const handleWithdrawApprove = async (id) => {
    await fetch("/api/admin/affiliates-update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "withdrawal", id, status: "completed" }),
    });
    fetchData();
  };

  const handleCopyLink = async (affiliate) => {
    try {
      await navigator.clipboard.writeText(affiliate.link);
      setCopiedId(affiliate.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = affiliate.link;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedId(affiliate.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleExportReport = () => {
    const headers = ["Name", "Email", "Code", "Link", "Clicks", "Signups", "Paid Users", "Revenue", "Earnings", "Commission Rate", "Status"];
    const rows = filtered.map((a) => [a.name, a.email, a.code, a.link, a.total_clicks, a.total_signups, a.total_paid_customers, a.total_earnings, a.total_earnings, `${a.commission_rate}%`, a.status]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "affiliates-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      key: "name",
      label: "Affiliate Name",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center text-[10px] font-bold text-secondary shrink-0">
            {row.name?.charAt(0) || "?"}
          </div>
          <div>
            <p className="text-xs font-medium text-white">{row.name}</p>
          </div>
        </div>
      ),
    },
    { key: "id", label: "ID", render: (row) => <span className="text-xs text-on-surface-variant font-mono">{row.id}</span> },
    { key: "email", label: "Email", render: (row) => <span className="text-xs text-on-surface-variant">{row.email}</span> },
    {
      key: "code",
      label: "Code",
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 bg-surface-container-high border border-surface-border/50 rounded text-[11px] font-mono font-semibold text-secondary tracking-wide">
          {row.code}
        </span>
      ),
    },
    {
      key: "clicks",
      label: "Clicks",
      align: "right",
      render: (row) => <span className="text-xs font-medium text-white">{(row.total_clicks || 0).toLocaleString()}</span>,
    },
    {
      key: "signups",
      label: "Signups",
      align: "right",
      render: (row) => <span className="text-xs font-medium text-white">{(row.total_signups || 0).toLocaleString()}</span>,
    },
    {
      key: "paid_users",
      label: "Paid Users",
      align: "right",
      render: (row) => <span className="text-xs font-medium text-white">{(row.total_paid_customers || 0).toLocaleString()}</span>,
    },
    {
      key: "earnings",
      label: "Earnings",
      align: "right",
      render: (row) => <span className="text-xs font-semibold text-white">${(row.total_earnings || 0).toFixed(2)}</span>,
    },
    {
      key: "commission_rate",
      label: "Commission Rate",
      align: "right",
      render: (row) => <span className="text-xs text-on-surface-variant">{row.commission_rate}%</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      label: "",
      width: "40px",
      render: (row) => (
        <ActionMenu
          items={[
            ...(row.status === "pending" ? [{ label: "Approve", icon: "check_circle", variant: "success", onClick: () => handleApprove(row.id) }] : []),
            ...(row.status === "active" ? [{ label: "Disable", icon: "block", variant: "danger", onClick: () => setDisableAffiliateId(row.id) }] : []),
            { label: "Change Commission Rate", icon: "percent", onClick: () => { setCommissionAffiliate(row); setCommissionRate(row.commission_rate); } },
            { label: "Copy Affiliate Link", icon: "content_copy", onClick: () => handleCopyLink(row) },
          ]}
        />
      ),
    },
  ];

  const wdColumns = [
    { key: "affiliate_code", label: "Affiliate Code", render: (row) => <span className="text-xs font-mono text-secondary font-semibold">{row.affiliate_code}</span> },
    { key: "amount", label: "Amount", render: (row) => <span className="text-xs font-semibold text-white">${row.amount.toFixed(2)}</span> },
    { key: "method", label: "Method", render: (row) => <span className="text-xs text-on-surface-variant">{row.method}</span> },
    { key: "account_details", label: "Payment Details", render: (row) => <span className="text-xs text-on-surface-variant max-w-[180px] truncate block" title={row.account_details}>{row.account_details || "-"}</span> },
    { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
    {
      key: "created_at",
      label: "Date",
      render: (row) => <span className="text-xs text-on-surface-variant">{new Date(row.created_at).toLocaleDateString()}</span>,
    },
    {
      key: "actions",
      label: "",
      width: "60px",
      render: (row) => row.status === "pending" ? (
        <button
          onClick={() => handleWithdrawApprove(row.id)}
          className="text-xs font-semibold text-green-400 hover:text-green-300 transition-all"
        >
          Approve
        </button>
      ) : null,
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
        title={withdrawTab ? "Withdrawals" : "Affiliates"}
        subtitle={withdrawTab ? "Manage withdrawal requests" : "Manage influencer and affiliate partners"}
        breadcrumbs={[{ label: "Admin" }, { label: withdrawTab ? "Withdrawals" : "Affiliates" }]}
        actions={[
          ...(!withdrawTab ? [{ label: "Export Report", icon: "download", onClick: handleExportReport }] : []),
          { label: withdrawTab ? "Affiliates" : "Withdrawals", icon: withdrawTab ? "people" : "payments", onClick: () => setWithdrawTab(!withdrawTab) },
        ]}
      />

      {!withdrawTab ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard title="Total Affiliates" value={stats.total} icon="people" color="primary" />
            <StatCard title="Active Affiliates" value={stats.active} icon="verified" color="green" />
            <StatCard title="Total Clicks" value={stats.totalClicks} icon="ads_click" color="secondary" />
            <StatCard title="Total Earnings" value={stats.totalRevenue} icon="payments" color="primary" prefix="$" />
          </div>

          <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-4 border-b border-surface-border/50 flex flex-col sm:flex-row gap-3 flex-wrap">
              <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email, code, or ID..." className="flex-1 min-w-[200px]" />
              <FilterSelect
                value={profitFilter}
                onChange={setProfitFilter}
                placeholder="All"
                options={[
                  { value: "all", label: "All" },
                  { value: "profit", label: "Brought Profit" },
                  { value: "active", label: "Active" },
                ]}
              />
              <FilterSelect
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="All Statuses"
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                  { value: "pending", label: "Pending" },
                ]}
              />
            </div>
            {filtered.length === 0 ? (
              <EmptyState icon="people" title="No affiliates found" description="No affiliates match your current filters." />
            ) : (
              <DataTable columns={columns} data={filtered} />
            )}
          </div>

          <ConfirmModal
            open={!!disableAffiliateId}
            onClose={() => setDisableAffiliateId(null)}
            onConfirm={handleDisable}
            title="Disable Affiliate"
            message="Are you sure you want to disable this affiliate? They will no longer be able to generate referrals."
            confirmLabel="Disable"
            confirmVariant="danger"
          />

          {commissionAffiliate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setCommissionAffiliate(null)}>
              <div className="bg-surface-container border border-surface-border/80 rounded-2xl max-w-sm w-full mx-4 animate-dropdown-open" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 pb-3">
                  <h3 className="text-sm font-bold text-white">Commission Rate</h3>
                  <button onClick={() => setCommissionAffiliate(null)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container-high hover:bg-surface-container-higher transition-all">
                    <Icon name="close" className="text-on-surface-variant" size={14} />
                  </button>
                </div>
                <div className="px-5 pb-5">
                  <p className="text-xs text-on-surface-variant mb-4">
                    Set commission rate for <span className="text-white font-medium">{commissionAffiliate.name}</span>
                  </p>
                  <div className="flex items-center gap-3 mb-4">
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(parseInt(e.target.value))}
                      className="flex-1 h-1.5 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-purple-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-purple-500/40"
                    />
                    <div className="glass-card rounded-lg px-3 py-2 min-w-[60px] text-center">
                      <span className="text-sm font-bold text-white">{commissionRate}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-on-surface-variant mb-4">
                    <span>1%</span>
                    <span>50%</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setCommissionAffiliate(null)} className="flex-1 px-3 py-2 bg-surface-container-high border border-surface-border rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container-higher transition-all">
                      Cancel
                    </button>
                    <button onClick={handleUpdateCommission} className="flex-1 px-3 py-2 primary-gradient text-white rounded-lg text-xs font-semibold hover:brightness-110 transition-all">
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCard title="Total Withdrawals" value={withdrawals.length} icon="payments" color="primary" />
            <StatCard title="Pending" value={pendingWithdrawals.length} icon="hourglass" color="yellow" />
            <StatCard title="Completed" value={withdrawals.filter((w) => w.status === "completed").length} icon="check_circle" color="green" />
          </div>

          <div className="glass-card rounded-xl overflow-hidden">
            {withdrawals.length === 0 ? (
              <EmptyState icon="payments" title="No withdrawals yet" description="Affiliate withdrawal requests will appear here." />
            ) : (
              <DataTable columns={wdColumns} data={withdrawals.slice().reverse()} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

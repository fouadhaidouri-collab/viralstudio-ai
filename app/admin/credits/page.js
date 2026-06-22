"use client";

import { useState, useMemo } from "react";
import { mockUsers, mockCreditTransactions } from "../data/mockUsers";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import SearchInput from "../components/SearchInput";
import FilterSelect from "../components/FilterSelect";
import CreditBadge from "../components/CreditBadge";
import ActionMenu from "../components/ActionMenu";
import ConfirmModal from "../components/ConfirmModal";
import EmptyState from "../components/EmptyState";
import Icon from "../../components/Icon";

const typeConfig = {
  purchase: { label: "Purchase", color: "success" },
  usage: { label: "Usage", color: "info" },
  refund: { label: "Refund", color: "accentOrange" },
  manual_add: { label: "Manual Add", color: "green" },
  manual_remove: { label: "Manual Remove", color: "error" },
};

export default function AdminCreditsPage() {
  const [transactions, setTransactions] = useState(mockCreditTransactions);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [addForm, setAddForm] = useState({ userId: "", amount: "" });
  const [removeForm, setRemoveForm] = useState({ userId: "", amount: "" });
  const [refundTxId, setRefundTxId] = useState(null);

  const getUser = (userId) => mockUsers.find((u) => u.id === userId);

  const stats = useMemo(() => {
    const sold = transactions.filter((t) => t.type === "purchase").reduce((s, t) => s + t.amount, 0);
    const used = transactions.filter((t) => t.type === "usage").reduce((s, t) => s + Math.abs(t.amount), 0);
    const manual = transactions.filter((t) => t.type === "manual_add").reduce((s, t) => s + t.amount, 0);
    const refunded = transactions.filter((t) => t.type === "refund").reduce((s, t) => s + t.amount, 0);
    return { sold, used, manual, refunded };
  }, [transactions]);

  const topUsers = useMemo(() => {
    return [...mockUsers].sort((a, b) => b.credits - a.credits).slice(0, 5);
  }, []);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const user = getUser(t.user_id);
      const nameMatch = user?.name?.toLowerCase().includes(search.toLowerCase());
      const emailMatch = user?.email?.toLowerCase().includes(search.toLowerCase());
      const matchesSearch = !search || nameMatch || emailMatch;
      const matchesType = !typeFilter || t.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [transactions, search, typeFilter]);

  const handleAddCredits = () => {
    if (!addForm.userId || !addForm.amount) return;
    const amount = parseInt(addForm.amount);
    if (!amount || amount <= 0) return;
    setTransactions((prev) => [{
      id: `ct_manual_${Date.now()}`,
      user_id: addForm.userId,
      type: "manual_add",
      tool: null,
      model: null,
      amount,
      reason: "Manual addition by admin",
      created_at: new Date().toISOString(),
    }, ...prev]);
    setShowAddModal(false);
    setAddForm({ userId: "", amount: "" });
  };

  const handleRemoveCredits = () => {
    if (!removeForm.userId || !removeForm.amount) return;
    const amount = parseInt(removeForm.amount);
    if (!amount || amount <= 0) return;
    setTransactions((prev) => [{
      id: `ct_manual_remove_${Date.now()}`,
      user_id: removeForm.userId,
      type: "manual_remove",
      tool: null,
      model: null,
      amount: -amount,
      reason: "Manual removal by admin",
      created_at: new Date().toISOString(),
    }, ...prev]);
    setShowRemoveModal(false);
    setRemoveForm({ userId: "", amount: "" });
  };

  const handleRefund = () => {
    setTransactions((prev) =>
      prev.map((t) => t.id === refundTxId ? { ...t, type: "refund", amount: Math.abs(t.amount), reason: "Refunded" } : t)
    );
    setRefundTxId(null);
  };

  const handleExportCSV = () => {
    const headers = ["User", "Type", "Tool", "Model", "Amount", "Reason", "Date"];
    const rows = filtered.map((t) => {
      const user = getUser(t.user_id);
      return [user?.name || "Unknown", t.type, t.tool || "", t.model || "", t.amount, t.reason, t.created_at];
    });
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "credit-transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      key: "user",
      label: "User",
      render: (row) => {
        const user = getUser(row.user_id);
        return (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
              {user?.name?.charAt(0) || "?"}
            </div>
            <div>
              <p className="text-xs font-medium text-white">{user?.name || "Unknown"}</p>
              <p className="text-[10px] text-on-surface-variant">{user?.email || ""}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "type",
      label: "Transaction Type",
      render: (row) => {
        const cfg = typeConfig[row.type] || { label: row.type, color: "info" };
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium rounded-md ${
            cfg.color === "success" ? "bg-green-500/15 text-green-400" :
            cfg.color === "info" ? "bg-secondary/15 text-secondary" :
            cfg.color === "accentOrange" ? "bg-accent-orange/15 text-accent-orange" :
            cfg.color === "green" ? "bg-green-500/15 text-green-400" :
            "bg-error/15 text-error"
          }`}>
            {cfg.label}
          </span>
        );
      },
    },
    { key: "tool", label: "Tool", render: (row) => <span className="text-xs text-on-surface-variant">{row.tool || "-"}</span> },
    { key: "model", label: "Model", render: (row) => <span className="text-xs text-on-surface-variant">{row.model || "-"}</span> },
    { key: "amount", label: "Amount", align: "right", render: (row) => <CreditBadge amount={row.amount} /> },
    { key: "reason", label: "Reason", render: (row) => <span className="text-xs text-on-surface-variant max-w-[140px] truncate block">{row.reason}</span> },
    {
      key: "date",
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
      render: (row) =>
        row.type === "usage" ? (
          <ActionMenu items={[{ label: "Refund", icon: "refresh", onClick: () => setRefundTxId(row.id) }]} />
        ) : null,
    },
  ];

  const ModalOverlay = ({ open, onClose, title, children }) => {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-surface-container border border-surface-border/80 rounded-2xl max-w-sm w-full mx-4 animate-dropdown-open" onClick={(e) => e.stopPropagation()}>
          <div className="p-5">
            <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
            {children}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title="Credits"
        subtitle="Manage user credits and transactions"
        breadcrumbs={[{ label: "Admin" }, { label: "Credits" }]}
        actions={[
          { label: "Add Credits", icon: "add", variant: "primary", onClick: () => setShowAddModal(true) },
          { label: "Remove Credits", icon: "remove", onClick: () => setShowRemoveModal(true) },
          { label: "Export CSV", icon: "download", onClick: handleExportCSV },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Credits Sold" value={stats.sold} icon="credit_card" color="primary" />
        <StatCard title="Total Credits Used" value={stats.used} icon="trending_up" color="secondary" />
        <StatCard title="Total Manual Added" value={stats.manual} icon="gift" color="green" />
        <StatCard title="Total Refunded" value={stats.refunded} icon="refresh" color="accentOrange" />
      </div>

      <div className="glass-card rounded-xl p-5 mb-6">
        <h2 className="text-sm font-bold text-white mb-4">Top Credit Users</h2>
        <div className="space-y-3">
          {topUsers.map((user, i) => (
            <div key={user.id} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-on-surface-variant w-4">{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-medium text-white">{user.name}</p>
                  <p className="text-[10px] text-on-surface-variant">{user.email}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-yellow-400">{user.credits.toLocaleString()}</p>
                <p className="text-[10px] text-on-surface-variant">credits</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-surface-border/50 flex flex-col sm:flex-row gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by user name or email..." className="flex-1" />
          <FilterSelect
            value={typeFilter}
            onChange={setTypeFilter}
            placeholder="All Types"
            options={[
              { value: "purchase", label: "Purchase" },
              { value: "usage", label: "Usage" },
              { value: "refund", label: "Refund" },
              { value: "manual_add", label: "Manual Add" },
              { value: "manual_remove", label: "Manual Remove" },
            ]}
          />
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon="credit_card" title="No transactions found" description="No credit transactions match your current filters." />
        ) : (
          <DataTable columns={columns} data={filtered} />
        )}
      </div>

      <ModalOverlay open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Credits">
        <p className="text-xs text-on-surface-variant mb-4">Select a user and enter the amount of credits to add.</p>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">User</label>
            <select
              value={addForm.userId}
              onChange={(e) => setAddForm({ ...addForm, userId: e.target.value })}
              className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50 appearance-none"
            >
              <option value="">Select a user...</option>
              {mockUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">Amount</label>
            <input
              type="number"
              min="1"
              value={addForm.amount}
              onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
              placeholder="Enter credit amount..."
              className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white placeholder:text-on-surface-variant focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setShowAddModal(false)} className="flex-1 px-3 py-2 bg-surface-container-high border border-surface-border rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container-higher transition-all">
              Cancel
            </button>
            <button onClick={handleAddCredits} className="flex-1 px-3 py-2 primary-gradient text-white rounded-lg text-xs font-semibold hover:brightness-110 transition-all">
              Add Credits
            </button>
          </div>
        </div>
      </ModalOverlay>

      <ModalOverlay open={showRemoveModal} onClose={() => setShowRemoveModal(false)} title="Remove Credits">
        <p className="text-xs text-on-surface-variant mb-4">Select a user and enter the amount of credits to remove.</p>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">User</label>
            <select
              value={removeForm.userId}
              onChange={(e) => setRemoveForm({ ...removeForm, userId: e.target.value })}
              className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50 appearance-none"
            >
              <option value="">Select a user...</option>
              {mockUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">Amount</label>
            <input
              type="number"
              min="1"
              value={removeForm.amount}
              onChange={(e) => setRemoveForm({ ...removeForm, amount: e.target.value })}
              placeholder="Enter credit amount..."
              className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white placeholder:text-on-surface-variant focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setShowRemoveModal(false)} className="flex-1 px-3 py-2 bg-surface-container-high border border-surface-border rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container-higher transition-all">
              Cancel
            </button>
            <button onClick={handleRemoveCredits} className="flex-1 px-3 py-2 bg-error/20 text-error border border-error/30 rounded-lg text-xs font-semibold hover:bg-error/30 transition-all">
              Remove Credits
            </button>
          </div>
        </div>
      </ModalOverlay>

      <ConfirmModal
        open={!!refundTxId}
        onClose={() => setRefundTxId(null)}
        onConfirm={handleRefund}
        title="Refund Transaction"
        message="Are you sure you want to refund this transaction? The credits will be returned to the user."
        confirmLabel="Refund"
        confirmVariant="primary"
      />
    </div>
  );
}

"use client";
import { useState, useMemo, useEffect } from "react";
import StatusBadge from "../components/StatusBadge";
import FilterSelect from "../components/FilterSelect";
import SearchInput from "../components/SearchInput";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import Icon from "../../components/Icon";

const TYPE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "user", label: "User" },
  { value: "credit", label: "Credit" },
  { value: "payment", label: "Payment" },
  { value: "api", label: "API" },
  { value: "model", label: "Model" },
  { value: "login", label: "Login" },
];

const SEVERITY_OPTIONS = [
  { value: "info", label: "Info" },
  { value: "warning", label: "Warning" },
  { value: "error", label: "Error" },
];

const DATE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All Time" },
];

const typeIcons = {
  admin: "shield",
  user: "person",
  credit: "bolt",
  payment: "credit_card",
  api: "cloud_upload",
  model: "psychology",
  login: "key",
};

const typeLabels = {
  admin: "Admin",
  user: "User",
  credit: "Credit",
  payment: "Payment",
  api: "API",
  model: "Model",
  login: "Login",
};

function getRelativeTime(dateStr) {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isInDateRange(dateStr, range) {
  const d = new Date(dateStr);
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === "today") return d >= startOfDay;
  if (range === "week") {
    const weekStart = new Date(startOfDay);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    return d >= weekStart;
  }
  if (range === "month") {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return d >= monthStart;
  }
  return true;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  useEffect(() => {
    fetch("/api/admin/logs").then((r) => r.json()).then((d) => setLogs(d.data || [])).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (search) {
        const q = search.toLowerCase();
        if (!log.details.toLowerCase().includes(q)) return false;
      }
      if (typeFilter && log.type !== typeFilter) return false;
      if (severityFilter && log.severity !== severityFilter) return false;
      if (!isInDateRange(log.created_at, dateFilter)) return false;
      return true;
    });
  }, [search, typeFilter, severityFilter, dateFilter]);

  return (
    <div className="space-y-5 animate-fade-in-up">
      <PageHeader
        title="System Logs"
        subtitle="Track system events and admin actions"
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Logs" }]}
        actions={[
          { label: "Export Logs", icon: "download", variant: "secondary", onClick: () => {}, disabled: true },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by details..." className="w-64" />
        <FilterSelect value={typeFilter} onChange={setTypeFilter} options={TYPE_OPTIONS} placeholder="All Types" />
        <FilterSelect value={severityFilter} onChange={setSeverityFilter} options={SEVERITY_OPTIONS} placeholder="All Severities" />
        <FilterSelect value={dateFilter} onChange={setDateFilter} options={DATE_OPTIONS} placeholder="All Time" />
      </div>

      <div className="glass-card rounded-xl overflow-hidden card-glow" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.02), transparent)" }}>
        {filtered.length === 0 ? (
          <EmptyState icon="inbox" title="No logs found" description="No log entries match your search or filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-container-higher/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">User / Admin</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Details</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Severity</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id} className="border-b border-surface-border/50 hover:bg-surface-container-high/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-white capitalize">{log.action.replace(/_/g, " ")}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Icon name={typeIcons[log.type] || "info"} className="text-on-surface-variant" size={12} />
                        <span className="text-xs text-on-surface-variant">{typeLabels[log.type] || log.type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant">
                      {log.user_id && !log.admin_id && <span>User {log.user_id}</span>}
                      {log.admin_id && !log.user_id && <span>Admin {log.admin_id}</span>}
                      {log.admin_id && log.user_id && <span>Admin {log.admin_id} / User {log.user_id}</span>}
                      {!log.admin_id && !log.user_id && <span className="text-on-surface-variant/50">System</span>}
                    </td>
                    <td className="px-4 py-3 max-w-[280px]">
                      <p className="text-xs text-on-surface-variant truncate" title={log.details}>{log.details}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={log.severity} />
                    </td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant whitespace-nowrap" title={new Date(log.created_at).toLocaleString()}>
                      {getRelativeTime(log.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

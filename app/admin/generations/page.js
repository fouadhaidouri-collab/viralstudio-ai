"use client";

import { useState, useMemo, useEffect } from "react";
import StatusBadge from "../components/StatusBadge";
import ActionMenu from "../components/ActionMenu";
import ConfirmModal from "../components/ConfirmModal";
import SearchInput from "../components/SearchInput";
import FilterSelect from "../components/FilterSelect";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import CreditBadge from "../components/CreditBadge";
import StatCard from "../components/StatCard";
import Icon from "../../components/Icon";

const toolOptions = ["AI Video", "Image Lab", "Chat AI", "UGC Engine", "Clipping", "Hook Gen"];
const statusOptions = ["pending", "processing", "completed", "failed"];
const dateOptions = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All Time" },
];

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
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

const toolIcons = {
  "AI Video": "videocam",
  "Image Lab": "image",
  "Chat AI": "chat",
  "UGC Engine": "smart_display",
  "Clipping": "content_cut",
  "Hook Gen": "psychology",
};

export default function AdminGenerationsPage() {
  const [generations, setGenerations] = useState([]);
  useEffect(() => {
    fetch("/api/admin/generations").then((r) => r.json()).then((d) => setGenerations(d.data || [])).catch(() => {});
  }, []);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [toolFilter, setToolFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedGen, setSelectedGen] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmVariant, setConfirmVariant] = useState("primary");
  const [copiedId, setCopiedId] = useState(null);

  const filtered = useMemo(() => {
    return generations.filter((g) => {
      if (search) {
        const q = search.toLowerCase();
        if (!g.prompt.toLowerCase().includes(q) && !g.user_name.toLowerCase().includes(q)) return false;
      }
      if (statusFilter && g.status !== statusFilter) return false;
      if (toolFilter && g.tool !== toolFilter) return false;
      if (!isInDateRange(g.created_at, dateFilter)) return false;
      return true;
    });
  }, [generations, search, statusFilter, toolFilter, dateFilter]);

  const stats = useMemo(() => {
    const total = generations.length;
    const completed = generations.filter((g) => g.status === "completed").length;
    const failed = generations.filter((g) => g.status === "failed").length;
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, failed, successRate };
  }, [generations]);

  const handleRefund = (gen) => {
    setConfirmTitle("Refund Credits");
    setConfirmMessage(`Refund ${gen.credits_used} credits to ${gen.user_name} for generation ${gen.id}?`);
    setConfirmVariant("primary");
    setConfirmAction(() => () => {
      setGenerations(generations.map((g) => g.id === gen.id ? { ...g, status: "refunded" } : g));
      setConfirmAction(null);
    });
  };

  const handleDelete = (gen) => {
    setConfirmTitle("Delete Generation");
    setConfirmMessage(`Are you sure you want to delete generation "${gen.id}"? This action cannot be undone.`);
    setConfirmVariant("danger");
    setConfirmAction(() => () => {
      setGenerations(generations.filter((g) => g.id !== gen.id));
      setConfirmAction(null);
    });
  };

  const handleRetry = (gen) => {
    setGenerations(generations.map((g) => g.id === gen.id ? { ...g, status: "processing" } : g));
  };

  const handleCopyPrompt = (gen) => {
    navigator.clipboard.writeText(gen.prompt).then(() => {
      setCopiedId(gen.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleMarkFeatured = (gen) => {
    setGenerations(generations.map((g) => g.id === gen.id ? { ...g, featured: !g.featured } : g));
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <PageHeader
        title="Generations"
        subtitle="Monitor and manage all AI generations across the platform"
        breadcrumbs={[{ label: "Admin" }, { label: "Generations" }]}
        actions={[
          { label: "Export", icon: "download", variant: "secondary", onClick: () => {}, disabled: true },
        ]}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Total Generations" value={stats.total} icon="auto_awesome" color="primary" />
        <StatCard title="Completed" value={stats.completed} icon="check_circle" color="green" />
        <StatCard title="Failed" value={stats.failed} icon="error" color="error" />
        <StatCard title="Success Rate" value={`${stats.successRate}%`} icon="trending_up" color={stats.successRate > 80 ? "green" : stats.successRate > 50 ? "yellow" : "error"} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by prompt or user..." className="w-64" />
        <FilterSelect value={statusFilter} onChange={setStatusFilter} options={statusOptions.map((s) => ({ value: s, label: s }))} placeholder="All Status" />
        <FilterSelect value={toolFilter} onChange={setToolFilter} options={toolOptions.map((t) => ({ value: t, label: t }))} placeholder="All Tools" />
        <FilterSelect value={dateFilter} onChange={setDateFilter} options={dateOptions} placeholder="All Time" />
      </div>

      <div className="glass-card rounded-xl overflow-hidden card-glow" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.02), transparent)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-container-higher/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Tool</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Model</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Prompt</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Credits</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Created</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <EmptyState icon="inbox" title="No generations found" description="No generations match your current filters." />
                  </td>
                </tr>
              ) : (
                filtered.map((gen) => (
                  <tr key={gen.id} className="border-b border-surface-border/50 hover:bg-surface-container-high/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                          {gen.user_name?.charAt(0)}
                        </div>
                        <span className="text-xs font-medium text-white">{gen.user_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Icon name={toolIcons[gen.tool] || "auto_awesome"} className="text-on-surface-variant" size={12} />
                        <span className="text-xs text-on-surface-variant">{gen.tool}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-white">{gen.model}</td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="text-xs text-on-surface-variant truncate" title={gen.prompt}>{gen.prompt}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={gen.status} />
                    </td>
                    <td className="px-4 py-3">
                      <CreditBadge amount={gen.credits_used} />
                    </td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant whitespace-nowrap">{formatDate(gen.created_at)}</td>
                    <td className="px-4 py-3">
                      <ActionMenu
                        items={[
                          { label: "View Details", icon: "visibility", onClick: () => setSelectedGen(gen) },
                          { label: "Retry Generation", icon: "refresh", onClick: () => handleRetry(gen) },
                          { label: "Refund Credits", icon: "currency_bitcoin", onClick: () => handleRefund(gen) },
                          { label: "Copy Prompt", icon: "content_copy", onClick: () => handleCopyPrompt(gen) },
                          ...(gen.status === "completed" && gen.output_file ? [{ label: "Download", icon: "download", onClick: () => window.open(gen.output_file, "_blank") }] : []),
                          { label: gen.featured ? "Unmark Featured" : "Mark as Featured", icon: "star", onClick: () => handleMarkFeatured(gen) },
                          { label: "Delete", icon: "delete", variant: "danger", onClick: () => handleDelete(gen) },
                        ]}
                      />
                      {copiedId === gen.id && (
                        <span className="ml-2 text-[10px] text-green-400">Copied!</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedGen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedGen(null)}>
          <div className="bg-surface-container border border-surface-border/80 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto mx-4 animate-dropdown-open" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Generation Details</h2>
                <button onClick={() => setSelectedGen(null)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-high hover:bg-surface-container-higher transition-colors">
                  <Icon name="close" className="text-on-surface-variant" size={16} />
                </button>
              </div>

              <div className="bg-surface-container-low rounded-lg p-3">
                <p className="text-xs text-on-surface-variant mb-1">Prompt</p>
                <p className="text-sm text-white leading-relaxed">{selectedGen.prompt}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-surface-container-low rounded-lg p-3">
                  <p className="text-on-surface-variant">User</p>
                  <p className="text-white font-medium mt-0.5">{selectedGen.user_name}</p>
                </div>
                <div className="bg-surface-container-low rounded-lg p-3">
                  <p className="text-on-surface-variant">Tool</p>
                  <p className="text-white font-medium mt-0.5">{selectedGen.tool}</p>
                </div>
                <div className="bg-surface-container-low rounded-lg p-3">
                  <p className="text-on-surface-variant">Model</p>
                  <p className="text-white font-medium mt-0.5">{selectedGen.model}</p>
                </div>
                <div className="bg-surface-container-low rounded-lg p-3">
                  <p className="text-on-surface-variant">Status</p>
                  <div className="mt-0.5"><StatusBadge status={selectedGen.status} /></div>
                </div>
                <div className="bg-surface-container-low rounded-lg p-3">
                  <p className="text-on-surface-variant">Credits Used</p>
                  <div className="mt-0.5"><CreditBadge amount={selectedGen.credits_used} /></div>
                </div>
                <div className="bg-surface-container-low rounded-lg p-3">
                  <p className="text-on-surface-variant">Created</p>
                  <p className="text-white mt-0.5">{formatDate(selectedGen.created_at)}</p>
                </div>
              </div>

              {selectedGen.status === "failed" && selectedGen.error_message && (
                <div className="bg-error/10 border border-error/20 rounded-lg p-3">
                  <p className="text-xs text-on-surface-variant mb-1">Error Message</p>
                  <p className="text-xs text-error">{selectedGen.error_message}</p>
                </div>
              )}

              {selectedGen.input_files && selectedGen.input_files.length > 0 && (
                <div>
                  <p className="text-xs text-on-surface-variant mb-1.5">Input Files</p>
                  <div className="space-y-1">
                    {selectedGen.input_files.map((f, i) => (
                      <a key={i} href={f} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-2 text-xs text-primary hover:underline">
                        <Icon name="folder" size={12} />
                        {f.split("/").pop()}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedGen.output_file && (
                <a
                  href={selectedGen.output_file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-surface-container-high border border-surface-border rounded-lg text-xs font-medium text-white hover:bg-surface-container-higher transition-all"
                >
                  <Icon name="download" size={14} />
                  Download Output
                </a>
              )}

              <div className="bg-surface-container-low rounded-lg p-3">
                <p className="text-xs text-on-surface-variant mb-1">Status Timeline</p>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    Created
                  </span>
                  <span className="text-on-surface-variant">→</span>
                  <span className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${selectedGen.status === "pending" ? "bg-yellow-400" : selectedGen.status === "processing" ? "bg-secondary" : selectedGen.status === "completed" ? "bg-green-400" : "bg-error"}`} />
                    {selectedGen.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={confirmAction}
        title={confirmTitle}
        message={confirmMessage}
        confirmVariant={confirmVariant}
      />
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { mockTools } from "../data/mockTools";
import StatusBadge from "../components/StatusBadge";
import PlanBadge from "../components/PlanBadge";
import ActionMenu from "../components/ActionMenu";
import ConfirmModal from "../components/ConfirmModal";
import SearchInput from "../components/SearchInput";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import Icon from "../../components/Icon";

const creditCostModeLabels = {
  per_generation: "Per Generation",
  per_message: "Per Message",
  per_job: "Per Job",
};

export default function AdminAiToolsPage() {
  const [tools, setTools] = useState(mockTools);
  const [search, setSearch] = useState("");
  const [editingTool, setEditingTool] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const filtered = useMemo(() => {
    if (!search) return tools;
    const q = search.toLowerCase();
    return tools.filter((t) => t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q));
  }, [tools, search]);

  const handleToggleStatus = (toolId) => {
    setTools((prev) =>
      prev.map((t) => t.id === toolId ? { ...t, status: t.status === "active" ? "inactive" : "active" } : t)
    );
  };

  const handleToggleComingSoon = (toolId) => {
    setTools((prev) =>
      prev.map((t) => t.id === toolId ? { ...t, coming_soon: !t.coming_soon } : t)
    );
  };

  const handleDeleteTool = (toolId) => {
    setTools((prev) => prev.filter((t) => t.id !== toolId));
    setConfirmAction(null);
  };

  const handleEditOpen = (tool) => {
    setEditForm({ ...tool });
    setEditingTool(tool.id);
  };

  const handleEditSave = () => {
    if (!editForm) return;
    setTools((prev) => prev.map((t) => t.id === editForm.id ? { ...editForm } : t));
    setEditingTool(null);
    setEditForm(null);
  };

  const handleEditCancel = () => {
    setEditingTool(null);
    setEditForm(null);
  };

  const planOptions = ["Free", "Creator", "Pro", "Agency"];

  const togglePlan = (plan) => {
    if (!editForm) return;
    const current = editForm.allowed_plans || [];
    const updated = current.includes(plan)
      ? current.filter((p) => p !== plan)
      : [...current, plan];
    setEditForm({ ...editForm, allowed_plans: updated });
  };

  return (
    <div className="min-h-full bg-background text-white p-6">
      <PageHeader
        title="AI Tools"
        subtitle="Manage the tools that appear in the client dashboard"
        breadcrumbs={[{ label: "Admin" }, { label: "AI Tools" }]}
        actions={[
          {
            label: "Add Tool",
            icon: "add",
            variant: "primary",
            onClick: () => {
              const newId = `tool_new_${Date.now()}`;
              const newTool = {
                id: newId,
                name: "",
                slug: "",
                icon: "auto_awesome",
                description: "",
                status: "active",
                credit_cost_mode: "per_generation",
                featured: false,
                coming_soon: false,
                display_order: tools.length + 1,
                allowed_plans: ["Free"],
                created_at: new Date().toISOString(),
              };
              setTools((prev) => [newTool, ...prev]);
              setEditForm(newTool);
              setEditingTool(newId);
            },
          },
        ]}
      />

      <div className="mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or slug..." className="max-w-xs" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="apps" title="No tools found" description="No AI tools match your search. Try a different query." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((tool) => (
            <div key={tool.id}>
              {editingTool === tool.id ? (
                <div className="glass-card rounded-xl p-5 card-glow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white">Edit Tool</h3>
                    <button onClick={handleEditCancel} className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container-high hover:bg-surface-container-higher transition-colors">
                      <Icon name="close" className="text-on-surface-variant" size={14} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">Name</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">Slug</label>
                      <input
                        type="text"
                        value={editForm.slug}
                        onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                        className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">Icon</label>
                      <select
                        value={editForm.icon}
                        onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                        className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50 appearance-none"
                      >
                        <option value="movie">Video</option>
                        <option value="chat">Chat</option>
                        <option value="image">Image</option>
                        <option value="record_voice_over">UGC</option>
                        <option value="auto_awesome">Hook</option>
                        <option value="content_cut">Clipping</option>
                        <option value="settings">Settings</option>
                        <option value="bolt">Bolt</option>
                        <option value="sparkles">Sparkles</option>
                        <option value="brain">Brain</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">Description</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows={3}
                        className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50 resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">Status</label>
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                          className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50 appearance-none"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">Credit Cost Mode</label>
                        <select
                          value={editForm.credit_cost_mode}
                          onChange={(e) => setEditForm({ ...editForm, credit_cost_mode: e.target.value })}
                          className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50 appearance-none"
                        >
                          <option value="per_generation">Per Generation</option>
                          <option value="per_message">Per Message</option>
                          <option value="per_job">Per Job</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">Featured</label>
                        <label className="flex items-center gap-2 cursor-pointer mt-1.5">
                          <input
                            type="checkbox"
                            checked={editForm.featured}
                            onChange={(e) => setEditForm({ ...editForm, featured: e.target.checked })}
                            className="w-4 h-4 rounded border-surface-border bg-surface-container-lowest accent-primary"
                          />
                          <span className="text-xs text-white">{editForm.featured ? "Featured" : "Not featured"}</span>
                        </label>
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">Coming Soon</label>
                        <label className="flex items-center gap-2 cursor-pointer mt-1.5">
                          <input
                            type="checkbox"
                            checked={editForm.coming_soon}
                            onChange={(e) => setEditForm({ ...editForm, coming_soon: e.target.checked })}
                            className="w-4 h-4 rounded border-surface-border bg-surface-container-lowest accent-primary"
                          />
                          <span className="text-xs text-white">{editForm.coming_soon ? "Enabled" : "Disabled"}</span>
                        </label>
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">Display Order</label>
                        <input
                          type="number"
                          min="0"
                          value={editForm.display_order}
                          onChange={(e) => setEditForm({ ...editForm, display_order: parseInt(e.target.value) || 0 })}
                          className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">Allowed Plans</label>
                      <div className="flex flex-wrap gap-1.5">
                        {planOptions.map((plan) => (
                          <button
                            key={plan}
                            onClick={() => togglePlan(plan)}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-semibold border transition-all ${
                              (editForm.allowed_plans || []).includes(plan)
                                ? "border-primary/40 bg-primary/20 text-primary"
                                : "border-surface-border/50 bg-surface-container-high text-on-surface-variant hover:bg-surface-container-higher"
                            }`}
                          >
                            {plan}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button onClick={handleEditSave} className="flex-1 px-3 py-2 primary-gradient text-white rounded-lg text-xs font-semibold hover:brightness-110 transition-all">
                        Save
                      </button>
                      <button onClick={handleEditCancel} className="flex-1 px-3 py-2 bg-surface-container-high border border-surface-border rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container-higher transition-all">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-card rounded-xl p-5 card-glow glass-card-hover relative group">
                  <div className="absolute top-3 right-3 z-10">
                    <ActionMenu
                      size="sm"
                      items={[
                        { label: "Edit", icon: "edit", onClick: () => handleEditOpen(tool) },
                        { label: tool.status === "active" ? "Disable" : "Enable", icon: tool.status === "active" ? "close" : "check", onClick: () => setConfirmAction({ type: "toggleStatus", toolId: tool.id }) },
                        { label: tool.coming_soon ? "Remove Coming Soon" : "Make Coming Soon", icon: "schedule", onClick: () => handleToggleComingSoon(tool.id) },
                        { label: "Delete", icon: "delete", variant: "danger", onClick: () => setConfirmAction({ type: "delete", toolId: tool.id }) },
                      ]}
                    />
                  </div>

                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center icon-glow shrink-0">
                      <Icon name={tool.icon} className="text-primary" size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white truncate">{tool.name}</h3>
                        {tool.featured && <Icon name="star" className="text-yellow-400 shrink-0" size={12} />}
                        {tool.coming_soon && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-secondary/15 text-secondary shrink-0">SOON</span>
                        )}
                      </div>
                      <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">{tool.slug}</p>
                    </div>
                  </div>

                  <p className="text-[11px] text-on-surface-variant leading-relaxed mb-3 line-clamp-2">{tool.description}</p>

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <StatusBadge status={tool.status} />
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant font-medium">
                      {creditCostModeLabels[tool.credit_cost_mode] || tool.credit_cost_mode}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant font-medium">
                      Order: {tool.display_order}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {tool.allowed_plans.map((plan) => (
                      <PlanBadge key={plan} plan={plan} />
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t border-surface-border/30 flex gap-2">
                    <button
                      onClick={() => handleToggleStatus(tool.id)}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                        tool.status === "active"
                          ? "bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20"
                          : "bg-surface-container-high text-on-surface-variant border border-surface-border/50 hover:bg-surface-container-higher"
                      }`}
                    >
                      {tool.status === "active" ? "Enabled" : "Disabled"}
                    </button>
                    <button
                      onClick={() => handleEditOpen(tool)}
                      className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold bg-surface-container-high border border-surface-border/50 text-on-surface-variant hover:bg-surface-container-higher transition-all"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={confirmAction?.type === "toggleStatus"}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => { handleToggleStatus(confirmAction.toolId); setConfirmAction(null); }}
        title={tools.find((t) => t.id === confirmAction?.toolId)?.status === "active" ? "Disable Tool" : "Enable Tool"}
        message={`Are you sure you want to ${tools.find((t) => t.id === confirmAction?.toolId)?.status === "active" ? "disable" : "enable"} this tool?`}
        confirmLabel={tools.find((t) => t.id === confirmAction?.toolId)?.status === "active" ? "Disable" : "Enable"}
        confirmVariant={tools.find((t) => t.id === confirmAction?.toolId)?.status === "active" ? "danger" : "primary"}
      />

      <ConfirmModal
        open={confirmAction?.type === "delete"}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => handleDeleteTool(confirmAction.toolId)}
        title="Delete Tool"
        message="Are you sure you want to delete this tool? This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}

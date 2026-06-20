"use client";

import { useState, useMemo, Fragment } from "react";
import { mockModels } from "../data/mockModels";
import StatusBadge from "../components/StatusBadge";
import PlanBadge from "../components/PlanBadge";
import ActionMenu from "../components/ActionMenu";
import ConfirmModal from "../components/ConfirmModal";
import SearchInput from "../components/SearchInput";
import FilterSelect from "../components/FilterSelect";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import Icon from "../../components/Icon";

const providerColors = {
  "FAL.ai": { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
  "OpenRouter": { bg: "bg-secondary/10", text: "text-secondary", border: "border-secondary/20" },
  "ElevenLabs": { bg: "bg-accent-pink/10", text: "text-accent-pink", border: "border-accent-pink/20" },
  "Runway": { bg: "bg-accent-orange/10", text: "text-accent-orange", border: "border-accent-orange/20" },
  "Luma": { bg: "bg-tertiary/10", text: "text-tertiary", border: "border-tertiary/20" },
  "Pika": { bg: "bg-accent-cyan/10", text: "text-accent-cyan", border: "border-accent-cyan/20" },
  "Google Veo": { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" },
  "Kling": { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
  "MiniMax": { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
  "Flux": { bg: "bg-accent-orange/10", text: "text-accent-orange", border: "border-accent-orange/20" },
};

const toolCategories = ["AI Video", "Image Lab", "Chat AI", "UGC Engine", "Clipping"];
const providerOptions = Object.keys(providerColors);
const statusOptions = ["active", "inactive"];

const emptyModel = {
  id: "", name: "", provider: "FAL.ai", api_model_id: "", tool_category: "AI Video",
  version: "", credit_cost: 1, real_api_cost: 0, profit_margin: 20, status: "active",
  duration_options: [], resolution_options: [], aspect_ratio_options: [], quantity_limits: [],
  allowed_plans: ["Free", "Creator", "Pro", "Agency"], featured: false,
};

export default function AdminModelsPage() {
  const [models, setModels] = useState(mockModels);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [form, setForm] = useState(emptyModel);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editingCredit, setEditingCredit] = useState(null);
  const [creditInput, setCreditInput] = useState("");
  const [testResult, setTestResult] = useState(null);

  const filtered = useMemo(() => {
    return models.filter((m) => {
      if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryFilter && m.tool_category !== categoryFilter) return false;
      if (providerFilter && m.provider !== providerFilter) return false;
      if (statusFilter && m.status !== statusFilter) return false;
      return true;
    });
  }, [models, search, categoryFilter, providerFilter, statusFilter]);

  const handleAdd = () => {
    setEditingModel(null);
    setForm(emptyModel);
    setShowModal(true);
  };

  const handleEdit = (model) => {
    setEditingModel(model);
    setForm({ ...model });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingModel) {
      setModels(models.map((m) => (m.id === editingModel.id ? { ...form } : m)));
    } else {
      setModels([{ ...form, id: "mdl_" + Date.now() }, ...models]);
    }
    setShowModal(false);
  };

  const handleToggleStatus = (model) => {
    setModels(models.map((m) => (m.id === model.id ? { ...m, status: m.status === "active" ? "inactive" : "active" } : m)));
  };

  const handleDelete = () => {
    if (confirmDelete) {
      setModels(models.filter((m) => m.id !== confirmDelete.id));
      setConfirmDelete(null);
    }
  };

  const handleCreditSave = (model) => {
    const val = parseInt(creditInput);
    if (!isNaN(val) && val > 0) {
      setModels(models.map((m) => (m.id === model.id ? { ...m, credit_cost: val } : m)));
    }
    setEditingCredit(null);
    setCreditInput("");
  };

  const handleTestModel = (model) => {
    setTestResult("Test sent to " + model.provider);
    setTimeout(() => setTestResult(null), 3000);
  };

  const handleChangeProvider = (model) => {
    const providers = Object.keys(providerColors);
    const idx = providers.indexOf(model.provider);
    const next = providers[(idx + 1) % providers.length];
    setModels(models.map((m) => (m.id === model.id ? { ...m, provider: next } : m)));
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const updateFormArray = (field, value) => {
    const arr = value.split(",").map((s) => s.trim()).filter(Boolean);
    setForm({ ...form, [field]: arr });
  };

  const providerBadge = (provider) => {
    const pc = providerColors[provider] || providerColors["FAL.ai"];
    return (
      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-md ${pc.bg} ${pc.text} ${pc.border} border`}>
        {provider}
      </span>
    );
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <PageHeader
        title="AI Models"
        subtitle="Manage AI models, providers, pricing and availability"
        breadcrumbs={[{ label: "Admin" }, { label: "Models" }]}
        actions={[
          { label: "Add Model", variant: "primary", icon: "add", onClick: handleAdd },
          { label: "Sync All", icon: "refresh", onClick: () => setTestResult("Sync triggered"), variant: "secondary" },
        ]}
      />

      {testResult && (
        <div className="text-xs px-3 py-2 bg-surface-container-high border border-surface-border rounded-lg text-on-surface-variant">
          {testResult}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by model name..." className="w-56" />
        <FilterSelect value={categoryFilter} onChange={setCategoryFilter} options={toolCategories.map((c) => ({ value: c, label: c }))} placeholder="All Categories" />
        <FilterSelect value={providerFilter} onChange={setProviderFilter} options={providerOptions.map((p) => ({ value: p, label: p }))} placeholder="All Providers" />
        <FilterSelect value={statusFilter} onChange={setStatusFilter} options={statusOptions.map((s) => ({ value: s, label: s }))} placeholder="All Status" />
      </div>

      <div className="glass-card rounded-xl overflow-hidden card-glow" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.02), transparent)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-container-higher/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Model Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Provider</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">API Model ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Version</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Credit Cost</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Real API $</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Margin</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Plans</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Featured</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="12">
                    <EmptyState icon="inbox" title="No models found" description="No AI models match your current filters. Try adjusting your search criteria." action={{ label: "Add Model", onClick: handleAdd }} />
                  </td>
                </tr>
              ) : (
                filtered.map((model) => (
                  <Fragment key={model.id}>
                    <tr
                      className="border-b border-surface-border/50 hover:bg-surface-container-high/30 transition-colors cursor-pointer"
                      onClick={() => toggleExpand(model.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Icon name={expandedId === model.id ? "expand_more" : "chevron_right"} className="text-on-surface-variant" size={12} />
                          <span className="font-medium text-white text-xs">{model.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{providerBadge(model.provider)}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-on-surface-variant font-mono">{model.api_model_id}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">{model.tool_category}</td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">{model.version}</td>
                      <td className="px-4 py-3">
                        {editingCredit === model.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={creditInput}
                              onChange={(e) => setCreditInput(e.target.value)}
                              className="w-16 bg-surface-container-low border border-surface-border rounded px-1.5 py-0.5 text-xs text-yellow-400 focus:outline-none focus:border-primary/50"
                              autoFocus
                              onBlur={() => handleCreditSave(model)}
                              onKeyDown={(e) => { if (e.key === "Enter") handleCreditSave(model); if (e.key === "Escape") setEditingCredit(null); }}
                            />
                          </div>
                        ) : (
                          <span
                            className="text-yellow-400 text-xs font-medium cursor-pointer hover:underline"
                            onClick={(e) => { e.stopPropagation(); setEditingCredit(model.id); setCreditInput(String(model.credit_cost)); }}
                          >
                            {model.credit_cost} cr
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">${model.real_api_cost?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs text-green-400">{model.profit_margin}%</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={model.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {model.allowed_plans?.map((plan) => (
                            <PlanBadge key={plan} plan={plan} />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {model.featured ? (
                          <Icon name="star" className="text-yellow-400" size={14} />
                        ) : (
                          <span className="text-on-surface-variant/50 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <ActionMenu
                          items={[
                            { label: "Edit", icon: "edit", onClick: () => handleEdit(model) },
                            { label: model.status === "active" ? "Disable" : "Enable", icon: model.status === "active" ? "close" : "check", onClick: () => handleToggleStatus(model) },
                            { label: "Change Credit Cost", icon: "bolt", onClick: () => { setEditingCredit(model.id); setCreditInput(String(model.credit_cost)); } },
                            { label: "Change Provider", icon: "refresh", onClick: () => handleChangeProvider(model) },
                            { label: "Test Model", icon: "play_arrow", onClick: () => handleTestModel(model) },
                          ]}
                        />
                      </td>
                    </tr>
                    {expandedId === model.id && (
                      <tr className="bg-surface-container-low/50">
                        <td colSpan="12" className="px-4 py-4">
                          <div className="grid grid-cols-3 gap-4 text-xs">
                            <div>
                              <p className="text-on-surface-variant mb-1.5 font-medium">Duration Options</p>
                              <div className="flex flex-wrap gap-1.5">
                                {model.duration_options?.length > 0 ? model.duration_options.map((d) => (
                                  <span key={d} className="px-2 py-0.5 bg-surface-container-high border border-surface-border rounded text-xs text-white">{d}</span>
                                )) : <span className="text-on-surface-variant">—</span>}
                              </div>
                            </div>
                            <div>
                              <p className="text-on-surface-variant mb-1.5 font-medium">Resolution Options</p>
                              <div className="flex flex-wrap gap-1.5">
                                {model.resolution_options?.length > 0 ? model.resolution_options.map((r) => (
                                  <span key={r} className="px-2 py-0.5 bg-surface-container-high border border-surface-border rounded text-xs text-white">{r}</span>
                                )) : <span className="text-on-surface-variant">—</span>}
                              </div>
                            </div>
                            <div>
                              <p className="text-on-surface-variant mb-1.5 font-medium">Aspect Ratio Options</p>
                              <div className="flex flex-wrap gap-1.5">
                                {model.aspect_ratio_options?.length > 0 ? model.aspect_ratio_options.map((a) => (
                                  <span key={a} className="px-2 py-0.5 bg-surface-container-high border border-surface-border rounded text-xs text-white">{a}</span>
                                )) : <span className="text-on-surface-variant">—</span>}
                              </div>
                            </div>
                            <div>
                              <p className="text-on-surface-variant mb-1.5 font-medium">Quantity Limits</p>
                              <div className="flex flex-wrap gap-1.5">
                                {model.quantity_limits?.length > 0 ? model.quantity_limits.map((q) => (
                                  <span key={q} className="px-2 py-0.5 bg-surface-container-high border border-surface-border rounded text-xs text-white">{q}</span>
                                )) : <span className="text-on-surface-variant">—</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-surface-container border border-surface-border/80 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto mx-4 animate-dropdown-open" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{editingModel ? "Edit Model" : "Add Model"}</h2>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-high hover:bg-surface-container-higher transition-colors">
                  <Icon name="close" className="text-on-surface-variant" size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-on-surface-variant">Model Name</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-surface-container-lowest border border-surface-border rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-on-surface-variant">Provider</label>
                  <select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} className="w-full bg-surface-container-lowest border border-surface-border rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none text-white">
                    {providerOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-on-surface-variant">API Model ID</label>
                  <input type="text" value={form.api_model_id} onChange={(e) => setForm({ ...form, api_model_id: e.target.value })} className="w-full bg-surface-container-lowest border border-surface-border rounded-lg px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-on-surface-variant">Tool Category</label>
                  <select value={form.tool_category} onChange={(e) => setForm({ ...form, tool_category: e.target.value })} className="w-full bg-surface-container-lowest border border-surface-border rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none text-white">
                    {toolCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-on-surface-variant">Version</label>
                  <input type="text" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} className="w-full bg-surface-container-lowest border border-surface-border rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-on-surface-variant">Credit Cost</label>
                  <input type="number" value={form.credit_cost} onChange={(e) => setForm({ ...form, credit_cost: parseInt(e.target.value) || 1 })} className="w-full bg-surface-container-lowest border border-surface-border rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none text-yellow-400" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-on-surface-variant">Real API Cost ($)</label>
                  <input type="number" step="0.01" value={form.real_api_cost} onChange={(e) => setForm({ ...form, real_api_cost: parseFloat(e.target.value) || 0 })} className="w-full bg-surface-container-lowest border border-surface-border rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-on-surface-variant">Profit Margin (%)</label>
                  <input type="number" value={form.profit_margin} onChange={(e) => setForm({ ...form, profit_margin: parseInt(e.target.value) || 0 })} className="w-full bg-surface-container-lowest border border-surface-border rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none text-green-400" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-on-surface-variant">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full bg-surface-container-lowest border border-surface-border rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none text-white">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-on-surface-variant">Featured</label>
                  <div className="flex items-center gap-3 mt-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="featured" checked={form.featured === true} onChange={() => setForm({ ...form, featured: true })} className="accent-primary" />
                      <span className="text-xs text-white">Yes</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="featured" checked={form.featured === false} onChange={() => setForm({ ...form, featured: false })} className="accent-primary" />
                      <span className="text-xs text-white">No</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-on-surface-variant">Duration Options (comma-separated)</label>
                  <input type="text" value={form.duration_options?.join(", ")} onChange={(e) => updateFormArray("duration_options", e.target.value)} className="w-full bg-surface-container-lowest border border-surface-border rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-on-surface-variant">Resolution Options (comma-separated)</label>
                  <input type="text" value={form.resolution_options?.join(", ")} onChange={(e) => updateFormArray("resolution_options", e.target.value)} className="w-full bg-surface-container-lowest border border-surface-border rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-on-surface-variant">Aspect Ratio Options (comma-separated)</label>
                  <input type="text" value={form.aspect_ratio_options?.join(", ")} onChange={(e) => updateFormArray("aspect_ratio_options", e.target.value)} className="w-full bg-surface-container-lowest border border-surface-border rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-on-surface-variant">Quantity Limits (comma-separated)</label>
                  <input type="text" value={form.quantity_limits?.join(", ")} onChange={(e) => updateFormArray("quantity_limits", e.target.value)} className="w-full bg-surface-container-lowest border border-surface-border rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none text-white" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-on-surface-variant">Allowed Plans</label>
                <div className="flex flex-wrap gap-2">
                  {["Free", "Creator", "Pro", "Agency"].map((plan) => (
                    <label key={plan} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.allowed_plans?.includes(plan)}
                        onChange={(e) => {
                          const plans = e.target.checked
                            ? [...(form.allowed_plans || []), plan]
                            : (form.allowed_plans || []).filter((p) => p !== plan);
                          setForm({ ...form, allowed_plans: plans });
                        }}
                        className="accent-primary"
                      />
                      <span className="text-xs text-white">{plan}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={handleSave} className="flex-1 px-4 py-2 primary-gradient text-white rounded-lg text-xs font-semibold hover:brightness-110 transition-all">
                  {editingModel ? "Save Changes" : "Add Model"}
                </button>
                <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-surface-container-high border border-surface-border rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container-higher transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Model"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}

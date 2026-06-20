"use client";

import { useState, useMemo } from "react";
import { mockTemplates } from "../data/mockTemplates";
import StatusBadge from "../components/StatusBadge";
import ActionMenu from "../components/ActionMenu";
import ConfirmModal from "../components/ConfirmModal";
import SearchInput from "../components/SearchInput";
import FilterSelect from "../components/FilterSelect";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import Icon from "../../components/Icon";

const categories = ["Nature", "Urban", "Food", "Travel", "Sports", "Art", "Marketing"];
const tools = ["AI Video", "Image Lab", "Chat AI", "UGC Engine"];

const emptyTemplate = {
  id: "", title: "", prompt: "", category: "Nature", tool: "AI Video",
  thumbnail: null, status: "active", featured: false,
};

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState(mockTemplates);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [toolFilter, setToolFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [form, setForm] = useState(emptyTemplate);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (search) {
        const q = search.toLowerCase();
        if (!t.title.toLowerCase().includes(q) && !t.prompt.toLowerCase().includes(q)) return false;
      }
      if (categoryFilter && t.category !== categoryFilter) return false;
      if (toolFilter && t.tool !== toolFilter) return false;
      if (statusFilter && t.status !== statusFilter) return false;
      if (featuredFilter === "yes" && !t.featured) return false;
      if (featuredFilter === "no" && t.featured) return false;
      return true;
    });
  }, [templates, search, categoryFilter, toolFilter, statusFilter, featuredFilter]);

  const handleAdd = () => {
    setEditingTemplate(null);
    setForm(emptyTemplate);
    setShowModal(true);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setForm({ ...template });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingTemplate) {
      setTemplates(templates.map((t) => (t.id === editingTemplate.id ? { ...form, created_at: t.created_at } : t)));
    } else {
      setTemplates([{ ...form, id: "tpl_" + Date.now(), created_at: new Date().toISOString() }, ...templates]);
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    if (confirmDelete) {
      setTemplates(templates.filter((t) => t.id !== confirmDelete.id));
      setConfirmDelete(null);
    }
  };

  const handleToggleFeatured = (template) => {
    setTemplates(templates.map((t) => t.id === template.id ? { ...t, featured: !t.featured } : t));
  };

  const handleCopyPrompt = (template) => {
    navigator.clipboard.writeText(template.prompt);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const gradientColors = [
    "from-purple-600/40 to-cyan-600/40",
    "from-cyan-600/40 to-purple-600/40",
    "from-pink-600/40 to-purple-600/40",
    "from-amber-600/40 to-purple-600/40",
    "from-emerald-600/40 to-cyan-600/40",
    "from-rose-600/40 to-purple-600/40",
    "from-blue-600/40 to-cyan-600/40",
    "from-violet-600/40 to-fuchsia-600/40",
  ];

  const getGradient = (index) => gradientColors[index % gradientColors.length];

  return (
    <div className="min-h-screen bg-background text-white p-6">
      <PageHeader
        title="Templates"
        subtitle="Manage featured templates from the home page"
        breadcrumbs={[{ label: "Admin" }, { label: "Templates" }]}
        actions={[
          { label: "Add Template", variant: "primary", icon: "add", onClick: handleAdd },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by title or prompt..." className="w-56" />
        <FilterSelect value={categoryFilter} onChange={setCategoryFilter} options={categories.map((c) => ({ value: c, label: c }))} placeholder="All Categories" />
        <FilterSelect value={toolFilter} onChange={setToolFilter} options={tools.map((t) => ({ value: t, label: t }))} placeholder="All Tools" />
        <FilterSelect value={statusFilter} onChange={setStatusFilter} options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} placeholder="All Status" />
        <FilterSelect value={featuredFilter} onChange={setFeaturedFilter} options={[{ value: "yes", label: "Featured" }, { value: "no", label: "Not Featured" }]} placeholder="All Featured" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="inbox" title="No templates found" description="No templates match your current filters. Try adjusting your search criteria." action={{ label: "Add Template", onClick: handleAdd }} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((template, idx) => (
            <div key={template.id} className="glass-card rounded-xl overflow-hidden card-glow glass-card-hover group">
              <div className={`h-28 bg-gradient-to-br ${getGradient(idx)} flex items-center justify-center relative`}>
                {template.thumbnail ? (
                  <img src={template.thumbnail} alt={template.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-white/60">{template.title.charAt(0).toUpperCase()}</span>
                )}
                <div className="absolute top-2 right-2">
                  <ActionMenu
                    items={[
                      { label: "Edit", icon: "edit", onClick: () => handleEdit(template) },
                      { label: "Delete", icon: "delete", variant: "danger", onClick: () => setConfirmDelete(template) },
                      { label: template.featured ? "Unfeature" : "Mark Featured", icon: "star", onClick: () => handleToggleFeatured(template) },
                      { label: "Copy Prompt", icon: "content_copy", onClick: () => handleCopyPrompt(template) },
                    ]}
                  />
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="text-sm font-bold text-white truncate flex-1">{template.title}</h3>
                  <Icon name={template.featured ? "star" : "star"} className={template.featured ? "text-yellow-400 shrink-0" : "text-on-surface-variant/30 shrink-0"} size={14} />
                </div>
                <div className="relative">
                  <p
                    className={`text-[11px] text-on-surface-variant leading-relaxed cursor-pointer ${expandedId !== template.id ? "line-clamp-2" : ""}`}
                    onClick={() => toggleExpand(template.id)}
                  >
                    {template.prompt}
                  </p>
                  {template.prompt.length > 80 && (
                    <button
                      onClick={() => toggleExpand(template.id)}
                      className="text-[10px] text-primary hover:text-primary/80 mt-0.5"
                    >
                      {expandedId === template.id ? "Show less" : "Show more"}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary/15 text-primary font-medium border border-primary/20">{template.category}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-400 font-medium border border-cyan-500/20">{template.tool}</span>
                  <StatusBadge status={template.status} />
                </div>
                {copiedId === template.id && (
                  <div className="mt-2 text-[10px] text-green-400 font-medium flex items-center gap-1">
                    <Icon name="check" size={12} /> Copied to clipboard
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-surface-container border border-surface-border/80 rounded-2xl max-w-lg w-full mx-4 animate-dropdown-open" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{editingTemplate ? "Edit Template" : "Add Template"}</h2>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-high hover:bg-surface-container-higher transition-colors">
                  <Icon name="close" className="text-on-surface-variant" size={16} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">Title</label>
                  <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white placeholder:text-on-surface-variant focus:outline-none focus:border-primary/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">Prompt</label>
                  <textarea value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} rows={4} className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white placeholder:text-on-surface-variant focus:outline-none focus:border-primary/50 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">Category</label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50 appearance-none">
                      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">Tool</label>
                    <select value={form.tool} onChange={(e) => setForm({ ...form, tool: e.target.value })} className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50 appearance-none">
                      {tools.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">Status</label>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50 appearance-none">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">Featured</label>
                    <div className="flex items-center gap-3 mt-1.5">
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
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={handleSave} className="flex-1 px-4 py-2 primary-gradient text-white rounded-lg text-xs font-semibold hover:brightness-110 transition-all">
                  {editingTemplate ? "Save Changes" : "Add Template"}
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
        title="Delete Template"
        message={`Are you sure you want to delete "${confirmDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}

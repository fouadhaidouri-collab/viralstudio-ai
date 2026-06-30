"use client";
import { useState, useMemo, useEffect } from "react";
import StatusBadge from "../components/StatusBadge";
import ActionMenu from "../components/ActionMenu";
import ConfirmModal from "../components/ConfirmModal";
import SearchInput from "../components/SearchInput";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import Icon from "../../components/Icon";

export default function HookGeneratorAdmin() {
  const [frameworks, setFrameworks] = useState([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  useEffect(() => {
    fetch("/api/admin/hook-frameworks").then((r) => r.json()).then((d) => setFrameworks(d.data || [])).catch(() => {});
  }, []);

const defaultForm = { name: '', description: '', prompt_template: '', languages: '', status: 'active', example_output: '' };



  const filtered = useMemo(() => {
    if (!search.trim()) return frameworks;
    const q = search.toLowerCase();
    return frameworks.filter(f => f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q));
  }, [search, frameworks]);

  const openAdd = () => {
    setForm(defaultForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (fw) => {
    setForm({ ...fw, languages: fw.languages.join(', ') });
    setEditingId(fw.id);
    setModalOpen(true);
  };

  const handleSave = () => {
    const langs = form.languages.split(',').map(l => l.trim()).filter(Boolean);
    const data = { ...form, languages: langs };
    if (editingId) {
      setFrameworks(prev => prev.map(f => f.id === editingId ? { ...f, ...data } : f));
    } else {
      const newId = `hk_${String(frameworks.length + 1).padStart(3, '0')}`;
      setFrameworks(prev => [...prev, { id: newId, ...data }]);
    }
    setModalOpen(false);
  };

  const toggleStatus = (fw) => {
    setFrameworks(prev => prev.map(f => f.id === fw.id ? { ...f, status: f.status === 'active' ? 'inactive' : 'active' } : f));
    setConfirmOpen(false);
  };

  const exportCSV = () => {
    const headers = ['id,name,description,prompt_template,languages,status,example_output'];
    const rows = frameworks.map(f => `${f.id},"${f.name}","${f.description}","${f.prompt_template}","${f.languages.join(';')}",${f.status},"${f.example_output}"`);
    const csv = [...headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'hooks_frameworks.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const field = (label, key, type = 'text', opts = {}) => (
    <div className="space-y-1.5">
      <label className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider">{label}</label>
      {type === 'textarea' ? (
        <textarea value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} rows={opts.rows || 3} className="w-full bg-surface-container-low border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white placeholder:text-on-surface-variant focus:outline-none focus:border-primary/50 transition-all resize-none" />
      ) : (
        <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={opts.placeholder || ''} className="w-full bg-surface-container-low border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white placeholder:text-on-surface-variant focus:outline-none focus:border-primary/50 transition-all" />
      )}
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in-up">
      <PageHeader
        title="Hook Generator"
        subtitle="Manage hook frameworks for viral content"
        actions={[
          { label: "Export CSV", variant: "default", onClick: exportCSV },
          { label: "Add Framework", variant: "primary", onClick: openAdd, icon: "add" },
        ]}
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Search hooks by name or description..." className="max-w-md" />

      {filtered.length === 0 ? (
        <EmptyState icon="auto_awesome" title="No hook frameworks found" description={search ? "Try a different search term" : "No frameworks available. Add one to get started."} action={search ? undefined : { label: "Add Framework", onClick: openAdd }} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(fw => (
            <div key={fw.id} className="glass-card rounded-xl p-4 card-glow flex flex-col" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.02), transparent)" }}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-bold text-white">{fw.name}</h3>
                <ActionMenu
                  items={[
                    { label: "Edit", icon: "edit", onClick: () => openEdit(fw) },
                    { label: fw.status === 'active' ? "Disable" : "Enable", icon: fw.status === 'active' ? "close" : "check", onClick: () => { setConfirmTarget(fw); setConfirmOpen(true); }},
                    { label: "Export CSV", icon: "download", onClick: exportCSV },
                  ]}
                />
              </div>
              <p className="text-[11px] text-on-surface-variant leading-relaxed mb-3">{fw.description}</p>
              <div className="bg-surface-container-low border border-surface-border/30 rounded-lg p-2.5 mb-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon name="auto_awesome" size={10} className="text-primary" />
                  <span className="text-[9px] text-primary font-medium uppercase tracking-wider">Prompt Template</span>
                </div>
                <p className="text-xs font-mono text-white/80">{fw.prompt_template}</p>
              </div>
              <div className="bg-surface-container-low/50 border-l-2 border-secondary/40 rounded-r-lg p-2.5 mb-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon name="format_quote" size={10} className="text-secondary" />
                  <span className="text-[9px] text-secondary font-medium uppercase tracking-wider">Example</span>
                </div>
                <p className="text-xs text-white/60 italic">"{fw.example_output}"</p>
              </div>
              <div className="flex items-center gap-2 mt-auto pt-3 border-t border-surface-border/20">
                <div className="flex flex-wrap gap-1 flex-1">
                  {fw.languages.map(lang => (
                    <span key={lang} className="px-1.5 py-0.5 bg-primary/10 border border-primary/20 rounded text-[9px] font-medium text-primary uppercase">{lang}</span>
                  ))}
                </div>
                <StatusBadge status={fw.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)}>
          <div className="max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
            <div className="glass-card rounded-2xl p-5 card-glow" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.02), transparent)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">{editingId ? "Edit Framework" : "Add Framework"}</h3>
                <button onClick={() => setModalOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container-high border border-surface-border/50 hover:bg-surface-container-higher transition-all">
                  <Icon name="close" className="text-on-surface-variant" size={14} />
                </button>
              </div>
              <div className="space-y-3">
                {field("Name", "name", "text", { placeholder: "e.g. Pattern Interrupt" })}
                {field("Description", "description", "text", { placeholder: "Describe the hook framework..." })}
                {field("Prompt Template", "prompt_template", "text", { placeholder: "e.g. Most people think X, but the truth is..." })}
                {field("Languages", "languages", "text", { placeholder: "en, ar, fr (comma separated)" })}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full bg-surface-container-low border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50 transition-all">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                {field("Example Output", "example_output", "textarea", { rows: 3, placeholder: "Example of the hook in action..." })}
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setModalOpen(false)} className="flex-1 px-3 py-2 bg-surface-container-high border border-surface-border rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container-higher transition-all">Cancel</button>
                <button onClick={handleSave} className="flex-1 px-3 py-2 primary-gradient text-white rounded-lg text-xs font-semibold hover:brightness-110 transition-all">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => toggleStatus(confirmTarget)}
        title={confirmTarget?.status === 'active' ? "Disable Framework" : "Enable Framework"}
        message={`Are you sure you want to ${confirmTarget?.status === 'active' ? 'disable' : 'enable'} "${confirmTarget?.name}"?`}
        confirmLabel={confirmTarget?.status === 'active' ? "Disable" : "Enable"}
        confirmVariant={confirmTarget?.status === 'active' ? "danger" : "primary"}
      />
    </div>
  );
}

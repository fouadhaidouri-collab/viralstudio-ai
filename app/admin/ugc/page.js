"use client";
import { useState, useMemo, useEffect } from "react";
import StatusBadge from "../components/StatusBadge";
import ActionMenu from "../components/ActionMenu";
import ConfirmModal from "../components/ConfirmModal";
import SearchInput from "../components/SearchInput";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import Icon from "../../components/Icon";

export default function UGCPage() {
  const [avatars, setAvatars] = useState([]);
  const [voices, setVoices] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [presets, setPresets] = useState([]);
  const [addModal, setAddModal] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [addForm, setAddForm] = useState({});
  useEffect(() => {
    fetch("/api/admin/ugc").then((r) => r.json()).then((d) => {
      setAvatars(d.avatars || []);
      setVoices(d.voices || []);
      setTemplates(d.templates || []);
      setPresets(d.presets || []);
    }).catch(() => {});
  }, []);

function UGCDataTable({ items, columns, onAction }) {
  if (items.length === 0) {
    return <EmptyState icon="inbox" title="No items" description="This section is empty." />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-surface-border/50 text-on-surface-variant text-[10px] uppercase tracking-wider">
            {columns.map((col) => (
              <th key={col.key} className={`text-left px-3 py-2.5 font-medium ${col.width || ""}`}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-surface-border/20 hover:bg-surface-container-low transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="px-3 py-2.5">{col.render ? col.render(item) : <span className="text-white">{item[col.key]}</span>}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}



  function toggleStatus(items, setItems, id) {
    setItems(items.map((i) => i.id === id ? { ...i, status: i.status === "active" ? "inactive" : "active" } : i));
  }

  function handleAdd() {
    if (!addModal || !addForm.name) return;
    const newItem = { id: `${addModal}_${Date.now()}`, ...addForm, status: "active" };
    if (addModal === "avatar") setAvatars([...avatars, newItem]);
    else if (addModal === "voice") setVoices([...voices, newItem]);
    else if (addModal === "template") setTemplates([...templates, newItem]);
    else if (addModal === "preset") setPresets([...presets, newItem]);
    setAddModal(null);
    setAddForm({});
  }

  const avatarColumns = [
    { key: "name", label: "Name" },
    { key: "style", label: "Style", render: (item) => <span className="text-on-surface-variant capitalize">{item.style}</span> },
    { key: "status", label: "Status", render: (item) => <StatusBadge status={item.status} /> },
    { key: "actions", label: "Actions", render: (item) => (
      <ActionMenu items={[
        { label: "Edit", icon: "edit", onClick: () => {} },
        { label: item.status === "active" ? "Disable" : "Enable", icon: item.status === "active" ? "close" : "check", variant: item.status === "active" ? "danger" : "success", onClick: () => toggleStatus(avatars, setAvatars, item.id) },
      ]} />
    )},
  ];

  const voiceColumns = [
    { key: "name", label: "Name" },
    { key: "gender", label: "Gender", render: (item) => <span className="text-on-surface-variant capitalize">{item.gender}</span> },
    { key: "accent", label: "Accent", render: (item) => <span className="text-on-surface-variant">{item.accent}</span> },
    { key: "status", label: "Status", render: (item) => <StatusBadge status={item.status} /> },
    { key: "actions", label: "Actions", render: (item) => (
      <ActionMenu items={[
        { label: "Edit", icon: "edit", onClick: () => {} },
        { label: item.status === "active" ? "Disable" : "Enable", icon: item.status === "active" ? "close" : "check", variant: item.status === "active" ? "danger" : "success", onClick: () => toggleStatus(voices, setVoices, item.id) },
      ]} />
    )},
  ];

  const templateColumns = [
    { key: "name", label: "Name" },
    { key: "target_audience", label: "Target Audience", render: (item) => <span className="text-on-surface-variant">{item.target_audience}</span> },
    { key: "offer", label: "Offer", render: (item) => <span className="text-on-surface-variant">{item.offer}</span> },
    { key: "status", label: "Status", render: (item) => <StatusBadge status={item.status} /> },
    { key: "actions", label: "Actions", render: (item) => (
      <ActionMenu items={[
        { label: "Edit", icon: "edit", onClick: () => {} },
        { label: item.status === "active" ? "Disable" : "Enable", icon: item.status === "active" ? "close" : "check", variant: item.status === "active" ? "danger" : "success", onClick: () => toggleStatus(templates, setTemplates, item.id) },
      ]} />
    )},
  ];

  const presetColumns = [
    { key: "name", label: "Name" },
    { key: "resolution", label: "Resolution", render: (item) => <span className="text-on-surface-variant">{item.resolution}</span> },
    { key: "format", label: "Format", render: (item) => <span className="text-on-surface-variant">{item.format}</span> },
    { key: "status", label: "Status", render: (item) => <StatusBadge status={item.status} /> },
    { key: "actions", label: "Actions", render: (item) => (
      <ActionMenu items={[
        { label: "Edit", icon: "edit", onClick: () => {} },
        { label: item.status === "active" ? "Disable" : "Enable", icon: item.status === "active" ? "close" : "check", variant: item.status === "active" ? "danger" : "success", onClick: () => toggleStatus(presets, setPresets, item.id) },
      ]} />
    )},
  ];

  const sectionClass = "glass-card rounded-xl overflow-hidden card-glow animate-fade-in-up";
  const sectionBg = { background: "linear-gradient(135deg, rgba(255,255,255,0.02), transparent)" };
  const sectionHeaderClass = "flex items-center justify-between px-4 py-3 border-b border-surface-border/30";

  const addFormFields = {
    avatar: [
      { key: "name", label: "Avatar Name", type: "text" },
      { key: "style", label: "Style", type: "select", options: ["realistic", "studio", "animated"] },
    ],
    voice: [
      { key: "name", label: "Voice Name", type: "text" },
      { key: "gender", label: "Gender", type: "select", options: ["male", "female"] },
      { key: "accent", label: "Accent", type: "select", options: ["US", "UK", "AU", "IN"] },
    ],
    template: [
      { key: "name", label: "Template Name", type: "text" },
      { key: "target_audience", label: "Target Audience", type: "text" },
      { key: "offer", label: "Offer", type: "text" },
    ],
    preset: [
      { key: "name", label: "Preset Name", type: "text" },
      { key: "resolution", label: "Resolution", type: "select", options: ["720p", "1080p", "4K"] },
      { key: "format", label: "Format", type: "select", options: ["MP4", "MOV", "AVI"] },
    ],
  };

  const addModalTitles = { avatar: "Add Avatar", voice: "Add Voice", template: "Add Template", preset: "Add Export Preset" };

  return (
    <div className="space-y-5">
      <PageHeader title="UGC Engine" subtitle="Manage avatar styles, voices, templates, and presets" />

      <div className={sectionClass} style={sectionBg}>
        <div className={sectionHeaderClass}>
          <div className="flex items-center gap-2">
            <Icon name="person" className="text-primary" size={14} />
            <h3 className="text-xs font-semibold text-white">Avatars</h3>
            <span className="text-[10px] text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-md">{avatars.length}</span>
          </div>
          <button onClick={() => { setAddForm({}); setAddModal("avatar"); }} className="px-3 py-1.5 primary-gradient text-white rounded-lg text-[10px] font-semibold hover:brightness-110 transition-all">
            <Icon name="add" size={12} className="inline mr-1" />Add
          </button>
        </div>
        <UGCDataTable items={avatars} columns={avatarColumns} />
      </div>

      <div className={sectionClass} style={sectionBg}>
        <div className={sectionHeaderClass}>
          <div className="flex items-center gap-2">
            <Icon name="record_voice_over" className="text-secondary" size={14} />
            <h3 className="text-xs font-semibold text-white">Voices</h3>
            <span className="text-[10px] text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-md">{voices.length}</span>
          </div>
          <button onClick={() => { setAddForm({}); setAddModal("voice"); }} className="px-3 py-1.5 primary-gradient text-white rounded-lg text-[10px] font-semibold hover:brightness-110 transition-all">
            <Icon name="add" size={12} className="inline mr-1" />Add
          </button>
        </div>
        <UGCDataTable items={voices} columns={voiceColumns} />
      </div>

      <div className={sectionClass} style={sectionBg}>
        <div className={sectionHeaderClass}>
          <div className="flex items-center gap-2">
            <Icon name="description" className="text-accent-orange" size={14} />
            <h3 className="text-xs font-semibold text-white">UGC Templates</h3>
            <span className="text-[10px] text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-md">{templates.length}</span>
          </div>
          <button onClick={() => { setAddForm({}); setAddModal("template"); }} className="px-3 py-1.5 primary-gradient text-white rounded-lg text-[10px] font-semibold hover:brightness-110 transition-all">
            <Icon name="add" size={12} className="inline mr-1" />Add
          </button>
        </div>
        <UGCDataTable items={templates} columns={templateColumns} />
      </div>

      <div className={sectionClass} style={sectionBg}>
        <div className={sectionHeaderClass}>
          <div className="flex items-center gap-2">
            <Icon name="settings" className="text-accent-cyan" size={14} />
            <h3 className="text-xs font-semibold text-white">Export Presets</h3>
            <span className="text-[10px] text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-md">{presets.length}</span>
          </div>
          <button onClick={() => { setAddForm({}); setAddModal("preset"); }} className="px-3 py-1.5 primary-gradient text-white rounded-lg text-[10px] font-semibold hover:brightness-110 transition-all">
            <Icon name="add" size={12} className="inline mr-1" />Add
          </button>
        </div>
        <UGCDataTable items={presets} columns={presetColumns} />
      </div>

      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setAddModal(null)}>
          <div className="bg-surface-container border border-surface-border/80 rounded-2xl max-w-sm w-full mx-4 animate-dropdown-open" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h3 className="text-sm font-bold text-white">{addModalTitles[addModal]}</h3>
              <button onClick={() => setAddModal(null)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container-high border border-surface-border/50 hover:bg-surface-container-higher transition-all">
                <Icon name="close" className="text-on-surface-variant" size={14} />
              </button>
            </div>
            <div className="px-5 pb-5 space-y-3">
              {addFormFields[addModal].map((field) => (
                <div key={field.key} className="space-y-1">
                  <label className="text-[10px] text-on-surface-variant uppercase tracking-wider">{field.label}</label>
                  {field.type === "select" ? (
                    <select value={addForm[field.key] || ""} onChange={(e) => setAddForm({ ...addForm, [field.key]: e.target.value })} className="w-full bg-surface-container-lowest border border-surface-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50 transition-all">
                      <option value="">Select...</option>
                      {field.options.map((opt) => (
                        <option key={opt} value={opt} className="capitalize">{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input type="text" value={addForm[field.key] || ""} onChange={(e) => setAddForm({ ...addForm, [field.key]: e.target.value })} placeholder={`Enter ${field.label.toLowerCase()}`} className="w-full bg-surface-container-lowest border border-surface-border rounded-lg px-3 py-2 text-xs text-white placeholder:text-on-surface-variant focus:outline-none focus:border-primary/50 transition-all" />
                  )}
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setAddModal(null)} className="flex-1 px-3 py-2 bg-surface-container-high border border-surface-border rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container-higher transition-all">Cancel</button>
                <button onClick={handleAdd} disabled={!addForm.name} className="flex-1 px-3 py-2 primary-gradient text-white rounded-lg text-xs font-semibold hover:brightness-110 transition-all disabled:opacity-50">Add</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

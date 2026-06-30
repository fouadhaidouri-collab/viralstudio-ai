"use client";

import { useState, useMemo, useEffect } from "react";
import StatusBadge from "../components/StatusBadge";
import ActionMenu from "../components/ActionMenu";
import ConfirmModal from "../components/ConfirmModal";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import Icon from "../../components/Icon";

const allTools = ["AI Video", "Image Lab", "Chat AI", "UGC Engine", "Hook Gen", "Clipping"];

const emptyPlan = {
  id: "", name: "", monthly_price: 0, yearly_price: 0, credits_included: 0,
  max_video_generations: 0, max_image_generations: 0, max_clipping_jobs: 0,
  max_ugc_ads: 0, max_chat_messages: 0, allowed_tools: [],
  watermark: false, priority_processing: false, status: "active",
};

export default function AdminPlansPage() {
  const [plans, setPlans] = useState([]);
  useEffect(() => {
    fetch("/api/admin/plans").then((r) => r.json()).then((d) => setPlans(d.data || [])).catch(() => {});
  }, []);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [form, setForm] = useState(emptyPlan);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmToggle, setConfirmToggle] = useState(null);
  const [showPriceModal, setShowPriceModal] = useState(null);
  const [priceInput, setPriceInput] = useState({ monthly: "", yearly: "" });
  const [showCreditsModal, setShowCreditsModal] = useState(null);
  const [creditsInput, setCreditsInput] = useState("");

  const handleAdd = () => {
    setEditingPlan(null);
    setForm(emptyPlan);
    setShowModal(true);
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setForm({ ...plan });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingPlan) {
      setPlans(plans.map((p) => (p.id === editingPlan.id ? { ...form } : p)));
    } else {
      setPlans([{ ...form, id: "plan_" + Date.now(), created_at: new Date().toISOString() }, ...plans]);
    }
    setShowModal(false);
  };

  const handleToggleStatus = () => {
    if (confirmToggle) {
      setPlans(plans.map((p) => p.id === confirmToggle.id ? { ...p, status: p.status === "active" ? "inactive" : "active" } : p));
      setConfirmToggle(null);
    }
  };

  const handleDelete = () => {
    if (confirmDelete) {
      setPlans(plans.filter((p) => p.id !== confirmDelete.id));
      setConfirmDelete(null);
    }
  };

  const handlePriceSave = () => {
    if (showPriceModal) {
      const m = parseInt(priceInput.monthly);
      const y = parseInt(priceInput.yearly);
      setPlans(plans.map((p) => p.id === showPriceModal.id ? { ...p, monthly_price: isNaN(m) ? p.monthly_price : m, yearly_price: isNaN(y) ? p.yearly_price : y } : p));
      setShowPriceModal(null);
      setPriceInput({ monthly: "", yearly: "" });
    }
  };

  const handleCreditsSave = () => {
    if (showCreditsModal) {
      const val = parseInt(creditsInput);
      setPlans(plans.map((p) => p.id === showCreditsModal.id ? { ...p, credits_included: isNaN(val) ? p.credits_included : val } : p));
      setShowCreditsModal(null);
      setCreditsInput("");
    }
  };

  const openPriceModal = (plan) => {
    setPriceInput({ monthly: String(plan.monthly_price), yearly: String(plan.yearly_price) });
    setShowPriceModal(plan);
  };

  const openCreditsModal = (plan) => {
    setCreditsInput(String(plan.credits_included));
    setShowCreditsModal(plan);
  };

  const toggleTool = (tool) => {
    const current = form.allowed_tools || [];
    const updated = current.includes(tool)
      ? current.filter((t) => t !== tool)
      : [...current, tool];
    setForm({ ...form, allowed_tools: updated });
  };

  const AgencyPlanModal = ({ plan, onClose, onConfirm }) => {
    if (!plan) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-surface-container border border-surface-border/80 rounded-2xl max-w-sm w-full mx-4 animate-dropdown-open" onClick={(e) => e.stopPropagation()}>
          <div className="p-5">
            <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
              <Icon name="bolt" className="text-secondary" size={22} />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">{plan.status === "active" ? "Disable Plan" : "Enable Plan"}</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Are you sure you want to {plan.status === "active" ? "disable" : "enable"} the "{plan.name}" plan?
              {plan.status === "active" ? " Users on this plan may be affected." : ""}
            </p>
          </div>
          <div className="flex gap-2 px-5 pb-5">
            <button onClick={onClose} className="flex-1 px-3 py-2 bg-surface-container-high border border-surface-border rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container-higher transition-all">
              Cancel
            </button>
            <button onClick={onConfirm} className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${plan.status === "active" ? "bg-error/20 text-error border border-error/30 hover:bg-error/30" : "primary-gradient text-white"}`}>
              {plan.status === "active" ? "Disable" : "Enable"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const PriceModal = ({ plan, onClose, onSave }) => {
    if (!plan) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-surface-container border border-surface-border/80 rounded-2xl max-w-sm w-full mx-4 animate-dropdown-open" onClick={(e) => e.stopPropagation()}>
          <div className="p-5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
              <Icon name="credit_card" className="text-amber-400" size={22} />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Change Price - {plan.name}</h3>
            <div className="space-y-3 mt-4">
              <div>
                <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">Monthly Price ($)</label>
                <input type="number" value={priceInput.monthly} onChange={(e) => setPriceInput({ ...priceInput, monthly: e.target.value })} className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">Yearly Price ($)</label>
                <input type="number" value={priceInput.yearly} onChange={(e) => setPriceInput({ ...priceInput, yearly: e.target.value })} className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" />
              </div>
            </div>
          </div>
          <div className="flex gap-2 px-5 pb-5">
            <button onClick={onClose} className="flex-1 px-3 py-2 bg-surface-container-high border border-surface-border rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container-higher transition-all">
              Cancel
            </button>
            <button onClick={onSave} className="flex-1 px-3 py-2 primary-gradient text-white rounded-lg text-xs font-semibold hover:brightness-110 transition-all">
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  const CreditsModal = ({ plan, onClose, onSave }) => {
    if (!plan) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-surface-container border border-surface-border/80 rounded-2xl max-w-sm w-full mx-4 animate-dropdown-open" onClick={(e) => e.stopPropagation()}>
          <div className="p-5">
            <div className="w-11 h-11 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-4">
              <Icon name="bolt" className="text-yellow-400" size={22} />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Change Credits - {plan.name}</h3>
            <div className="space-y-3 mt-4">
              <div>
                <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">Credits Included</label>
                <input type="number" value={creditsInput} onChange={(e) => setCreditsInput(e.target.value)} className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" />
              </div>
            </div>
          </div>
          <div className="flex gap-2 px-5 pb-5">
            <button onClick={onClose} className="flex-1 px-3 py-2 bg-surface-container-high border border-surface-border rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container-higher transition-all">
              Cancel
            </button>
            <button onClick={onSave} className="flex-1 px-3 py-2 primary-gradient text-white rounded-lg text-xs font-semibold hover:brightness-110 transition-all">
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-full bg-background text-white p-6">
      <PageHeader
        title="Plans & Pricing"
        subtitle="Manage subscription plans and features"
        breadcrumbs={[{ label: "Admin" }, { label: "Plans" }]}
        actions={[
          { label: "Create Plan", variant: "primary", icon: "add", onClick: handleAdd },
        ]}
      />

      {plans.length === 0 ? (
        <EmptyState icon="credit_card" title="No plans found" description="There are no subscription plans yet. Create your first plan to get started." action={{ label: "Create Plan", onClick: handleAdd }} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {plans.map((plan) => (
            <div key={plan.id} className={`glass-card rounded-xl overflow-hidden ${plan.name === "Agency" ? "card-glow" : ""} glass-card-hover`}>
              <div className={`p-5 ${plan.name === "Agency" ? "bg-gradient-to-r from-purple-600/10 to-cyan-600/5" : ""}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className={`text-lg font-bold ${plan.name === "Agency" ? "bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent" : "text-white"}`}>
                      {plan.name}
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">{plan.id}</p>
                  </div>
                  <ActionMenu
                    items={[
                      { label: "Edit", icon: "edit", onClick: () => handleEdit(plan) },
                      { label: plan.status === "active" ? "Disable" : "Enable", icon: plan.status === "active" ? "close" : "check", onClick: () => setConfirmToggle(plan) },
                      { label: "Change Price", icon: "credit_card", onClick: () => openPriceModal(plan) },
                      { label: "Change Credits", icon: "bolt", onClick: () => openCreditsModal(plan) },
                      { label: "Delete", icon: "delete", variant: "danger", onClick: () => setConfirmDelete(plan) },
                    ]}
                  />
                </div>

                <div className="flex items-end gap-4 mb-4">
                  <div>
                    <span className="text-3xl font-bold text-white">${plan.monthly_price}</span>
                    <span className="text-xs text-on-surface-variant ml-1">/mo</span>
                  </div>
                  <div>
                    <span className="text-lg font-semibold text-on-surface-variant">${plan.yearly_price}</span>
                    <span className="text-[10px] text-on-surface-variant ml-1">/yr</span>
                  </div>
                  <div className="ml-auto">
                    <StatusBadge status={plan.status} />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mb-4 bg-surface-container-high rounded-lg px-3 py-2">
                  <Icon name="bolt" className="text-yellow-400 shrink-0" size={16} />
                  <span className="text-sm font-bold text-yellow-400">{plan.credits_included.toLocaleString()}</span>
                  <span className="text-xs text-on-surface-variant">credits included</span>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Icon name={plan.max_video_generations > 0 ? "check" : "close"} className={plan.max_video_generations > 0 ? "text-green-400 shrink-0" : "text-on-surface-variant/50 shrink-0"} size={14} />
                    <span className="text-on-surface-variant">Video: <span className="text-white">{plan.max_video_generations}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name={plan.max_image_generations > 0 ? "check" : "close"} className={plan.max_image_generations > 0 ? "text-green-400 shrink-0" : "text-on-surface-variant/50 shrink-0"} size={14} />
                    <span className="text-on-surface-variant">Images: <span className="text-white">{plan.max_image_generations}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name={plan.max_clipping_jobs > 0 ? "check" : "close"} className={plan.max_clipping_jobs > 0 ? "text-green-400 shrink-0" : "text-on-surface-variant/50 shrink-0"} size={14} />
                    <span className="text-on-surface-variant">Clipping: <span className="text-white">{plan.max_clipping_jobs}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name={plan.max_ugc_ads > 0 ? "check" : "close"} className={plan.max_ugc_ads > 0 ? "text-green-400 shrink-0" : "text-on-surface-variant/50 shrink-0"} size={14} />
                    <span className="text-on-surface-variant">UGC Ads: <span className="text-white">{plan.max_ugc_ads}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name={plan.max_chat_messages > 0 ? "check" : "close"} className={plan.max_chat_messages > 0 ? "text-green-400 shrink-0" : "text-on-surface-variant/50 shrink-0"} size={14} />
                    <span className="text-on-surface-variant">Chat: <span className="text-white">{plan.max_chat_messages}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name={plan.watermark ? "check" : "close"} className={plan.watermark ? "text-red-400 shrink-0" : "text-green-400 shrink-0"} size={14} />
                    <span className="text-on-surface-variant">Watermark: <span className="text-white">{plan.watermark ? "Yes" : "No"}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name={plan.priority_processing ? "check" : "close"} className={plan.priority_processing ? "text-green-400 shrink-0" : "text-on-surface-variant/50 shrink-0"} size={14} />
                    <span className="text-on-surface-variant">Priority: <span className="text-white">{plan.priority_processing ? "Yes" : "No"}</span></span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-surface-border/30">
                  <p className="text-[10px] text-on-surface-variant font-medium mb-1.5">Allowed Tools</p>
                  <div className="flex flex-wrap gap-1.5">
                    {plan.allowed_tools.map((tool) => (
                      <span key={tool} className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 font-medium">{tool}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-surface-container border border-surface-border/80 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto mx-4 animate-dropdown-open" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{editingPlan ? "Edit Plan" : "Create Plan"}</h2>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-high hover:bg-surface-container-higher transition-colors">
                  <Icon name="close" className="text-on-surface-variant" size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">Plan Name</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50 appearance-none">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">Monthly Price ($)</label>
                  <input type="number" value={form.monthly_price} onChange={(e) => setForm({ ...form, monthly_price: parseInt(e.target.value) || 0 })} className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">Yearly Price ($)</label>
                  <input type="number" value={form.yearly_price} onChange={(e) => setForm({ ...form, yearly_price: parseInt(e.target.value) || 0 })} className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">Credits Included</label>
                  <input type="number" value={form.credits_included} onChange={(e) => setForm({ ...form, credits_included: parseInt(e.target.value) || 0 })} className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-yellow-400 focus:outline-none focus:border-primary/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">Watermark</label>
                  <div className="flex items-center gap-3 mt-1.5">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="watermark" checked={form.watermark === true} onChange={() => setForm({ ...form, watermark: true })} className="accent-primary" />
                      <span className="text-xs text-white">Yes</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="watermark" checked={form.watermark === false} onChange={() => setForm({ ...form, watermark: false })} className="accent-primary" />
                      <span className="text-xs text-white">No</span>
                    </label>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">Priority Processing</label>
                  <div className="flex items-center gap-3 mt-1.5">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="priority" checked={form.priority_processing === true} onChange={() => setForm({ ...form, priority_processing: true })} className="accent-primary" />
                      <span className="text-xs text-white">Yes</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="priority" checked={form.priority_processing === false} onChange={() => setForm({ ...form, priority_processing: false })} className="accent-primary" />
                      <span className="text-xs text-white">No</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">Max Video Generations</label>
                  <input type="number" value={form.max_video_generations} onChange={(e) => setForm({ ...form, max_video_generations: parseInt(e.target.value) || 0 })} className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">Max Image Generations</label>
                  <input type="number" value={form.max_image_generations} onChange={(e) => setForm({ ...form, max_image_generations: parseInt(e.target.value) || 0 })} className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">Max Clipping Jobs</label>
                  <input type="number" value={form.max_clipping_jobs} onChange={(e) => setForm({ ...form, max_clipping_jobs: parseInt(e.target.value) || 0 })} className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">Max UGC Ads</label>
                  <input type="number" value={form.max_ugc_ads} onChange={(e) => setForm({ ...form, max_ugc_ads: parseInt(e.target.value) || 0 })} className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">Max Chat Messages</label>
                  <input type="number" value={form.max_chat_messages} onChange={(e) => setForm({ ...form, max_chat_messages: parseInt(e.target.value) || 0 })} className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-medium text-on-surface-variant mb-1 block">Allowed Tools</label>
                <div className="flex flex-wrap gap-2">
                  {allTools.map((tool) => (
                    <button
                      key={tool}
                      onClick={() => toggleTool(tool)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-semibold border transition-all ${
                        (form.allowed_tools || []).includes(tool)
                          ? "border-primary/40 bg-primary/20 text-primary"
                          : "border-surface-border/50 bg-surface-container-high text-on-surface-variant hover:bg-surface-container-higher"
                      }`}
                    >
                      {tool}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={handleSave} className="flex-1 px-4 py-2 primary-gradient text-white rounded-lg text-xs font-semibold hover:brightness-110 transition-all">
                  {editingPlan ? "Save Changes" : "Create Plan"}
                </button>
                <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-surface-container-high border border-surface-border rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container-higher transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AgencyPlanModal plan={confirmToggle} onClose={() => setConfirmToggle(null)} onConfirm={handleToggleStatus} />

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Plan"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
      />

      <PriceModal plan={showPriceModal} onClose={() => setShowPriceModal(null)} onSave={handlePriceSave} />

      <CreditsModal plan={showCreditsModal} onClose={() => setShowCreditsModal(null)} onSave={handleCreditsSave} />
    </div>
  );
}

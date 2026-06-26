"use client";

import { useState, useEffect } from "react";

export default function AdminModulesPage() {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ endpoint_id: "", display_name: "" });
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);
  const [adding, setAdding] = useState(false);

  const loadModules = () => {
    fetch("/api/admin/modules")
      .then((r) => r.json())
      .then((data) => {
        if (data.modules) setModules(data.modules);
      })
      .catch(() => {});
  };

  useEffect(() => { loadModules(); }, []);

  const handleAdd = async () => {
    if (!addForm.endpoint_id.trim() || !addForm.display_name.trim()) return;
    setAdding(true);
    setSyncMsg(null);
    try {
      const res = await fetch("/api/admin/modules/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (data.success) {
        setSyncMsg(`Module "${addForm.display_name}" added and synced`);
        setAddForm({ endpoint_id: "", display_name: "" });
        setShowAdd(false);
        loadModules();
      } else {
        setSyncMsg(data.error || "Failed to add");
      }
    } catch {
      setSyncMsg("Failed to add module");
    } finally {
      setAdding(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch("/api/admin/modules/sync-all", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSyncMsg(`Sync complete: ${data.schema_changed} schema changed, ${data.price_changed} price changed, ${data.failed} failed`);
        loadModules();
      } else {
        setSyncMsg(data.error || "Sync failed");
      }
    } catch {
      setSyncMsg("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncOne = async (moduleId) => {
    try {
      const res = await fetch(`/api/admin/modules/${moduleId}/sync`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSyncMsg(`Module ${moduleId} synced`);
        loadModules();
      } else {
        setSyncMsg(data.error || "Sync failed");
      }
    } catch {
      setSyncMsg("Sync failed");
    }
  };

  const toggleEnabled = async (mod) => {
    try {
      await fetch(`/api/admin/modules/${mod.module_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !mod.status === "enabled" }),
      });
      loadModules();
    } catch {}
  };

  const viewModule = async (mod) => {
    try {
      const res = await fetch(`/api/admin/modules/${mod.module_id}`);
      const data = await res.json();
      setSelectedModule(data.module || data);
    } catch {}
  };

  return (
    <div className="min-h-full bg-background text-white p-8" style={{ fontFamily: "Geist, sans-serif" }}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AI Modules</h1>
            <p className="text-sm text-on-surface-variant mt-1">Manage fal.ai modules, sync schema and pricing</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(true)} className="px-4 py-2 primary-gradient text-white rounded-lg text-sm font-semibold hover:brightness-110 transition-all">
              + Add Module
            </button>
            <button onClick={handleSyncAll} disabled={syncing} className="px-4 py-2 bg-surface-container-high border border-surface-border rounded-lg text-sm font-medium hover:bg-surface-container-higher transition-all disabled:opacity-50">
              {syncing ? "Syncing..." : "Sync All"}
            </button>
          </div>
        </div>

        {syncMsg && (
          <div className="text-xs px-3 py-2 bg-surface-container-high border border-surface-border rounded-lg text-on-surface-variant">
            {syncMsg}
          </div>
        )}

        {showAdd && (
          <div className="bg-surface-container-low border border-surface-border rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold">Add New Module</h2>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={addForm.endpoint_id}
                onChange={(e) => setAddForm({ ...addForm, endpoint_id: e.target.value })}
                placeholder="fal-ai/model-name"
                className="w-full bg-surface-container-lowest border border-surface-border rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
              <input
                type="text"
                value={addForm.display_name}
                onChange={(e) => setAddForm({ ...addForm, display_name: e.target.value })}
                placeholder="Display Name"
                className="w-full bg-surface-container-lowest border border-surface-border rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} disabled={adding} className="px-4 py-2 primary-gradient text-white rounded-lg text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50">
                {adding ? "Adding..." : "Add & Sync"}
              </button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-surface-container-high border border-surface-border rounded-lg text-sm hover:bg-surface-container-higher transition-all">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="bg-surface-container-low border border-surface-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-container-higher/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Module</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Endpoint</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Price</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Credits</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Actions</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((mod) => (
                  <tr key={mod.module_id} className="border-b border-surface-border/50 hover:bg-surface-container-high/30 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => viewModule({ module_id: mod.module_id })} className="text-primary hover:underline font-medium text-left">
                        {mod.display_name}
                      </button>
                      <div className="text-xs text-on-surface-variant">{mod.category}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant font-mono">{mod.endpoint_id}</td>
                    <td className="px-4 py-3">
                      {mod.pricing_unavailable ? (
                        <span className="text-yellow-400 text-xs">Unavailable</span>
                      ) : mod.unit_price != null ? (
                        <span className="text-xs">${mod.unit_price}/{mod.unit || "unit"}</span>
                      ) : (
                        <span className="text-on-surface-variant text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {mod.estimated_credits != null ? (
                        <span className="text-yellow-400 text-xs font-medium">{mod.estimated_credits} cr</span>
                      ) : (
                        <span className="text-on-surface-variant text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs ${mod.status === "enabled" ? "text-green-400" : "text-on-surface-variant"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${mod.status === "enabled" ? "bg-green-400" : "bg-on-surface-variant"}`} />
                        {mod.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => handleSyncOne(mod.module_id)} className="px-2 py-1 bg-surface-container-high border border-surface-border rounded text-xs hover:bg-surface-container-higher transition-colors">
                          Sync
                        </button>
                        <button onClick={() => toggleEnabled(mod)} className="px-2 py-1 bg-surface-container-high border border-surface-border rounded text-xs hover:bg-surface-container-higher transition-colors">
                          {mod.status === "enabled" ? "Disable" : "Enable"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {modules.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-on-surface-variant text-sm">
                      No modules added yet. Click "+ Add Module" to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedModule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setSelectedModule(null)}>
            <div className="bg-surface-container border border-surface-border rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">{selectedModule.display_name}</h2>
                  <button onClick={() => setSelectedModule(null)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-high hover:bg-surface-container-higher transition-colors">
                    <span className="text-lg">✕</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="bg-surface-container-low rounded-lg p-3">
                    <span className="text-on-surface-variant">Endpoint</span>
                    <div className="font-mono mt-1 break-all">{selectedModule.endpoint_id}</div>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-3">
                    <span className="text-on-surface-variant">Provider</span>
                    <div className="mt-1">{selectedModule.provider || "fal.ai"}</div>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-3">
                    <span className="text-on-surface-variant">Category</span>
                    <div className="mt-1">{selectedModule.fal_metadata?.category || "—"}</div>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-3">
                    <span className="text-on-surface-variant">Status</span>
                    <div className="mt-1">{selectedModule.fal_metadata?.status || "active"}</div>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-3">
                    <span className="text-on-surface-variant">Unit Price</span>
                    <div className="mt-1">
                      {selectedModule.fal_pricing?.unit_price != null
                        ? `$${selectedModule.fal_pricing.unit_price}`
                        : selectedModule.fal_pricing?.pricing_unavailable
                          ? "Unavailable"
                          : "—"}
                      {selectedModule.fal_pricing?.unit ? ` / ${selectedModule.fal_pricing.unit}` : ""}
                    </div>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-3">
                    <span className="text-on-surface-variant">Estimated Credits</span>
                    <div className="mt-1 text-yellow-400 font-medium">
                      {selectedModule.credit_pricing?.estimated_credits != null
                        ? `${selectedModule.credit_pricing.estimated_credits} cr`
                        : "—"}
                    </div>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-3">
                    <span className="text-on-surface-variant">Schema Hash</span>
                    <div className="font-mono mt-1 text-on-surface-variant">{selectedModule.fal_schema?.schema_hash || "—"}</div>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-3">
                    <span className="text-on-surface-variant">Price Hash</span>
                    <div className="font-mono mt-1 text-on-surface-variant">{selectedModule.fal_pricing?.price_hash || "—"}</div>
                  </div>
                </div>

                {selectedModule.fal_metadata?.description && (
                  <div className="bg-surface-container-low rounded-lg p-3 text-xs">
                    <span className="text-on-surface-variant">Description</span>
                    <p className="mt-1">{selectedModule.fal_metadata.description}</p>
                  </div>
                )}

                {selectedModule.fal_schema?.fields?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Schema Fields ({selectedModule.fal_schema.fields.length})</h3>
                    <div className="bg-surface-container-low rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-surface-border">
                            <th className="text-left px-3 py-2 text-on-surface-variant">Field</th>
                            <th className="text-left px-3 py-2 text-on-surface-variant">Type</th>
                            <th className="text-left px-3 py-2 text-on-surface-variant">Required</th>
                            <th className="text-left px-3 py-2 text-on-surface-variant">Default</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedModule.fal_schema.fields.map((f) => (
                            <tr key={f.name} className="border-b border-surface-border/30">
                              <td className="px-3 py-2 font-mono">{f.name}</td>
                              <td className="px-3 py-2 text-on-surface-variant">{f.type}</td>
                              <td className="px-3 py-2">{f.required ? <span className="text-green-400">Yes</span> : <span className="text-on-surface-variant">No</span>}</td>
                              <td className="px-3 py-2 text-on-surface-variant">{f.default != null ? String(f.default) : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {selectedModule.business_config && (
                  <div className="text-xs text-on-surface-variant bg-surface-container-low rounded-lg p-3">
                    <span className="font-semibold text-white">Business Config</span>
                    <pre className="mt-1 overflow-x-auto">{JSON.stringify(selectedModule.business_config, null, 2)}</pre>
                  </div>
                )}

                {selectedModule.fal_pricing && (
                  <div className="text-xs text-on-surface-variant bg-surface-container-low rounded-lg p-3">
                    <span className="font-semibold text-white">Credit Pricing</span>
                    <pre className="mt-1 overflow-x-auto">{JSON.stringify(selectedModule.credit_pricing, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

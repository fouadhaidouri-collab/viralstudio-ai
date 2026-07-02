"use client";

import { useState, useEffect, useMemo } from "react";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import Icon from "../../components/Icon";

function generateCouponCode() {
  const prefixes = ["VIP", "PRO", "MAX", "ELITE", "MEGA", "ULTRA", "POWER", "STAR", "GOLD", "TOP"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = String(Math.floor(100 + Math.random() * 900));
  return `${prefix}${num}`;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newDiscount, setNewDiscount] = useState(20);
  const [newMaxUses, setNewMaxUses] = useState(0);
  const [newExpires, setNewExpires] = useState("");
  const [error, setError] = useState("");

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      setCoupons(data.coupons || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const stats = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter((c) => c.is_active).length;
    const totalUses = coupons.reduce((s, c) => s + (c.current_uses || 0), 0);
    return { total, active, totalUses };
  }, [coupons]);

  const handleCreate = async () => {
    setError("");
    if (!newCode || !newDiscount) {
      setError("Code and discount are required");
      return;
    }
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode,
          discount_percent: parseInt(newDiscount),
          max_uses: parseInt(newMaxUses) || 0,
          expires_at: newExpires || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create");
        return;
      }
      setShowCreate(false);
      setNewCode("");
      setNewDiscount(20);
      setNewMaxUses(0);
      setNewExpires("");
      fetchCoupons();
    } catch {
      setError("Server error");
    }
  };

  const handleToggle = async (id, current) => {
    await fetch("/api/admin/coupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: !current }),
    });
    fetchCoupons();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this coupon?")) return;
    await fetch("/api/admin/coupons", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchCoupons();
  };

  const columns = [
    {
      key: "code",
      label: "Code",
      render: (row) => (
        <span className="inline-flex items-center px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-lg text-xs font-bold text-purple-400 font-mono tracking-wider">
          {row.code}
        </span>
      ),
    },
    {
      key: "discount_percent",
      label: "Discount",
      align: "right",
      render: (row) => <span className="text-sm font-bold text-green-400">{row.discount_percent}%</span>,
    },
    {
      key: "current_uses",
      label: "Uses",
      align: "right",
      render: (row) => (
        <span className="text-xs text-on-surface-variant">
          {row.current_uses || 0}{row.max_uses > 0 ? ` / ${row.max_uses}` : ""}
        </span>
      ),
    },
    {
      key: "expires_at",
      label: "Expires",
      render: (row) => (
        <span className="text-xs text-on-surface-variant">
          {row.expires_at ? new Date(row.expires_at).toLocaleDateString() : "Never"}
        </span>
      ),
    },
    {
      key: "is_active",
      label: "Status",
      render: (row) => <StatusBadge status={row.is_active ? "active" : "inactive"} />,
    },
    {
      key: "created_at",
      label: "Created",
      render: (row) => <span className="text-xs text-on-surface-variant">{new Date(row.created_at).toLocaleDateString()}</span>,
    },
    {
      key: "actions",
      label: "",
      width: "80px",
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleToggle(row.id, row.is_active)}
            className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
              row.is_active
                ? "bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20"
                : "bg-green-400/10 text-green-400 hover:bg-green-400/20"
            }`}
          >
            {row.is_active ? "Disable" : "Enable"}
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="px-2 py-1 rounded text-[10px] font-semibold bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-all"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-full bg-background text-white p-6 flex items-center justify-center">
        <p className="text-sm text-on-surface-variant">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background text-white p-6">
      <PageHeader
        title="Coupons"
        subtitle="Create and manage promo codes"
        breadcrumbs={[{ label: "Admin" }, { label: "Coupons" }]}
        actions={[
          { label: "Create Coupon", icon: "add", onClick: () => { setError(""); setShowCreate(true); setNewCode(generateCouponCode()); } },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Coupons" value={stats.total} icon="gift" color="primary" />
        <StatCard title="Active" value={stats.active} icon="check_circle" color="green" />
        <StatCard title="Total Uses" value={stats.totalUses} icon="trending_up" color="secondary" />
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        {coupons.length === 0 ? (
          <EmptyState icon="gift" title="No coupons yet" description="Click Create Coupon to get started." />
        ) : (
          <DataTable columns={columns} data={coupons} />
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="bg-surface-container border border-surface-border/80 rounded-2xl max-w-sm w-full mx-4 animate-dropdown-open" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 pb-3">
              <h3 className="text-sm font-bold text-white">Create Coupon</h3>
              <button onClick={() => setShowCreate(false)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container-high hover:bg-surface-container-higher transition-all">
                <Icon name="close" className="text-on-surface-variant" size={14} />
              </button>
            </div>
            <div className="px-5 pb-5 space-y-4">
              {error && <div className="text-xs bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5 text-red-400">{error}</div>}
              <div>
                <label className="text-[11px] font-medium text-on-surface-variant mb-1.5 block">Coupon Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                    placeholder="e.g. PRO123"
                    className="flex-1 bg-surface-container-lowest border border-surface-border/60 rounded-xl px-4 py-2.5 text-sm text-white uppercase font-mono font-bold tracking-wider placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  <button
                    onClick={() => setNewCode(generateCouponCode())}
                    className="px-3 py-2 bg-surface-container-high rounded-xl text-xs text-on-surface-variant hover:text-white transition-all"
                  >
                    Generate
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-on-surface-variant mb-1.5 block">Discount (%)</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={newDiscount}
                  onChange={(e) => setNewDiscount(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-on-surface-variant mb-1.5 block">Max Uses (0 = unlimited)</label>
                <input
                  type="number"
                  min={0}
                  value={newMaxUses}
                  onChange={(e) => setNewMaxUses(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-on-surface-variant mb-1.5 block">Expires At (optional)</label>
                <input
                  type="date"
                  value={newExpires}
                  onChange={(e) => setNewExpires(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <button onClick={handleCreate} className="w-full primary-gradient text-white font-semibold py-2.5 rounded-xl text-sm hover:opacity-90 transition-all active:scale-[0.98]">
                Create Coupon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import Icon from "../../components/Icon";

export default function AdminDomainsPage() {
  const [domains, setDomains] = useState([]);
  const [active, setActive] = useState(null);
  const [newDomain, setNewDomain] = useState("");
  const [showDns, setShowDns] = useState(null);
  const [verifyMsg, setVerifyMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch("/api/domain");
    const data = await res.json();
    setDomains(data.domains);
    setActive(data.active);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newDomain) return;
    const res = await fetch("/api/domain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", domain: newDomain }),
    });
    if (res.ok) {
      const data = await res.json();
      setDomains(data.domains);
      const added = data.domains.find((d) => d.domain === newDomain);
      setShowDns(added);
      setNewDomain("");
    }
  };

  const handleVerify = async (id) => {
    const res = await fetch("/api/domain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", id }),
    });
    if (res.ok) {
      const data = await res.json();
      setDomains(data.domains);
      setVerifyMsg({ domain: domains.find((d) => d.id === id)?.domain, message: data.message, verified: data.verified });
      setTimeout(() => setVerifyMsg(null), 8000);
    }
  };

  const handleSetActive = async (id) => {
    const res = await fetch("/api/domain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_active", id }),
    });
    if (res.ok) { const data = await res.json(); setDomains(data.domains); }
  };

  const handleRemove = async (id) => {
    const res = await fetch("/api/domain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", id }),
    });
    if (res.ok) { const data = await res.json(); setDomains(data.domains); }
  };

  const activeDomain = domains.find((d) => d.is_active && d.status === "verified") || domains[0];

  const statusColor = (s) => {
    if (s === "verified" || s === "active") return "green";
    if (s === "failed") return "error";
    return "accentOrange";
  };

  const statusDot = (s) => {
    if (s === "verified" || s === "active") return "bg-green-400";
    if (s === "failed") return "bg-error";
    return "bg-accent-orange";
  };

  return (
    <div className="min-h-full bg-background text-white p-6"><div className="space-y-5">
      <PageHeader
        title="Domain Settings"
        subtitle="Manage the public domain connected to your client-facing site"
        breadcrumbs={[{ label: "Admin" }, { label: "Domains" }]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Domain" value={activeDomain?.domain || "None"} icon="language" color="primary" />
        <StatCard title="Domain Status" value={activeDomain?.status || "N/A"} icon="check_circle" color={statusColor(activeDomain?.status)} />
        <StatCard title="SSL Status" value={activeDomain?.ssl_status || "N/A"} icon="lock" color={statusColor(activeDomain?.ssl_status)} />
        <StatCard title="Last Checked" value={activeDomain?.updated_at ? new Date(activeDomain.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A"} icon="schedule" color="info" />
      </div>

      {verifyMsg && (
        <div className={`rounded-xl p-4 text-xs flex items-center gap-2 ${verifyMsg.verified ? "bg-green-500/15 text-green-400 border border-green-500/30" : "bg-accent-orange/15 text-accent-orange border border-accent-orange/30"}`}>
          <Icon name={verifyMsg.verified ? "check_circle" : "info"} size={14} />
          <span><strong>{verifyMsg.domain}:</strong> {verifyMsg.message}</span>
        </div>
      )}

      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-1">Connect New Domain</h3>
        <p className="text-xs text-on-surface-variant mb-4">Enter your custom domain to connect it to your site.</p>
        <div className="flex items-center gap-2 max-w-lg">
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="example.com"
            className="flex-1 bg-surface-container-lowest border border-surface-border/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-on-surface-variant focus:outline-none focus:border-primary/50"
          />
          <button onClick={handleAdd} disabled={!newDomain} className="primary-gradient text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-40 whitespace-nowrap">
            Connect Domain
          </button>
        </div>
      </div>

      {showDns && showDns.verification_token && (
        <div className="glass-card rounded-xl p-5 border border-secondary/30">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="info" size={16} className="text-secondary" />
            <h3 className="text-sm font-bold text-white">DNS Configuration for {showDns.domain}</h3>
          </div>
          <p className="text-xs text-on-surface-variant mb-3">Configure these DNS records with your domain provider, then click Verify DNS.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-border/50">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">A Record (Root)</p>
              <div className="space-y-1.5">
                <div className="flex justify-between"><span className="text-xs text-on-surface-variant">Type:</span><span className="text-xs font-mono text-white">A</span></div>
                <div className="flex justify-between"><span className="text-xs text-on-surface-variant">Name:</span><span className="text-xs font-mono text-white">@</span></div>
                <div className="flex justify-between"><span className="text-xs text-on-surface-variant">Value:</span><span className="text-xs font-mono text-white">76.76.21.21</span></div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-border/50">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">CNAME (www)</p>
              <div className="space-y-1.5">
                <div className="flex justify-between"><span className="text-xs text-on-surface-variant">Type:</span><span className="text-xs font-mono text-white">CNAME</span></div>
                <div className="flex justify-between"><span className="text-xs text-on-surface-variant">Name:</span><span className="text-xs font-mono text-white">www</span></div>
                <div className="flex justify-between"><span className="text-xs text-on-surface-variant">Value:</span><span className="text-xs font-mono text-white">cname.vercel-dns.com</span></div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-border/50">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">TXT Record (Verification)</p>
              <div className="space-y-1.5">
                <div className="flex justify-between"><span className="text-xs text-on-surface-variant">Type:</span><span className="text-xs font-mono text-white">TXT</span></div>
                <div className="flex justify-between"><span className="text-xs text-on-surface-variant">Name:</span><span className="text-xs font-mono text-white">@</span></div>
                <div className="flex justify-between"><span className="text-xs text-on-surface-variant">Value:</span><span className="text-xs font-mono text-white break-all">{showDns.verification_token}</span></div>
              </div>
            </div>
          </div>
          <button onClick={() => setShowDns(null)} className="text-xs text-secondary hover:underline">Dismiss</button>
        </div>
      )}

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-surface-border/50">
          <h3 className="text-sm font-bold text-white">Domains</h3>
        </div>
        {loading ? (
          <p className="text-xs text-on-surface-variant text-center py-8">Loading...</p>
        ) : domains.filter((d) => d.id !== "default").length === 0 ? (
          <div className="py-8 text-center">
            <Icon name="language" size={32} className="text-on-surface-variant/40 mx-auto mb-2" />
            <p className="text-sm text-on-surface-variant">No domains connected yet.</p>
            <p className="text-xs text-on-surface-variant/60 mt-1">Add a domain above to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-container-higher/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Domain</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">SSL</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">DNS Target</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">Created At</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-on-surface-variant">Actions</th>
                </tr>
              </thead>
              <tbody>
                {domains.filter((d) => d.id !== "default").map((d) => (
                  <tr key={d.id} className="border-b border-surface-border/50 hover:bg-surface-container-high/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Icon name="language" size={14} className={d.is_active ? "text-green-400" : "text-on-surface-variant"} />
                        <span className="text-xs text-white">{d.domain}</span>
                        {d.is_active && <span className="text-[9px] bg-green-500/15 text-green-400 px-1.5 py-0.5 rounded font-medium">Active</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs capitalize text-on-surface-variant">{d.type}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDot(d.status)}`} />
                        <span className="text-xs capitalize text-white">{d.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDot(d.ssl_status)}`} />
                        <span className="text-xs capitalize text-white">{d.ssl_status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-on-surface-variant">{d.dns_target}</td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant whitespace-nowrap">
                      {new Date(d.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setShowDns(d)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container-high border border-surface-border/50 hover:bg-surface-container-higher transition-all" title="View DNS">
                          <Icon name="visibility" className="text-on-surface-variant" size={13} />
                        </button>
                        {d.status !== "verified" && (
                          <button onClick={() => handleVerify(d.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-secondary/10 text-secondary hover:bg-secondary/20 transition-all" title="Verify DNS">
                            <Icon name="check_circle" size={13} />
                          </button>
                        )}
                        {!d.is_active && d.status === "verified" && (
                          <button onClick={() => handleSetActive(d.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all" title="Set Active">
                            <Icon name="toggle_on" size={13} />
                          </button>
                        )}
                        <button onClick={() => handleRemove(d.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-error/10 text-error hover:bg-error/20 transition-all" title="Delete">
                          <Icon name="delete" size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader";
import Icon from "../../components/Icon";

export default function AdminDomainPage() {
  const [domains, setDomains] = useState([]);
  const [newDomain, setNewDomain] = useState("");
  const [loading, setLoading] = useState(true);

  const loadDomains = async () => {
    const res = await fetch("/api/domain");
    const data = await res.json();
    setDomains(data.domains);
    setLoading(false);
  };

  useEffect(() => { loadDomains(); }, []);

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
      setNewDomain("");
    }
  };

  const handleVerify = async (domain) => {
    const res = await fetch("/api/domain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", domain }),
    });
    if (res.ok) {
      const data = await res.json();
      setDomains(data.domains);
    }
  };

  const handleRemove = async (domain) => {
    const res = await fetch("/api/domain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", domain }),
    });
    if (res.ok) {
      const data = await res.json();
      setDomains(data.domains);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Domain Name"
        subtitle="Add and verify your custom domains"
        breadcrumbs={[{ label: "Admin" }, { label: "Domain" }]}
      />

      <div className="glass-card rounded-xl p-6 max-w-xl">
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Enter domain name..."
            className="flex-1 bg-surface-container-lowest border border-surface-border/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-on-surface-variant focus:outline-none focus:border-primary/50"
          />
          <button
            onClick={handleAdd}
            disabled={!newDomain}
            className="primary-gradient text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-40 whitespace-nowrap"
          >
            Add Domain
          </button>
        </div>

        {loading ? (
          <p className="text-xs text-on-surface-variant text-center py-6">Loading...</p>
        ) : (
          <div className="space-y-2">
            {domains.map((d) => (
              <div key={d.id} className="flex items-center justify-between bg-surface-container-lowest border border-surface-border/50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <Icon name="language" size={18} className={d.verified ? "text-green-400" : "text-on-surface-variant"} />
                  <div>
                    <p className="text-sm font-medium text-white">{d.name}</p>
                    <p className={`text-[10px] ${d.verified ? "text-green-400" : "text-accent-orange"}`}>
                      {d.verified ? "Verified" : "Not verified"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!d.verified && (
                    <button
                      onClick={() => handleVerify(d)}
                      className="px-3 py-1.5 bg-secondary/15 text-secondary rounded-lg text-xs font-medium hover:bg-secondary/25 transition-all"
                    >
                      Verify
                    </button>
                  )}
                  <button
                    onClick={() => handleRemove(d)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-error/10 text-error hover:bg-error/20 transition-all"
                  >
                    <Icon name="delete" size={14} />
                  </button>
                </div>
              </div>
            ))}
            {domains.length === 0 && (
              <p className="text-xs text-on-surface-variant text-center py-6">No domains added yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

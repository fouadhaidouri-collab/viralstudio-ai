"use client";
import { useState } from "react";
import PageHeader from "../components/PageHeader";
import Icon from "../../components/Icon";

export default function AdminDomainPage() {
  const [domain, setDomain] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!domain) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Domain Name"
        subtitle="Connect your custom domain"
        breadcrumbs={[{ label: "Admin" }, { label: "Domain" }]}
      />

      <div className="glass-card rounded-xl p-6 max-w-lg">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Icon name="language" className="text-primary" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Custom Domain</h3>
            <p className="text-xs text-on-surface-variant">Enter your domain name to connect it to your site</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-on-surface-variant mb-1.5 block">Domain Name</label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              className="w-full bg-surface-container-lowest border border-surface-border/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-on-surface-variant focus:outline-none focus:border-primary/50"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!domain}
            className="primary-gradient text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-40"
          >
            {saved ? "Connected!" : "Connect Domain"}
          </button>
        </div>
      </div>
    </div>
  );
}

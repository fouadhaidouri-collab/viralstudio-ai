"use client";
import { useState, useMemo, useEffect } from "react";
import StatusBadge from "../components/StatusBadge";
import Icon from "../../components/Icon";

export default function AdminAiImagePage() {
  const [allGenerations, setAllGenerations] = useState([]);
  const [search, setSearch] = useState("");
  const [alertMsg, setAlertMsg] = useState(null);
  useEffect(() => {
    fetch("/api/admin/generations").then((r) => r.json()).then((d) => setAllGenerations(d.data || [])).catch(() => {});
  }, []);

  const showAlert = (msg) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(null), 2000);
  };

  const generations = useMemo(() => {
    let list = allGenerations.filter((g) => g.tool === "Image Lab");
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((g) => (g.user_name || "").toLowerCase().includes(q) || g.prompt.toLowerCase().includes(q));
    }
    return list;
  }, [search, allGenerations]);

  return (
    <div className="min-h-full bg-background text-white p-6"><div className="space-y-5 animate-fade-in-up">
      <div>
        <h1 className="text-lg md:text-xl font-bold text-white" style={{ fontFamily: "Geist, sans-serif" }}>Image Lab</h1>
        <p className="text-xs text-on-surface-variant mt-0.5">Monitor Image Lab generations and manage user credits</p>
      </div>

      {alertMsg && (
        <div className="px-4 py-3 rounded-xl bg-primary/15 border border-primary/20 text-xs text-primary font-medium">
          {alertMsg}
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="relative max-w-xs w-full">
          <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user or prompt..."
            className="w-full bg-[rgba(255,255,255,0.03)] border border-white/5 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-on-surface-variant focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>
      </div>

      <div className="bg-[rgba(255,255,255,0.02)] border border-white/5 rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.03), transparent)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5 text-on-surface-variant">
                <th className="text-left p-3 font-semibold">User</th>
                <th className="text-left p-3 font-semibold">Model</th>
                <th className="text-left p-3 font-semibold">Prompt</th>
                <th className="text-left p-3 font-semibold">Credits Used</th>
                <th className="text-left p-3 font-semibold">Status</th>
                <th className="text-left p-3 font-semibold">Date</th>
                <th className="text-left p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {generations.length === 0 ? (
                <tr><td colSpan={7} className="p-6 text-center text-on-surface-variant text-xs">No image generations found</td></tr>
              ) : (
                generations.map((g) => (
                  <tr key={g.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="p-3 text-white font-medium">{g.user_name}</td>
                    <td className="p-3 text-on-surface-variant">{g.model}</td>
                    <td className="p-3 text-on-surface-variant max-w-[250px] truncate">{g.prompt}</td>
                    <td className="p-3 text-yellow-400 font-semibold">{g.credits_used}</td>
                    <td className="p-3"><StatusBadge status={g.status} /></td>
                    <td className="p-3 text-on-surface-variant">{new Date(g.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                    <td className="p-3">
                      <button onClick={() => showAlert(`Add credits to ${g.user_name}`)} className="px-2.5 py-1.5 rounded-lg bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25 text-[10px] font-semibold transition-all">Add Credits</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .primary-gradient {
          background: linear-gradient(135deg, #a855f7, #7c3aed);
        }
      `}</style>
    </div>
    </div>
  );
}

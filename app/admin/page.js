"use client";
import { useState } from "react";
import Icon from "../components/Icon";
import StatusBadge from "./components/StatusBadge";

const sampleUsers = [
  { name: "Fouad", email: "alikom381@gmail.com", plan: "Pro Plan", credits: 1250, status: "active" },
  { name: "Sara", email: "sara@example.com", plan: "Free Plan", credits: 120, status: "active" },
  { name: "Adam", email: "adam@example.com", plan: "Creator Plan", credits: 600, status: "active" },
];

export default function AdminPage() {
  const [alertMsg, setAlertMsg] = useState(null);

  const showAlert = (msg) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(null), 2000);
  };

  const StatCard = ({ label, value, icon, color }) => (
    <div className="bg-[rgba(255,255,255,0.02)] border border-white/5 rounded-2xl p-4 card-glow" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.03), transparent)" }}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
          <Icon name={icon} size={16} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-extrabold text-white">{value}</p>
      <p className="text-[11px] text-on-surface-variant mt-0.5">{label}</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-lg md:text-xl font-bold text-white" style={{ fontFamily: "Geist, sans-serif" }}>Admin Panel</h1>
        <p className="text-xs text-on-surface-variant mt-0.5">Manage your ViralStudio AI platform</p>
      </div>

      {alertMsg && (
        <div className="px-4 py-3 rounded-xl bg-primary/15 border border-primary/20 text-xs text-primary font-medium">
          {alertMsg}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Users" value="128" icon="group_add" color="bg-gradient-to-br from-purple-600 to-purple-800" />
        <StatCard label="Total Credits Used" value="45,800" icon="bolt" color="bg-gradient-to-br from-yellow-500 to-yellow-700" />
        <StatCard label="Total Revenue" value="$2,940" icon="credit_card" color="bg-gradient-to-br from-green-500 to-green-700" />
        <StatCard label="Active Plans" value="36" icon="workspace_premium" color="bg-gradient-to-br from-cyan-500 to-cyan-700" />
      </div>

      <div className="bg-[rgba(255,255,255,0.02)] border border-white/5 rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.03), transparent)" }}>
        <div className="flex items-center justify-between p-4 pb-2">
          <h3 className="text-xs font-semibold text-white flex items-center gap-2">
            <Icon name="group_add" size={14} className="text-primary" />
            Users
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5 text-on-surface-variant">
                <th className="text-left p-3 font-semibold">Name</th>
                <th className="text-left p-3 font-semibold">Email</th>
                <th className="text-left p-3 font-semibold">Plan</th>
                <th className="text-left p-3 font-semibold">Credits</th>
                <th className="text-left p-3 font-semibold">Status</th>
                <th className="text-left p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sampleUsers.map((u, i) => (
                <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="p-3 text-white font-medium">{u.name}</td>
                  <td className="p-3 text-on-surface-variant">{u.email}</td>
                  <td className="p-3 text-white">{u.plan}</td>
                  <td className="p-3 text-yellow-400 font-semibold">{u.credits.toLocaleString()}</td>
                  <td className="p-3"><StatusBadge status={u.status} /></td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => showAlert(`Viewing ${u.name}`)} className="px-2 py-1 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 text-[10px] font-medium transition-all">View</button>
                      <button onClick={() => showAlert(`Edit credits for ${u.name}`)} className="px-2 py-1 rounded-lg bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25 text-[10px] font-medium transition-all">Edit Credits</button>
                      <button onClick={() => showAlert(`Disable ${u.name}`)} className="px-2 py-1 rounded-lg bg-error/15 text-error hover:bg-error/25 text-[10px] font-medium transition-all">Disable</button>
                    </div>
                  </td>
                </tr>
              ))}
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
  );
}

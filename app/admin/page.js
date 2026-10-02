"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Icon from "../components/Icon";
import StatCard from "./components/StatCard";

const quickLinks = [
  { href: "/admin/users", label: "Users", desc: "Manage accounts, credits & roles", icon: "group_add", color: "text-primary", bg: "bg-primary/20" },
  { href: "/admin/generations", label: "Generations", desc: "Browse all AI generations", icon: "history", color: "text-secondary", bg: "bg-secondary/20" },
  { href: "/admin/ai-tools", label: "AI Tools", desc: "Configure the enabled AI tools", icon: "bolt", color: "text-accent-orange", bg: "bg-accent-orange/20" },
  { href: "/admin/models", label: "Models", desc: "Manage AI models & pricing", icon: "settings_input_component", color: "text-primary", bg: "bg-primary/20" },
  { href: "/admin/plans", label: "Plans & Pricing", desc: "Set plans, credits & limits", icon: "credit_card", color: "text-accent-cyan", bg: "bg-accent-cyan/20" },
  { href: "/admin/settings", label: "Settings", desc: "Platform configuration & keys", icon: "settings", color: "text-tertiary", bg: "bg-tertiary/20" },
];

export default function AdminOverviewPage() {
  const [stats, setStats] = useState({ users: 0, generations: 0, payments: 0, modules: 0 });

  useEffect(() => {
    const load = async () => {
      const [u, g, p, m] = await Promise.allSettled([
        fetch("/api/admin/users").then((r) => r.json()),
        fetch("/api/admin/generations").then((r) => r.json()),
        fetch("/api/admin/payments").then((r) => r.json()),
        fetch("/api/admin/modules").then((r) => r.json()),
      ]);
      const getTotal = (r, arrKey) => {
        if (r.status !== "fulfilled") return 0;
        const v = r.value;
        if (typeof v?.total === "number") return v.total;
        if (Array.isArray(v?.[arrKey])) return v[arrKey].length;
        return 0;
      };
      setStats({
        users: getTotal(u, "users"),
        generations: getTotal(g, "data"),
        payments: getTotal(p, "payments"),
        modules: getTotal(m, "modules"),
      });
    };
    load();
  }, []);

  return (
    <div className="min-h-full flex flex-col gap-4 animate-fade-in-up">
      <div>
        <h1 className="text-lg md:text-xl font-bold text-white" style={{ fontFamily: "Geist, sans-serif" }}>Admin Panel</h1>
        <p className="text-xs text-on-surface-variant mt-0.5">Manage your ViralStudio AI platform</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        <StatCard title="Total Users" value={stats.users} icon="group_add" color="primary" subtitle="accounts" />
        <StatCard title="Generations" value={stats.generations} icon="history" color="secondary" subtitle="AI jobs" />
        <StatCard title="Payments" value={stats.payments} icon="credit_card" color="accentPink" subtitle="transactions" />
        <StatCard title="Active Modules" value={stats.modules} icon="settings_input_component" color="accentCyan" subtitle="AI tools" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 flex-1">
        {quickLinks.map((q) => (
          <Link
            key={q.href}
            href={q.href}
            className="glass-card p-5 rounded-2xl flex flex-col group min-h-[150px] glass-card-hover card-glow"
            style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.02), transparent)" }}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-xl ${q.bg} flex items-center justify-center ${q.color} shadow-lg icon-glow`}>
                <Icon name={q.icon} size={28} />
              </div>
              <Icon name="north_east" className="opacity-0 group-hover:opacity-100 transition-all duration-300 text-primary -translate-x-2 group-hover:translate-x-0" size={16} />
            </div>
            <h3 className="text-lg font-semibold mb-1 text-white" style={{ fontFamily: "Geist, sans-serif" }}>{q.label}</h3>
            <p className="text-xs text-on-surface-variant flex-1">{q.desc}</p>
            <div className={`mt-auto pt-3 ${q.color} text-sm font-medium flex items-center gap-2 group-hover:gap-3 transition-all duration-200`} style={{ fontFamily: "Geist, sans-serif" }}>
              Manage <Icon name="arrow_forward" size={14} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
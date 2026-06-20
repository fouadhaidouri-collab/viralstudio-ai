"use client";
import { useState, useMemo } from "react";
import { mockUsers } from "./data/mockUsers";
import { mockGenerations } from "./data/mockGenerations";
import { mockPayments } from "./data/mockPayments";
import { mockModels } from "./data/mockModels";
import StatCard from "./components/StatCard";
import ChartCard, { SimpleBarChart, SimpleLineChart, SimplePieChart } from "./components/ChartCard";
import StatusBadge from "./components/StatusBadge";
import Icon from "../components/Icon";

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminOverview() {
  const [timeRange, setTimeRange] = useState("7d");

  const stats = useMemo(() => {
    const totalUsers = mockUsers.length;
    const activeUsers = mockUsers.filter((u) => u.status === "active").length;
    const today = new Date().toISOString().split("T")[0];
    const newUsersToday = mockUsers.filter((u) => u.signup_date.startsWith(today)).length;
    const totalCreditsUsed = mockGenerations.reduce((s, g) => g.status === "completed" || g.status === "failed" ? s + g.credits_used : s, 0);
    const totalRevenue = mockPayments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
    const monthlyRevenue = mockPayments.filter((p) => p.status === "paid" && p.created_at.startsWith("2026-06")).reduce((s, p) => s + p.amount, 0);
    const activeSubscriptions = mockUsers.filter((u) => u.plan !== "Free" && u.status === "active").length;
    const completedGens = mockGenerations.filter((g) => g.status === "completed").length;
    const failedGens = mockGenerations.filter((g) => g.status === "failed").length;
    const successfulGens = completedGens;
    const toolCounts = {};
    mockGenerations.forEach((g) => { toolCounts[g.tool] = (toolCounts[g.tool] || 0) + 1; });
    const mostUsedTool = Object.entries(toolCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
    const modelCounts = {};
    mockGenerations.forEach((g) => { modelCounts[g.model] = (modelCounts[g.model] || 0) + 1; });
    const mostUsedModel = Object.entries(modelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
    const totalCreditsSold = mockPayments.filter((p) => p.status === "paid").reduce((s) => s + 5000, 0);
    const creditsRemaining = totalCreditsSold - totalCreditsUsed;

    return { totalUsers, activeUsers, newUsersToday, totalCreditsUsed, totalCreditsSold, creditsRemaining, totalGenerations: mockGenerations.length, successfulGens, failedGens, totalRevenue, monthlyRevenue, activeSubscriptions, mostUsedTool, mostUsedModel };
  }, []);

  const revenueData = [
    { label: "Jan", value: 1200 }, { label: "Feb", value: 1800 }, { label: "Mar", value: 2400 },
    { label: "Apr", value: 3100 }, { label: "May", value: 3900 }, { label: "Jun", value: 4800 },
  ];

  const creditsUsageData = [
    { label: "Mon", value: 45 }, { label: "Tue", value: 62 }, { label: "Wed", value: 38 },
    { label: "Thu", value: 71 }, { label: "Fri", value: 55 }, { label: "Sat", value: 29 }, { label: "Sun", value: 43 },
  ];

  const genByTool = [
    { label: "AI Video", value: 10, color: "#a855f7" },
    { label: "Image Lab", value: 4, color: "#22d3ee" },
    { label: "Chat AI", value: 2, color: "#fb923c" },
    { label: "UGC Engine", value: 1, color: "#ec4899" },
    { label: "Clipping", value: 3, color: "#f97316" },
  ];

  const newUsersChart = [
    { label: "Week 1", value: 3 }, { label: "Week 2", value: 5 }, { label: "Week 3", value: 2 }, { label: "Week 4", value: 7 },
  ];

  const failedJobsChart = [
    { label: "Mon", value: 2 }, { label: "Tue", value: 1 }, { label: "Wed", value: 3 },
    { label: "Thu", value: 0 }, { label: "Fri", value: 1 }, { label: "Sat", value: 0 }, { label: "Sun", value: 0 },
  ];

  const latestUsers = [...mockUsers].sort((a, b) => new Date(b.signup_date) - new Date(a.signup_date)).slice(0, 5);
  const latestGens = [...mockGenerations].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
  const latestPayments = [...mockPayments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
  const failedGens = mockGenerations.filter((g) => g.status === "failed").slice(0, 3);

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-white" style={{ fontFamily: "Geist, sans-serif" }}>Admin Overview</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Monitor your ViralStudio AI platform performance</p>
        </div>
        <div className="flex items-center gap-1.5 bg-surface-container-low border border-surface-border/50 rounded-lg p-0.5">
          {["24h", "7d", "30d", "all"].map((t) => (
            <button key={t} onClick={() => setTimeRange(t)} className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${timeRange === t ? "primary-gradient text-white" : "text-on-surface-variant hover:text-white"}`}>
              {t === "24h" ? "24H" : t === "7d" ? "7 Days" : t === "30d" ? "30 Days" : "All Time"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        <StatCard title="Total Users" value={stats.totalUsers} icon="group_add" color="primary" trend="+12% this month" />
        <StatCard title="Active Users" value={stats.activeUsers} icon="verified" color="green" trend={`${Math.round((stats.activeUsers / stats.totalUsers) * 100)}% of total`} />
        <StatCard title="New Today" value={stats.newUsersToday} icon="person" color="secondary" subtitle="Signups in last 24h" />
        <StatCard title="Credits Used" value={stats.totalCreditsUsed} icon="bolt" color="yellow" suffix=" cr" />
        <StatCard title="Credits Sold" value={stats.totalCreditsSold} icon="currency_bitcoin" color="accentOrange" suffix=" cr" trend="+15% vs last month" />
        <StatCard title="Credits Remaining" value={stats.creditsRemaining} icon="hourglass" color="accentCyan" suffix=" cr" />
        <StatCard title="Total Generations" value={stats.totalGenerations} icon="auto_awesome" color="primary" />
        <StatCard title="Successful" value={stats.successfulGens} icon="check_circle" color="green" trend={`${Math.round((stats.successfulGens / stats.totalGenerations) * 100)}% success rate`} />
        <StatCard title="Failed" value={stats.failedGens} icon="error" color="error" trend={`${Math.round((stats.failedGens / stats.totalGenerations) * 100)}% failure rate`} />
        <StatCard title="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} icon="credit_card" color="accentOrange" />
        <StatCard title="Monthly Revenue" value={`$${stats.monthlyRevenue.toLocaleString()}`} icon="trending_up" color="green" trend="June 2026" />
        <StatCard title="Active Subs" value={stats.activeSubscriptions} icon="workspace_premium" color="accentPink" trend={`${Math.round((stats.activeSubscriptions / stats.totalUsers) * 100)}% conversion`} />
        <StatCard title="Top Tool" value={stats.mostUsedTool} icon="apps" color="secondary" subtitle="Most used AI tool" />
        <StatCard title="Top Model" value={stats.mostUsedModel} icon="psychology" color="primary" subtitle="Most used AI model" />
        <StatCard title="System Health" value="97.2%" icon="check_circle" color={stats.failedGens > 3 ? "yellow" : "green"} subtitle="API uptime" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Revenue" subtitle="Monthly revenue 2026" icon="credit_card" action={{ label: "View payments", onClick: () => window.location.href = "/admin/payments" }}>
          <SimpleBarChart data={revenueData} />
        </ChartCard>
        <ChartCard title="Credits Usage" subtitle="Last 7 days" icon="bolt" action={{ label: "View credits", onClick: () => window.location.href = "/admin/credits" }}>
          <SimpleLineChart data={creditsUsageData} />
        </ChartCard>
        <ChartCard title="Generations by Tool" subtitle="All time" icon="auto_awesome">
          <SimplePieChart data={genByTool} />
        </ChartCard>
        <ChartCard title="New Users" subtitle="Weekly signups" icon="group_add">
          <SimpleLineChart data={newUsersChart} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl overflow-hidden card-glow" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.02), transparent)" }}>
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h3 className="text-xs font-semibold text-white flex items-center gap-2">
              <Icon name="person" className="text-primary" size={14} />
              Latest Users
            </h3>
            <a href="/admin/users" className="text-[10px] text-primary hover:text-primary/80 font-medium">View all</a>
          </div>
          <div className="px-4 pb-4 space-y-2">
            {latestUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-1.5 border-b border-surface-border/20 last:border-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">{u.name.charAt(0)}</div>
                  <div>
                    <p className="text-xs font-medium text-white">{u.name}</p>
                    <p className="text-[9px] text-on-surface-variant">{u.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-on-surface-variant">{new Date(u.signup_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden card-glow" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.02), transparent)" }}>
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h3 className="text-xs font-semibold text-white flex items-center gap-2">
              <Icon name="auto_awesome" className="text-primary" size={14} />
              Latest Generations
            </h3>
            <a href="/admin/generations" className="text-[10px] text-primary hover:text-primary/80 font-medium">View all</a>
          </div>
          <div className="px-4 pb-4 space-y-2">
            {latestGens.map((g) => (
              <div key={g.id} className="flex items-center justify-between py-1.5 border-b border-surface-border/20 last:border-0">
                <div>
                  <p className="text-xs font-medium text-white">{g.tool} - {g.model}</p>
                  <p className="text-[9px] text-on-surface-variant truncate max-w-[200px]">{g.prompt}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={g.status} />
                  <span className="text-[9px] text-on-surface-variant">{formatDate(g.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl overflow-hidden card-glow" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.02), transparent)" }}>
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h3 className="text-xs font-semibold text-white flex items-center gap-2">
              <Icon name="credit_card" className="text-primary" size={14} />
              Latest Payments
            </h3>
            <a href="/admin/payments" className="text-[10px] text-primary hover:text-primary/80 font-medium">View all</a>
          </div>
          <div className="px-4 pb-4 space-y-2">
            {latestPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-surface-border/20 last:border-0">
                <div>
                  <p className="text-xs font-medium text-white">{p.user_name}</p>
                  <p className="text-[9px] text-on-surface-variant">{p.plan} - ${p.amount}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={p.status} />
                  <span className="text-[9px] text-on-surface-variant">{formatDate(p.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden card-glow" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.02), transparent)" }}>
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h3 className="text-xs font-semibold text-white flex items-center gap-2">
              <Icon name="error" className="text-error" size={14} />
              Failed Generations
            </h3>
            <a href="/admin/generations" className="text-[10px] text-primary hover:text-primary/80 font-medium">View all</a>
          </div>
          <div className="px-4 pb-4 space-y-2">
            {failedGens.length === 0 ? (
              <p className="text-xs text-on-surface-variant text-center py-4">No failed generations</p>
            ) : (
              failedGens.map((g) => (
                <div key={g.id} className="flex items-start gap-2.5 py-1.5 border-b border-surface-border/20 last:border-0">
                  <div className="w-6 h-6 rounded-lg bg-error/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon name="error" className="text-error" size={12} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white">{g.user_name} - {g.tool}</p>
                    <p className="text-[9px] text-error mt-0.5">{g.error_message}</p>
                  </div>
                  <span className="text-[9px] text-on-surface-variant shrink-0">{formatDate(g.created_at)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4 card-glow" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.02), transparent)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Icon name="check_circle" className="text-green-400" size={14} />
          <h3 className="text-xs font-semibold text-white">System Health Status</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "API Status", value: "Operational", status: "success" },
            { label: "Database", value: "Connected", status: "success" },
            { label: "FAL.ai", value: "97.2% uptime", status: "success" },
            { label: "OpenRouter", value: "99.1% uptime", status: "success" },
            { label: "Stripe", value: "Operational", status: "success" },
            { label: "PayPal", value: "Operational", status: "success" },
            { label: "Storage", value: "78% used", status: "warning" },
            { label: "Queue", value: "3 pending", status: "info" },
          ].map((item) => (
            <div key={item.label} className="bg-surface-container-low border border-surface-border/40 rounded-lg p-3 flex items-center gap-2.5">
              <span className={`w-2 h-2 rounded-full ${item.status === "success" ? "bg-green-400" : item.status === "warning" ? "bg-yellow-400" : "bg-secondary"}`} />
              <div>
                <p className="text-[9px] text-on-surface-variant">{item.label}</p>
                <p className="text-xs font-semibold text-white">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import StatCard from "./components/StatCard";
import Icon from "../components/Icon";

function formatWhen(value) {
  if (!value) return "-";
  const date = new Date(value.endsWith("Z") ? value : `${value}Z`);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function deviceLabel(userAgent) {
  if (!userAgent) return "Unknown";
  if (/ipad|tablet/i.test(userAgent)) return "Tablet";
  if (/mobile|android|iphone|ipod/i.test(userAgent)) return "Mobile";
  return "Desktop";
}

function shortReferrer(referrer) {
  if (!referrer) return "Direct";
  try {
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return referrer.slice(0, 32);
  }
}

function countryFlagUrl(code) {
  if (!code || !/^[A-Za-z]{2}$/.test(code)) return "";
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
}

function shortPath(path) {
  if (!path) return "/";
  return path.length > 34 ? `${path.slice(0, 31)}...` : path;
}

export default function AdminPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadVisits = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/visitors", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Could not load visitors");
        return;
      }
      setData(json);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = data?.summary || {};
  const visits = data?.visits || [];
  const daily = data?.daily || [];
  const chart = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setUTCHours(0, 0, 0, 0);
    day.setUTCDate(day.getUTCDate() - (6 - index));
    const key = day.toISOString().slice(0, 10);
    return {
      key,
      label: day.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
      count: Number(daily.find((row) => row.day === key)?.count || 0),
    };
  });
  const maxDaily = Math.max(1, ...chart.map((row) => row.count));

  return (
    <div className="min-h-full bg-background p-6 text-white">
      <div className="animate-fade-in-up space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-white md:text-xl" style={{ fontFamily: "Geist, sans-serif" }}>
              Admin Panel
            </h1>
            <p className="mt-0.5 text-xs text-on-surface-variant">Manage your ViralStudio AI platform</p>
          </div>
          <button
            onClick={loadVisits}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-surface-border/60 bg-surface-container-low px-3.5 py-2 text-xs font-semibold text-on-surface-variant transition-all hover:border-primary/30 hover:text-white disabled:opacity-50"
          >
            <Icon name="refresh" size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <section>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon name="visibility" size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Site Visitors</h2>
              <p className="text-[10px] text-on-surface-variant">Live IP, country and device data for every visitor</p>
            </div>
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-[10px] font-semibold text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
              Live tracking
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard title="Total Visits" value={summary.total ?? 0} icon="visibility" color="primary" subtitle="All page views" />
            <StatCard title="Unique IPs" value={summary.unique_ips ?? 0} icon="person" color="secondary" subtitle="Distinct addresses" />
            <StatCard title="Countries" value={summary.countries ?? 0} icon="globe" color="accentCyan" subtitle="Detected countries" />
            <StatCard title="Today" value={summary.today ?? 0} icon="schedule" color="green" subtitle="Since midnight" />
          </div>
        </section>

        <section className="glass-card card-glow overflow-hidden rounded-2xl border border-white/5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-border/50 px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Recent Visitors</h3>
              <p className="mt-0.5 text-[10px] text-on-surface-variant">Latest browsers that opened your site</p>
            </div>
            <span className="text-[10px] text-on-surface-variant">{visits.length} shown</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 px-5 py-12 text-xs text-on-surface-variant">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
              Loading visitors...
            </div>
          ) : error ? (
            <div className="px-5 py-12 text-center">
              <p className="text-xs text-red-400">{error}</p>
              <button
                onClick={loadVisits}
                className="mt-4 rounded-xl primary-gradient px-4 py-2 text-xs font-semibold text-white transition-all hover:opacity-90"
              >
                Try again
              </button>
            </div>
          ) : visits.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon name="visibility" size={20} />
              </div>
              <p className="text-sm font-semibold text-white">No visitors yet</p>
              <p className="mt-1 text-xs text-on-surface-variant">
                Open your site from any PC or phone and the visit will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="bg-surface-container-higher/50">
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">IP</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Country</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Device</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Page</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Source</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Visited</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.map((visit) => {
                    const device = visit.device || deviceLabel(visit.user_agent);
                    const flag = countryFlagUrl(visit.country_code);
                    return (
                      <tr key={visit.id} className="border-t border-surface-border/50 transition-colors hover:bg-white/[0.02]">
                        <td className="px-5 py-3.5">
                          <div className="font-mono text-xs font-medium text-white">{visit.ip || "Unknown"}</div>
                          {visit.city && <div className="mt-0.5 text-[10px] text-on-surface-variant">{visit.city}</div>}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            {flag ? (
                              <img
                                src={flag}
                                alt=""
                                width={20}
                                height={15}
                                loading="lazy"
                                className="h-[15px] w-5 rounded-[2px] object-cover"
                              />
                            ) : (
                              <span className="flex h-[15px] w-5 items-center justify-center rounded-[2px] bg-surface-container-high text-on-surface-variant">
                                <Icon name="globe" size={11} />
                              </span>
                            )}
                            <div>
                              <div className="text-xs font-medium text-white">
                                {visit.country_name || visit.country_code || "Unknown"}
                              </div>
                              <div className="mt-0.5 text-[10px] text-on-surface-variant">
                                {visit.country_code || "No country code"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-surface-border/60 bg-surface-container-low px-2 py-1 text-[10px] font-medium text-on-surface-variant">
                            <Icon name={device === "Desktop" ? "smart_display" : "smartphone"} size={11} />
                            {device}
                          </span>
                        </td>
                        <td className="px-5 py-3.5" title={visit.path || ""}>
                          <span className="font-mono text-[11px] text-white/80">{shortPath(visit.path)}</span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-on-surface-variant">{shortReferrer(visit.referrer)}</td>
                        <td className="px-5 py-3.5 text-xs text-on-surface-variant" title={visit.created_at || ""}>
                          {formatWhen(visit.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="glass-card card-glow rounded-2xl border border-white/5 p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Visitors — Last 7 Days</h3>
              <p className="mt-0.5 text-[10px] text-on-surface-variant">Daily traffic across the whole site</p>
            </div>
            <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
              {summary.last7 ?? 0} total
            </span>
          </div>

          <div className="flex h-28 items-end gap-2">
            {chart.map((row) => (
              <div key={row.key} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-primary/80 to-secondary/70 transition-all"
                    style={{ height: `${Math.max(4, Math.round((row.count / maxDaily) * 100))}%` }}
                    title={`${row.count} visit${row.count === 1 ? "" : "s"}`}
                  />
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-semibold text-white">{row.count}</div>
                  <div className="text-[9px] uppercase tracking-wider text-on-surface-variant">{row.label}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

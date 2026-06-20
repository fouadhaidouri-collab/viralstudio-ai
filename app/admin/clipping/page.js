"use client";
import { useState, useMemo } from "react";
import StatusBadge from "../components/StatusBadge";
import ActionMenu from "../components/ActionMenu";
import ConfirmModal from "../components/ConfirmModal";
import SearchInput from "../components/SearchInput";
import FilterSelect from "../components/FilterSelect";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import CreditBadge from "../components/CreditBadge";
import Icon from "../../components/Icon";

const mockClippingJobs = [
  { id: 'clip_001', user_id: 'usr_002', user_name: 'Sarah Johnson', video_name: 'gaming_highlights.mp4', file_size: 245, reels_requested: 10, clip_length: 30, aspect_ratio: '9:16', status: 'completed', generated_reels: 10, failed_clips: 0, credits_used: 15, created_at: '2026-06-19T10:00:00Z' },
  { id: 'clip_002', user_id: 'usr_003', user_name: 'Michael Chen', video_name: 'podcast_interview.mp4', file_size: 512, reels_requested: 20, clip_length: 45, aspect_ratio: '9:16', status: 'processing', generated_reels: 12, failed_clips: 1, credits_used: 30, created_at: '2026-06-20T08:00:00Z' },
  { id: 'clip_003', user_id: 'usr_010', user_name: 'Nina Kravitz', video_name: 'product_demo.mp4', file_size: 180, reels_requested: 5, clip_length: 15, aspect_ratio: '1:1', status: 'failed', generated_reels: 3, failed_clips: 2, credits_used: 15, created_at: '2026-06-18T14:00:00Z' },
  { id: 'clip_004', user_id: 'usr_008', user_name: 'Anna Martinez', video_name: 'tutorial_video.mp4', file_size: 890, reels_requested: 30, clip_length: 60, aspect_ratio: '16:9', status: 'pending', generated_reels: 0, failed_clips: 0, credits_used: 45, created_at: '2026-06-20T12:00:00Z' },
  { id: 'clip_005', user_id: 'usr_014', user_name: 'Rachel Green', video_name: 'vlog_daily.mp4', file_size: 320, reels_requested: 15, clip_length: 30, aspect_ratio: '9:16', status: 'completed', generated_reels: 15, failed_clips: 0, credits_used: 15, created_at: '2026-06-18T20:00:00Z' },
  { id: 'clip_006', user_id: 'usr_012', user_name: 'Sophie Laurent', video_name: 'wedding_highlights.mp4', file_size: 1500, reels_requested: 50, clip_length: 45, aspect_ratio: '9:16', status: 'failed', generated_reels: 0, failed_clips: 50, credits_used: 15, error_message: 'File size exceeds 500MB limit', created_at: '2026-06-17T09:00:00Z' },
];

function formatSize(mb) {
  if (mb >= 1024) return (mb / 1024).toFixed(2) + " GB";
  return mb + " MB";
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ClippingJobsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewJob, setViewJob] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const filtered = useMemo(() => {
    return mockClippingJobs.filter((j) => {
      const matchSearch = !search || j.user_name.toLowerCase().includes(search.toLowerCase()) || j.video_name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || j.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter]);

  const stats = useMemo(() => {
    const total = mockClippingJobs.length;
    const completed = mockClippingJobs.filter((j) => j.status === "completed").length;
    const failed = mockClippingJobs.filter((j) => j.status === "failed").length;
    const processingPending = mockClippingJobs.filter((j) => j.status === "processing" || j.status === "pending").length;
    return { total, completed, failed, processingPending };
  }, []);

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "completed", label: "Completed" },
    { value: "failed", label: "Failed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const statCards = [
    { title: "Total Jobs", value: stats.total, icon: "content_cut", color: "primary" },
    { title: "Completed", value: stats.completed, icon: "check_circle", color: "green" },
    { title: "Failed", value: stats.failed, icon: "error", color: "error" },
    { title: "Processing / Pending", value: stats.processingPending, icon: "hourglass_top", color: "yellow" },
  ];

  return (
    <div className="space-y-5 animate-fade-in-up">
      <PageHeader title="Clipping Jobs" subtitle="Manage long-video-to-reels jobs" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <div key={s.title} className="glass-card rounded-xl p-4 flex items-start gap-3 card-glow glass-card-hover min-h-[80px]" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.02), transparent)" }}>
            <div className={`w-9 h-9 rounded-lg bg-${s.color === "primary" ? "primary" : s.color === "green" ? "green-500" : s.color === "error" ? "error" : "yellow-500"}/10 flex items-center justify-center text-${s.color === "primary" ? "primary" : s.color === "green" ? "green-400" : s.color === "error" ? "error" : "yellow-400"} shrink-0`}>
              <Icon name={s.icon} size={18} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-on-surface-variant">{s.title}</p>
              <p className="text-xl font-bold text-white mt-0.5">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by user or video..." className="flex-1" />
        <FilterSelect value={statusFilter} onChange={setStatusFilter} options={statusOptions} placeholder="All Status" />
      </div>

      <div className="glass-card rounded-xl overflow-hidden card-glow" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.02), transparent)" }}>
        {filtered.length === 0 ? (
          <EmptyState icon="content_cut" title="No clipping jobs found" description="No jobs match your current filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-surface-border/50 text-on-surface-variant text-[10px] uppercase tracking-wider">
                  <th className="text-left px-3 py-3 font-medium">User</th>
                  <th className="text-left px-3 py-3 font-medium">Video Name</th>
                  <th className="text-left px-3 py-3 font-medium">File Size</th>
                  <th className="text-left px-3 py-3 font-medium">Reels Req / Gen</th>
                  <th className="text-left px-3 py-3 font-medium">Clip Length</th>
                  <th className="text-left px-3 py-3 font-medium">Aspect</th>
                  <th className="text-left px-3 py-3 font-medium">Status</th>
                  <th className="text-left px-3 py-3 font-medium">Failed</th>
                  <th className="text-left px-3 py-3 font-medium">Credits</th>
                  <th className="text-left px-3 py-3 font-medium">Created</th>
                  <th className="text-left px-3 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((job) => (
                  <tr key={job.id} className="border-b border-surface-border/20 hover:bg-surface-container-low transition-colors">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">{job.user_name.charAt(0)}</div>
                        <span className="font-medium text-white">{job.user_name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-white max-w-[140px] truncate">{job.video_name}</td>
                    <td className="px-3 py-3 text-on-surface-variant">{formatSize(job.file_size)}</td>
                    <td className="px-3 py-3 text-white">{job.generated_reels}/{job.reels_requested}</td>
                    <td className="px-3 py-3 text-on-surface-variant">{job.clip_length}s</td>
                    <td className="px-3 py-3 text-on-surface-variant">{job.aspect_ratio}</td>
                    <td className="px-3 py-3"><StatusBadge status={job.status} /></td>
                    <td className="px-3 py-3">
                      {job.failed_clips > 0 ? (
                        <span className="text-error font-medium">{job.failed_clips}</span>
                      ) : (
                        <span className="text-on-surface-variant">{job.failed_clips}</span>
                      )}
                    </td>
                    <td className="px-3 py-3"><CreditBadge amount={job.credits_used} /></td>
                    <td className="px-3 py-3 text-on-surface-variant whitespace-nowrap">{formatDate(job.created_at)}</td>
                    <td className="px-3 py-3">
                      <ActionMenu
                        items={[
                          { label: "View Job", icon: "visibility", onClick: () => setViewJob(job) },
                          { label: "Retry Job", icon: "refresh", onClick: () => {} },
                          { label: "Cancel Job", icon: "close", variant: "danger", onClick: () => setConfirmAction({ type: "cancel", job }) },
                          { label: "Refund Credits", icon: "currency_bitcoin", variant: "success", onClick: () => setConfirmAction({ type: "refund", job }) },
                          { label: "Download ZIP", icon: "download", onClick: () => {} },
                          { label: "Delete Source Video", icon: "delete", variant: "danger", onClick: () => setConfirmAction({ type: "delete_source", job }) },
                          { label: "Delete Generated Clips", icon: "delete_sweep", variant: "danger", onClick: () => setConfirmAction({ type: "delete_clips", job }) },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setViewJob(null)}>
          <div className="bg-surface-container border border-surface-border/80 rounded-2xl max-w-2xl w-full mx-4 animate-dropdown-open" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon name="content_cut" className="text-primary" size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{viewJob.video_name}</h3>
                  <p className="text-[10px] text-on-surface-variant">{viewJob.id}</p>
                </div>
              </div>
              <button onClick={() => setViewJob(null)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container-high border border-surface-border/50 hover:bg-surface-container-higher transition-all">
                <Icon name="close" className="text-on-surface-variant" size={14} />
              </button>
            </div>
            <div className="px-5 pb-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">User</p>
                  <p className="text-xs font-medium text-white">{viewJob.user_name}</p>
                  <p className="text-[10px] text-on-surface-variant">{viewJob.user_id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Status</p>
                  <StatusBadge status={viewJob.status} size="md" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">File Size</p>
                  <p className="text-xs font-medium text-white">{formatSize(viewJob.file_size)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Video</p>
                  <p className="text-xs font-mono text-white">{viewJob.video_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Reels Requested</p>
                  <p className="text-xs font-medium text-white">{viewJob.reels_requested}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Reels Generated</p>
                  <p className="text-xs font-medium text-white">{viewJob.generated_reels}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Clip Length</p>
                  <p className="text-xs font-medium text-white">{viewJob.clip_length}s</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Aspect Ratio</p>
                  <p className="text-xs font-medium text-white">{viewJob.aspect_ratio}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Failed Clips</p>
                  <p className={`text-xs font-medium ${viewJob.failed_clips > 0 ? "text-error" : "text-white"}`}>{viewJob.failed_clips}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Credits Used</p>
                  <CreditBadge amount={viewJob.credits_used} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Created</p>
                  <p className="text-xs font-medium text-white">{formatDate(viewJob.created_at)}</p>
                </div>
                {viewJob.error_message && (
                  <div className="col-span-2 space-y-1">
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Error</p>
                    <p className="text-xs text-error bg-error/10 rounded-lg px-3 py-2">{viewJob.error_message}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmAction?.type === "cancel"}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => setConfirmAction(null)}
        title="Cancel Job"
        message={`Are you sure you want to cancel this clipping job for ${confirmAction?.job?.user_name}?`}
        confirmLabel="Cancel Job"
        confirmVariant="danger"
      />
      <ConfirmModal
        open={confirmAction?.type === "refund"}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => setConfirmAction(null)}
        title="Refund Credits"
        message={`Refund ${confirmAction?.job?.credits_used} credits to ${confirmAction?.job?.user_name}?`}
        confirmLabel="Refund Credits"
        confirmVariant="primary"
      />
      <ConfirmModal
        open={confirmAction?.type === "delete_source"}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => setConfirmAction(null)}
        title="Delete Source Video"
        message={`Delete the source video "${confirmAction?.job?.video_name}" permanently? This cannot be undone.`}
        confirmLabel="Delete Video"
        confirmVariant="danger"
      />
      <ConfirmModal
        open={confirmAction?.type === "delete_clips"}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => setConfirmAction(null)}
        title="Delete Generated Clips"
        message={`Delete all generated clips for this job? This cannot be undone.`}
        confirmLabel="Delete Clips"
        confirmVariant="danger"
      />
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import AuthGuard from "../components/AuthGuard";
import { SidebarProvider } from "../components/SidebarContext";
import Icon from "../components/Icon";

export default function LibraryPage() {
  const router = useRouter();
  const [generations, setGenerations] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [activeTab, setActiveTab] = useState("video");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const fetchGenerations = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const res = await fetch("/api/generations", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setGenerations(Array.isArray(json.data) ? json.data : []);
      setActiveJobs(Array.isArray(json.activeJobs) ? json.activeJobs : []);
    } catch {
      // Keep the last successfully loaded library visible.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGenerations(true);
  }, [fetchGenerations]);

  // Keep the Library in sync with generations started in another workspace.
  useEffect(() => {
    const interval = setInterval(() => fetchGenerations(false), 8000);
    return () => clearInterval(interval);
  }, [fetchGenerations]);

  // Resolve saved video jobs while the user is viewing the Library. A completed
  // job is then loaded from the generations table; pending jobs keep their spinner.
  useEffect(() => {
    if (!activeJobs.length) return;
    let cancelled = false;
    const checkJobs = async () => {
      const results = await Promise.all(activeJobs.map(async (job) => {
        try {
          const params = new URLSearchParams({
            requestId: job.request_id,
            modelId: job.model_id || "",
          });
          const response = await fetch(`/api/generate-video?${params.toString()}`, { cache: "no-store" });
          if (!response.ok) return null;
          const data = await response.json();
          return data.status === "COMPLETED" || data.status === "FAILED" || data.status === "CANCELLED";
        } catch {
          return null;
        }
      }));
      if (!cancelled && results.some(Boolean)) fetchGenerations(false);
    };
    const interval = setInterval(checkJobs, 7000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeJobs, fetchGenerations]);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      const response = await fetch(`/api/generations/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not remove generation");
      setGenerations((prev) => prev.filter((g) => g.id !== id));
    } catch {
      // Keep the item visible if deletion did not succeed.
    } finally {
      setDeleting(null);
    }
  };

  const getMediaType = (type) => {
    const value = (type || "").toLowerCase();
    if (value.includes("video")) return "video";
    if (value.includes("image")) return "image";
    return value;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const videoItems = generations.filter((item) => getMediaType(item.type) === "video");
  const imageItems = generations.filter((item) => getMediaType(item.type) === "image");
  const visibleItems = activeTab === "video" ? videoItems : imageItems;

  const tabs = [
    { id: "video", label: "AI Video", icon: "videocam", count: videoItems.length + activeJobs.length },
    { id: "image", label: "AI Image", icon: "image", count: imageItems.length },
  ];

  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="h-screen overflow-hidden no-x-scroll">
          <Sidebar />
          <TopBar />
          <main className="fixed top-14 md:top-16 right-0 w-full md:w-[calc(100%-16rem)] bottom-0 overflow-y-auto smooth-scroll">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-9">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-white">
                      <Icon name="video_library" size={21} />
                    </span>
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight text-white">Library</h1>
                      <p className="text-xs text-on-surface-variant mt-0.5">All your AI creations, in one place</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant">Your generations are stored for 30 days</p>
              </div>

              <div className="flex items-center gap-2 border-b border-white/[0.08] mb-6">
                {tabs.map((tab) => {
                  const selected = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors ${selected ? "text-white" : "text-white/45 hover:text-white/75"}`}
                    >
                      <Icon name={tab.icon} size={17} />
                      <span>{tab.label}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] tabular-nums ${selected ? "bg-white/10 text-white/80" : "bg-white/[0.05] text-white/40"}`}>
                        {tab.count}
                      </span>
                      {selected && <span className="absolute bottom-[-1px] left-3 right-3 h-0.5 rounded-full bg-primary" />}
                    </button>
                  );
                })}
              </div>

              {loading ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="relative mb-4 h-10 w-10">
                    <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                    <div className="absolute inset-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                  <p className="text-sm font-medium text-white/75">Loading your creations...</p>
                  <p className="mt-1 text-xs text-white/35">Your Library will be ready in a moment</p>
                </div>
              ) : (
                <>
                  {activeTab === "video" && activeJobs.length > 0 && (
                    <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {activeJobs.map((job) => (
                        <div key={job.request_id} className="overflow-hidden rounded-2xl border border-primary/20 bg-primary/[0.045]">
                          <div className="aspect-[4/3] bg-black/20 flex flex-col items-center justify-center">
                            <div className="relative mb-3 h-10 w-10">
                              <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                              <div className="absolute inset-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                              <Icon name="videocam" size={16} className="absolute inset-0 m-auto text-white/75" />
                            </div>
                            <span className="text-xs font-semibold text-white/85">Generating video</span>
                            <span className="mt-1 text-[10px] text-white/40">This may take a few minutes</span>
                          </div>
                          <div className="p-3">
                            <p className="truncate text-xs font-medium text-white/80">{(job.model_id || "AI Video").split("/").pop()}</p>
                            <div className="mt-2 flex items-center gap-2 text-[10px] text-primary/90">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                              In progress
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {visibleItems.length === 0 && !(activeTab === "video" && activeJobs.length > 0) ? (
                    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-5 text-center">
                      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-white/45">
                        <Icon name={activeTab === "video" ? "videocam" : "image"} size={27} />
                      </span>
                      <p className="text-base font-semibold text-white">No {activeTab === "video" ? "videos" : "images"} yet</p>
                      <p className="mt-1 max-w-sm text-xs text-white/40">
                        {activeTab === "video" ? "Videos you generate will appear here automatically." : "Images you generate will appear here automatically."}
                      </p>
                      <button
                        type="button"
                        onClick={() => router.push(activeTab === "video" ? "/ai-video" : "/ai-image")}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/[0.12]"
                      >
                        <Icon name={activeTab === "video" ? "videocam" : "image"} size={15} />
                        Create {activeTab === "video" ? "video" : "image"}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {visibleItems.map((gen) => {
                        const isVideo = getMediaType(gen.type) === "video";
                        const thumbUrl = gen.thumbnail_url || gen.output_url;
                        return (
                          <div key={gen.id} className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-surface-container-low transition-all hover:border-white/15 hover:bg-white/[0.045]">
                            <div className="relative aspect-[4/3] overflow-hidden bg-surface-container-high">
                              {thumbUrl ? (
                                <>
                                  {isVideo ? (
                                    <video
                                      src={thumbUrl}
                                      muted
                                      loop
                                      playsInline
                                      className="h-full w-full object-cover"
                                      onMouseEnter={(event) => event.currentTarget.play().catch(() => {})}
                                      onMouseLeave={(event) => event.currentTarget.pause()}
                                    />
                                  ) : (
                                    <img src={thumbUrl} alt={gen.prompt || "Generated image"} className="h-full w-full object-cover" loading="lazy" />
                                  )}
                                  {isVideo && (
                                    <span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-black/65 text-white backdrop-blur">
                                      <Icon name="play_arrow" size={16} />
                                    </span>
                                  )}
                                </>
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-white/35">
                                  <Icon name={isVideo ? "videocam" : "image"} size={32} />
                                </div>
                              )}
                            </div>

                            <div className="p-3.5">
                              <p className="truncate text-xs font-semibold text-white/85">{gen.prompt || "Untitled creation"}</p>
                              <div className="mt-2 flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium ${isVideo ? "bg-primary/10 text-primary" : "bg-violet-400/10 text-violet-300"}`}>
                                  <Icon name={isVideo ? "videocam" : "image"} size={12} />
                                  {isVideo ? "AI Video" : "AI Image"}
                                </span>
                                {gen.model && <span className="truncate text-[10px] text-white/35">{gen.model.split("/").pop()}</span>}
                              </div>
                              <p className="mt-2 text-[10px] text-white/35">{formatDate(gen.created_at)}</p>
                            </div>

                            <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                              {gen.output_url && (
                                <a href={gen.output_url} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-black/65 text-white transition-colors hover:bg-white/20" title="Download">
                                  <Icon name="download" size={14} />
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDelete(gen.id)}
                                disabled={deleting === gen.id}
                                className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-black/65 text-white transition-colors hover:bg-red-500/50 disabled:opacity-40"
                                title="Remove"
                              >
                                <Icon name="delete" size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}

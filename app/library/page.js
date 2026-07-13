"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import AuthGuard from "../components/AuthGuard";
import { SidebarProvider } from "../components/SidebarContext";
import Icon from "../components/Icon";

export default function LibraryPage() {
  const router = useRouter();
  const [generations, setGenerations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const fetchGenerations = async () => {
    try {
      const res = await fetch("/api/generations");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setGenerations(json.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGenerations(); }, []);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await fetch(`/api/generations/${id}`, { method: "DELETE" });
      setGenerations((prev) => prev.filter((g) => g.id !== id));
    } catch {
      // ignore
    } finally {
      setDeleting(null);
    }
  };

  const getMediaType = (type) => {
    const t = (type || "").toLowerCase();
    if (t.includes("video")) return "video";
    if (t.includes("image")) return "image";
    return t;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="h-screen overflow-hidden no-x-scroll">
          <Sidebar />
          <TopBar />
          <main className="fixed top-14 md:top-16 right-0 w-full md:w-[calc(100%-16rem)] bottom-0 overflow-y-auto smooth-scroll">
            <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-white">Library</h1>
                  <p className="text-sm text-on-surface-variant mt-1">Your generations are stored for 30 days</p>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : generations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
                  <Icon name="folder_open" size={48} className="mb-4 opacity-40" />
                  <p className="text-lg font-medium">No generations yet</p>
                  <p className="text-sm mt-1">Generate videos or images and they will appear here</p>
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => router.push("/ai-video")} className="px-5 py-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all text-sm font-medium">AI Video</button>
                    <button onClick={() => router.push("/ai-image")} className="px-5 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-sm font-medium">Image Lab</button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {generations.map((gen) => {
                    const mediaType = getMediaType(gen.type);
                    const isVideo = mediaType === "video";
                    const thumbUrl = gen.thumbnail_url || gen.output_url;

                    return (
                      <div key={gen.id} className="group relative rounded-2xl overflow-hidden border border-white/5 bg-surface-container-low hover:border-white/10 transition-all">
                        <div className="aspect-[4/3] bg-surface-container-high overflow-hidden relative">
                          {thumbUrl ? (
                            <>
                              {isVideo ? (
                                <video src={thumbUrl} muted loop playsInline className="w-full h-full object-cover" onMouseEnter={(e) => e.target.play()} onMouseLeave={(e) => e.target.pause()} />
                              ) : (
                                <img src={thumbUrl} alt={gen.prompt || "Generation"} className="w-full h-full object-cover" loading="lazy" />
                              )}
                              {isVideo && (
                                <div className="absolute bottom-2 right-2 w-7 h-7 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                  <Icon name="play_arrow" className="text-white" size={14} />
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                              <Icon name={isVideo ? "videocam" : "image"} size={32} />
                            </div>
                          )}
                        </div>

                        <div className="p-3">
                          <p className="text-xs font-medium text-white/80 truncate">{gen.prompt || "(no prompt)"}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-on-surface-variant uppercase">{gen.type || "Unknown"}</span>
                            {gen.model && <span className="text-[10px] text-on-surface-variant truncate">{gen.model.split("/").pop()}</span>}
                          </div>
                          <p className="text-[10px] text-on-surface-variant mt-1">{formatDate(gen.created_at)}</p>
                        </div>

                        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {gen.output_url && (
                            <a href={gen.output_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-xl bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all" title="Download">
                              <Icon name="download" className="text-white" size={14} />
                            </a>
                          )}
                          <button onClick={() => handleDelete(gen.id)} disabled={deleting === gen.id} className="w-8 h-8 rounded-xl bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-red-500/40 transition-all" title="Remove">
                            <Icon name="delete" className={`text-white ${deleting === gen.id ? "opacity-40" : ""}`} size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}

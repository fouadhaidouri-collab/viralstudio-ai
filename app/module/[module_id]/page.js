"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import ProfileDropdown from "../../components/ProfileDropdown";
import { SidebarProvider, useSidebar } from "../../components/SidebarContext";
import InsufficientCreditsModal from "../../components/InsufficientCreditsModal";
import Icon from "../../components/Icon";
import ModuleForm from "../../components/ModuleForm";

const TEMPLATE_VIDEOS = Array.from({ length: 11 }, (_, i) => `/templates/template${i + 1}.mp4`);

export default function ModulePage({ params }) {
  const router = useRouter();
  const [moduleId, setModuleId] = useState(null);
  const [module, setModule] = useState(null);
  const [values, setValues] = useState({});
  const [generating, setGenerating] = useState(false);
  const [outputUrls, setOutputUrls] = useState([]);
  const [error, setError] = useState(null);
  const [credits, setCredits] = useState(0);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [neededCredits, setNeededCredits] = useState(0);
  const [bgVideoIdx, setBgVideoIdx] = useState(0);
  const { setMobileOpen } = useSidebar();

  useEffect(() => {
    const interval = setInterval(() => {
      setBgVideoIdx((prev) => (prev + 1) % TEMPLATE_VIDEOS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function load() {
      const p = await params;
      setModuleId(p.module_id);

      const [modRes, credRes] = await Promise.all([
        fetch(`/api/modules/${p.module_id}`),
        fetch("/api/credits"),
      ]);
      const modData = await modRes.json();
      const credData = await credRes.json();

      if (modData.module) {
        setModule(modData.module);
        const defaults = {};
        for (const f of modData.module.fields) {
          if (f.default != null) defaults[f.name] = f.default;
        }
        defaults.prompt = "";
        setValues(defaults);
      }
      if (credData.balance != null) setCredits(credData.balance);
    }
    load();
  }, [params]);

  const handleGenerate = async () => {
    if (!values.prompt?.trim()) return;

    const estimateRes = await fetch(`/api/modules/${moduleId}/estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const estimate = await estimateRes.json();

    if (estimate.pricing_unavailable || estimate.credits_required == null) {
      setError("Pricing unavailable for this module");
      return;
    }

    if (credits < estimate.credits_required) {
      setNeededCredits(estimate.credits_required);
      setShowCreditModal(true);
      return;
    }

    setGenerating(true);
    setOutputUrls([]);
    setError(null);

    try {
      const genRes = await fetch(`/api/modules/${moduleId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const genData = await genRes.json();

      if (!genData.success) {
        throw new Error(genData.error || "Generation failed");
      }

      const { requestId } = genData;

      let done = false;
      while (!done) {
        await new Promise((r) => setTimeout(r, 2000));
        const statusRes = await fetch(`/api/modules/${moduleId}/status?requestId=${requestId}`);
        const statusData = await statusRes.json();

        if (statusData.status === "COMPLETED") {
          if (statusData.outputUrl) {
            setOutputUrls([statusData.outputUrl]);
          }
          done = true;
        } else if (statusData.status === "FAILED" || statusData.status === "CANCELLED") {
          throw new Error(`Generation ${statusData.status.toLowerCase()}`);
        }
      }

      const credRes = await fetch("/api/credits");
      const credData = await credRes.json();
      if (credData.balance != null) setCredits(credData.balance);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (!module) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <p className="text-on-surface-variant">Loading module...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="h-screen overflow-hidden no-x-scroll">
        <Sidebar />
        <div className="fixed inset-0 overflow-hidden z-0">
          {TEMPLATE_VIDEOS.map((src, i) => (
            <video key={src} src={src} muted autoPlay loop playsInline
              className={`absolute inset-0 w-full h-full object-fill transition-opacity duration-1000 ${i === bgVideoIdx ? "opacity-70" : "opacity-0"}`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-background/20 via-background/10 to-background/30"></div>
        </div>

        <header className="fixed top-0 right-0 w-full md:w-[calc(100%-16rem)] h-14 md:h-16 bg-surface/70 backdrop-blur-xl border-b border-surface-border/50 z-40 flex items-center justify-between md:justify-end px-4 md:px-8">
          <button onPointerDown={() => setMobileOpen(true)} className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-low border border-surface-border/50 hover:bg-surface-container-high transition-all" style={{ touchAction: 'manipulation' }}>
            <Icon name="menu" className="text-white text-xl" />
          </button>
          <div className="flex items-center gap-3 md:gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low border border-surface-border/60 rounded-xl">
              <Icon name="bolt" className="text-sm text-yellow-400" />
              <span className="text-sm font-bold text-yellow-400">{credits}</span>
              <button onClick={() => router.push("/pricing")} className="ml-1 w-5 h-5 flex items-center justify-center rounded-full bg-yellow-400/15 hover:bg-yellow-400/25 transition-all">
                <Icon name="add" className="text-[10px] text-yellow-400" />
              </button>
            </div>
            <div className="h-8 w-px bg-surface-border"></div>
            <ProfileDropdown />
          </div>
        </header>

        <main style={{ height: 'calc(100vh - 3.5rem)' }} className="fixed top-14 md:top-16 right-0 w-full md:w-[calc(100%-16rem)]">
          <div className="relative z-10 h-full p-3 md:p-5 lg:pl-6 lg:pr-0 flex flex-col xl:grid xl:grid-cols-[480px_1fr] gap-3 md:gap-4 xl:gap-5 overflow-y-auto smooth-scroll">
            <div className="flex flex-col flex-1">
              <div className="glass-card rounded-xl p-4 lg:p-5 border border-white/5 flex-1 flex flex-col gap-0 card-glow" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Icon name="view_module" className="text-primary text-lg" />
                  <h2 className="text-sm font-semibold">{module.display_name}</h2>
                  {module.pricing_unavailable ? (
                    <span className="text-[10px] text-yellow-400 ml-auto">Pricing unavailable</span>
                  ) : module.estimated_credits != null ? (
                    <span className="text-[10px] text-yellow-400 ml-auto">From {module.estimated_credits} cr</span>
                  ) : null}
                </div>

                <ModuleForm
                  fields={module.fields}
                  requiredFields={module.required_fields}
                  values={values}
                  onChange={setValues}
                  disabled={generating}
                />

                <div className="mt-auto pt-4">
                  <button
                    onClick={handleGenerate}
                    disabled={generating || !values.prompt?.trim()}
                    className="w-full primary-gradient text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-primary/25 flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.97] hover:translate-y-[-1px] disabled:opacity-60 disabled:cursor-not-allowed text-xs"
                  >
                    {generating ? (
                      <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Generating...</>
                    ) : (
                      <><Icon name="auto_awesome" className="text-sm" /> Generate</>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 min-w-0">
              <div className="glass-card rounded-2xl relative bg-black flex-1 flex flex-col border border-white/5 card-glow min-h-[300px]">
                {outputUrls.length > 0 ? (
                  <div className="p-4">
                    {outputUrls.map((url, i) => (
                      url.includes(".mp4") || url.includes(".webm")
                        ? <video key={i} src={url} controls className="w-full rounded-lg" />
                        : <img key={i} src={url} alt={`Output ${i + 1}`} className="w-full rounded-lg" />
                    ))}
                  </div>
                ) : generating ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center animate-pulse mx-auto mb-4">
                      <Icon name="hourglass_top" className="text-primary text-3xl" />
                    </div>
                    <h3 className="text-lg font-semibold">Generating...</h3>
                    <p className="text-sm text-on-surface-variant mt-1">This usually takes 30–90 seconds</p>
                  </div>
                ) : error ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon name="error_outline" className="text-red-400 text-3xl" />
                    </div>
                    <h3 className="text-lg font-semibold">Generation Failed</h3>
                    <p className="text-sm text-red-400/80 mt-1">{error}</p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(168,85,247,0.08) 0%, transparent 70%)' }} />
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center animate-pulse mb-4">
                        <Icon name="play_circle" className="text-primary text-3xl" />
                      </div>
                      <p className="text-sm text-on-surface-variant">Configure and generate</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {showCreditModal && <InsufficientCreditsModal needed={neededCredits} current={credits} onClose={() => setShowCreditModal(false)} />}
      </div>
    </SidebarProvider>
  );
}

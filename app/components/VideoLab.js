"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import ProfileDropdown from "./ProfileDropdown";
import { SidebarProvider } from "./SidebarContext";
import MenuButton from "./MenuButton";
import { useAuth } from "../lib/AuthContext";
import InsufficientCreditsModal from "./InsufficientCreditsModal";
import Icon from "./Icon";
import useScrollActivated from "../lib/useScrollActivated";
import useLiveCredits from "../lib/useLiveCredits";
import VideoModelCatalog from "./VideoModelCatalog";
import { videoAspectRatios } from "../lib/capabilities";
import {
  AUDIO_NATIVE,
  AUDIO_SILENT,
  estimateCredits,
  getVideoModels,
} from "../lib/videoCatalog";

function AspectIcon({ label, size = "text-sm" }) {
  const ratioStr = label.split(" ").find((s) => s.includes(":")) || label;
  const [w, h] = ratioStr.split(":").map(Number);
  if (isNaN(w) || isNaN(h)) return null;
  const max = 16;
  const ratio = w / h;
  let width, height;
  if (ratio >= 1) {
    width = max;
    height = max / ratio;
  } else {
    height = max;
    width = max * ratio;
  }
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`${size} shrink-0`}
      style={{ minWidth: width }}
    >
      <rect
        x="0.5"
        y="0.5"
        width={width - 1}
        height={height - 1}
        rx="1.5"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.7"
      />
    </svg>
  );
}

const TEMPLATE_VIDEOS = Array.from(
  { length: 11 },
  (_, i) => `/templates/template${i + 1}.mp4`
);
const DEFAULT_PREVIEW_VIDEO = "https://d2w6xqzevsijyc.cloudfront.net/api/JIGywbUnFHXqTrXkDEVVhKzBdET2/afbiZH2XVI8Px0z0sx7R_0.mp4";

const normalizeProgress = (value) => {
  let progress = null;
  if (typeof value === "number") {
    progress = value;
  } else if (typeof value === "string" && value.trim() !== "") {
    progress = Number(value);
  } else if (value && typeof value === "object") {
    progress = Number(
      value.percent ?? value.percentage ?? value.progress ?? value.value
    );
  }
  if (!Number.isFinite(progress)) return null;
  return Math.max(0, Math.min(100, progress));
};

function compressImage(file, maxSide = 1024, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Unsupported image format."));
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function cropImageToAspect(dataUrl, aspectLabel, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const ratio = String(aspectLabel || "")
      .split(":")
      .map(Number);
    if (ratio.length !== 2 || !ratio[0] || !ratio[1]) {
      resolve(dataUrl);
      return;
    }
    const targetRatio = ratio[0] / ratio[1];
    const img = new Image();
    img.onerror = () =>
      reject(new Error("Could not prepare the uploaded image."));
    img.onload = () => {
      const sourceRatio = img.width / img.height;
      let sx = 0;
      let sy = 0;
      let sw = img.width;
      let sh = img.height;

      if (sourceRatio > targetRatio) {
        sw = Math.round(img.height * targetRatio);
        sx = Math.round((img.width - sw) / 2);
      } else if (sourceRatio < targetRatio) {
        sh = Math.round(img.width / targetRatio);
        sy = Math.round((img.height - sh) / 2);
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, sw);
      canvas.height = Math.max(1, sh);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = dataUrl;
  });
}

function prettyResolution(value) {
  if (!value) return "Auto";
  const text = String(value);
  if (text.toLowerCase() === "4k") return "4K";
  if (text.toLowerCase() === "2k") return "2K";
  return text;
}

function Dropdown({ label, value, options, onChange, compact }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      <div
        className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/40"
        style={{ fontFamily: "Geist, sans-serif" }}
      >
        {label}
      </div>
      <button
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] shadow-sm transition-all duration-200 hover:border-primary/40 hover:from-primary/[0.08] hover:to-primary/[0.02] ${
          compact ? "px-3 py-2.5 text-xs" : "px-3 py-2.5 text-sm"
        }`}
      >
        <span className="flex min-w-0 items-center gap-1.5 truncate font-medium">
          {(() => {
            const match = options.find(
              (o) => (typeof o === "string" ? o : o.label) === value
            );
            if (match && typeof match !== "string") {
              if (match.label?.includes(":"))
                return (
                  <>
                    <AspectIcon label={match.label} />
                    {value}
                  </>
                );
              return (
                <>
                  <Icon
                    name={match.icon}
                    className="text-sm"
                    style={{ color: match.color || "#d2bbff" }}
                  />
                  {value}
                </>
              );
            }
            return value;
          })()}
        </span>
        <Icon
          name="expand_more"
          className={`shrink-0 text-sm text-on-surface-variant transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 right-0 z-50 mb-2 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-surface-container/95 py-1.5 shadow-2xl backdrop-blur-xl">
          {options.map((opt) => {
            const optVal = typeof opt === "string" ? opt : opt.label;
            return (
              <button
                key={optVal}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 border-l-2 px-3 py-2.5 text-left text-sm transition-all duration-150 ${
                  value === optVal
                    ? "border-primary bg-primary/15 text-white"
                    : "border-transparent text-on-surface hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {typeof opt !== "string" &&
                  (opt.label?.includes(":") ? (
                    <AspectIcon label={opt.label} />
                  ) : (
                    <Icon
                      name={opt.icon}
                      className="text-base"
                      style={{ color: opt.color || "#d2bbff" }}
                    />
                  ))}
                {optVal}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ModelPickerButton({ model, credits, onClick }) {
  return (
    <div className="w-full">
      <div
        className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/40"
        style={{ fontFamily: "Geist, sans-serif" }}
      >
        AI Model
      </div>
      <button
        onClick={onClick}
        className="group flex w-full items-center gap-3 rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] px-3 py-2.5 text-left shadow-sm transition-all duration-200 hover:border-primary/40 hover:from-primary/[0.08] hover:to-primary/[0.02] active:scale-[0.99]"
      >
        <img
          src={`/logos/${model.logo}`}
          alt={model.provider}
          className="h-9 w-9 shrink-0 rounded-lg border border-white/10 object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-semibold text-white">
              {model.name}
            </span>
            {model.badge && (
              <span className="shrink-0 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-emerald-300">
                {model.badge}
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[10px] text-white/40">
            {model.provider} · {model.speed} · {prettyResolution(model.maxResolution)} ·{" "}
            {model.durationLabel}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xs font-bold text-yellow-300">{credits}</div>
          <div className="text-[8px] uppercase tracking-wider text-white/30">
            credits
          </div>
        </div>
        <Icon
          name="expand_more"
          className="shrink-0 text-sm text-white/35 transition-colors group-hover:text-primary"
        />
      </button>
    </div>
  );
}

function AudioControl({ model, enabled, onToggle }) {
  if (model.audioMode === AUDIO_SILENT) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] text-white/35">
            <Icon name="volume_off" className="text-base" />
          </span>
          <div>
            <p className="text-[11px] font-medium text-white/70">Audio</p>
            <p className="text-[9px] text-white/30">
              This model generates silent video.
            </p>
          </div>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/35">
          Silent
        </span>
      </div>
    );
  }

  const included = model.audioMode === AUDIO_NATIVE;
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2">
      <div className="flex items-center gap-2">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg ${
            enabled || included
              ? "bg-primary/15 text-primary"
              : "bg-white/[0.04] text-white/35"
          }`}
        >
          <Icon
            name={enabled || included ? "volume_up" : "volume_off"}
            className="text-base"
          />
        </span>
        <div>
          <p className="text-[11px] font-medium text-white/80">Audio</p>
          <p className="text-[9px] text-white/35">
            {included
              ? "Native audio is included with this model."
              : enabled
                ? "Generate synchronized audio with the video."
                : "Audio is turned off for this generation."}
          </p>
        </div>
      </div>
      {included ? (
        <span className="rounded-full border border-sky-400/25 bg-sky-400/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-sky-300">
          Included
        </span>
      ) : (
        <button
          onClick={onToggle}
          className={`relative h-6 w-11 shrink-0 rounded-full border transition-all duration-200 ${
            enabled
              ? "border-primary/40 bg-primary/70"
              : "border-white/15 bg-white/[0.06]"
          }`}
          aria-label="Toggle audio"
        >
          <span
            className={`absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white shadow transition-all duration-200 ${
              enabled ? "left-[22px]" : "left-0.5"
            }`}
            style={{ height: 18, width: 18 }}
          />
        </button>
      )}
    </div>
  );
}

export default function VideoLab({ mode = "image" }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const isTextMode = mode === "text";
  const models = getVideoModels(mode);

  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(models[0]);
  const [modelConfigs, setModelConfigs] = useState({});
  const [videoCount, setVideoCount] = useState(1);
  const [images, setImages] = useState([]);
  const [lastFrame, setLastFrame] = useState(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [generatedInCurrentRun, setGeneratedInCurrentRun] = useState(0);
  const [videoUrls, setVideoUrls] = useState([]);
  const [generationBatch, setGenerationBatch] = useState([]);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const videoHistoryRef = useRef(null);
  const [videoError, setVideoError] = useState(null);
  const [creditSettings, setCreditSettings] = useState({
    credit_usd_value: 0.01,
    default_markup_multiplier: 2.0,
    minimum_generation_credits: 1,
  });
  const credits = useLiveCredits();
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [neededCredits, setNeededCredits] = useState(0);
  const fileInputRef = useRef();
  const lastFrameInputRef = useRef();
  const [bgVideoIdx, setBgVideoIdx] = useState(0);
  const scrollActivated = useScrollActivated();

  const nativeArs = model.options?.aspect_ratio || [];
  const supportsNativeAspectRatio = !!model.nativeAspectRatio;
  const availableAspectRatios =
    supportsNativeAspectRatio && nativeArs.length > 0
      ? videoAspectRatios.filter((ar) =>
          nativeArs.some(
            (value) => String(value).toLowerCase() === ar.label.toLowerCase()
          )
        )
      : videoAspectRatios;
  const availableResolutions = model.options?.resolution || [];
  const baseDurations =
    model.options?.duration?.length > 0
      ? model.options.duration
      : ["5 seconds"];

  const defaultConfigFor = (m) => {
    const ars =
      m.nativeAspectRatio && m.options?.aspect_ratio?.length > 0
        ? videoAspectRatios.filter((ar) =>
            m.options.aspect_ratio.some(
              (value) => String(value).toLowerCase() === ar.label.toLowerCase()
            )
          )
        : videoAspectRatios;
    return {
      aspectRatio: ars[0] || videoAspectRatios[0],
      resolution: m.options?.resolution?.[0] || "",
      duration: m.options?.duration?.[0] || "5 seconds",
      audio: m.audioMode !== AUDIO_SILENT,
    };
  };

  const rawConfig = modelConfigs[model.id] || defaultConfigFor(model);
  const initialResolution = availableResolutions.includes(rawConfig.resolution)
    ? rawConfig.resolution
    : availableResolutions[0] || "";
  const availableDurations =
    model.resolutionDurations?.[initialResolution] || baseDurations;
  const currentConfig = {
    ...rawConfig,
    aspectRatio: availableAspectRatios.some(
      (ar) => ar.label === rawConfig.aspectRatio?.label
    )
      ? rawConfig.aspectRatio
      : availableAspectRatios[0],
    resolution: initialResolution,
    duration: availableDurations.includes(rawConfig.duration)
      ? rawConfig.duration
      : availableDurations[0],
    audio:
      model.audioMode === AUDIO_SILENT ? false : rawConfig.audio !== false,
  };

  const aspectLabel = currentConfig.aspectRatio?.label;
  const selectedAspectRatio =
    aspectLabel &&
    (aspectLabel.includes(":") || aspectLabel.toLowerCase() === "adaptive")
      ? aspectLabel
      : null;
  const cropAspectRatio =
    selectedAspectRatio && selectedAspectRatio.includes(":")
      ? selectedAspectRatio
      : null;
  const updateConfig = (key, value) => {
    setModelConfigs((prev) => ({
      ...prev,
      [model.id]: { ...currentConfig, [key]: value },
    }));
  };

  const creditsPerVideo = (m = model, config = currentConfig) =>
    estimateCredits(m, creditSettings, {
      duration: config.duration,
      resolution: config.resolution,
      audio: config.audio !== false,
    });

  const totalCredits = (
    m = model,
    config = currentConfig,
    count = videoCount
  ) => creditsPerVideo(m, config) * count;

  const calcStartingCredits = (m) =>
    estimateCredits(m, creditSettings, {
      duration: m.options?.duration?.[0],
      resolution: m.options?.resolution?.[0],
      audio: m.audioMode !== AUDIO_SILENT,
    });

  useEffect(() => {
    setModel(models[0]);
    setLastFrame(null);
    setSelectedVideoIndex(0);
    setVideoError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (!scrollActivated) return;
    const interval = setInterval(() => {
      setBgVideoIdx((prev) => (prev + 1) % TEMPLATE_VIDEOS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [scrollActivated]);

  useEffect(() => {
    if (!generating) {
      setElapsedSeconds(0);
      return;
    }
    const startedAt = Date.now();
    setElapsedSeconds(0);
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [generating]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("prompt");
    if (p) setPrompt(p);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    fetch("/api/generations")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("History unavailable"))))
      .then(async (data) => {
        if (cancelled) return;
        // Completed historical videos stay in Library. Only current-session
        // results are shown in this page's Generated Videos strip.
        const activeJobs = Array.isArray(data.activeJobs) ? data.activeJobs : [];
        if (!activeJobs.length) return;
        setGenerationBatch(activeJobs.map((job) => ({
          id: job.request_id,
          requestId: job.request_id,
          modelId: job.model_id,
          status: "generating",
          videoUrl: null,
        })));
        setGenerating(true);

        await Promise.all(activeJobs.map(async (job) => {
          while (!cancelled) {
            try {
              const response = await fetch(
                `/api/generate-video?requestId=${encodeURIComponent(job.request_id)}&modelId=${encodeURIComponent(job.model_id || "")}`
              );
              const statusData = await response.json();
              if (response.ok && statusData.status === "COMPLETED" && statusData.videoUrl) {
                // This job was completed while the customer was away. The API
                // has already persisted it to ai_generations, so keep it in
                // Library instead of re-adding it to the AI Video results strip.
                setGenerationBatch((items) => items.filter((item) => item.id !== job.request_id));
                if (typeof statusData.balance === "number") {
                  window.dispatchEvent(new CustomEvent("viralstudio:credits-updated", { detail: { balance: statusData.balance } }));
                }
                return;
              }
              if (response.ok && (statusData.status === "FAILED" || statusData.status === "CANCELLED")) {
                setGenerationBatch((items) => items.map((item) =>
                  item.id === job.request_id ? { ...item, status: "failed" } : item
                ));
                if (statusData.error) setVideoError(statusData.error);
                return;
              }
            } catch {
              // Retry transient network/provider errors without losing the saved job.
            }
            await wait(3000);
          }
        }));

        if (!cancelled) setGenerating(false);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    fetch("/api/pricing/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.credit_usd_value) setCreditSettings(data);
      })
      .catch(() => {});
  }, []);

  const handleSelectModel = (nextModel) => {
    setModel(nextModel);
    setCatalogOpen(false);
    setVideoError(null);
    if (!nextModel.supportsLastFrame) setLastFrame(null);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setVideoError("Upload a JPG, PNG, or WebP image.");
      return;
    }
    try {
      const dataUrl = await compressImage(file);
      setImages([dataUrl]);
      setVideoError(null);
    } catch (err) {
      setVideoError(err.message || "Could not prepare that image.");
    }
  };

  const handleLastFrameUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setVideoError("Upload a JPG, PNG, or WebP image.");
      return;
    }
    try {
      const dataUrl = await compressImage(file);
      setLastFrame(dataUrl);
      setVideoError(null);
    } catch (err) {
      setVideoError(err.message || "Could not prepare that image.");
    }
  };

  const removeImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const generateOne = async () => {
    const modelId = model.model_id;
    if (!modelId) throw new Error(`Unknown model: ${model.name}`);

    let imagePayload = isTextMode ? null : images[0] || null;
    if (imagePayload && !supportsNativeAspectRatio && cropAspectRatio) {
      imagePayload = await cropImageToAspect(imagePayload, cropAspectRatio);
    }

    let lastFramePayload = isTextMode ? null : lastFrame || null;
    if (lastFramePayload && !supportsNativeAspectRatio && cropAspectRatio) {
      lastFramePayload = await cropImageToAspect(
        lastFramePayload,
        cropAspectRatio
      );
    }

    const subRes = await fetch("/api/generate-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        prompt: prompt.trim(),
        modelId,
        aspectRatio: selectedAspectRatio,
        resolution: currentConfig.resolution,
        duration: currentConfig.duration,
        audio: currentConfig.audio !== false,
        image: imagePayload,
        lastFrame: lastFramePayload,
      }),
    });

    if (!subRes.ok) {
      const err = await subRes.json();
      throw new Error(err.error || "Failed to submit");
    }

    const { requestId } = await subRes.json();

    let done = false;
    while (!done) {
      await new Promise((r) => setTimeout(r, 2000));
      const statusRes = await fetch(
        `/api/generate-video?requestId=${requestId}&modelId=${modelId}`
      );

      if (!statusRes.ok) {
        const err = await statusRes.json();
        throw new Error(err.error || "Status check failed");
      }

      const statusData = await statusRes.json();

      const progress = normalizeProgress(statusData.progress);
      if (progress != null) setGenerationProgress(progress);

      if (statusData.status === "COMPLETED") {
        if (typeof statusData.balance === "number") window.dispatchEvent(new CustomEvent("viralstudio:credits-updated", { detail: { balance: statusData.balance } }));
        if (statusData.billingError) setVideoError(statusData.billingError);
        return {
          videoUrl: statusData.videoUrl,
          creditsCharged: !statusData.billingError,
          billingError: statusData.billingError || null,
        };
      } else if (
        statusData.status === "FAILED" ||
        statusData.status === "CANCELLED"
      ) {
        throw new Error(
          statusData.error ||
            "The AI generation failed on the provider. No credits were charged."
        );
      }
    }
  };

  const handleGenerate = async () => {
    if (!isTextMode && images.length === 0) {
      setVideoError("Upload an image first. These models animate a still image.");
      return;
    }
    if (model.requiresPrompt && !prompt.trim()) {
      setVideoError(
        isTextMode ? "Write a prompt first." : "This model requires a prompt."
      );
      return;
    }
    if (!isTextMode && model.requiresLastFrame && !lastFrame) {
      setVideoError("Upload an end frame. This model requires one.");
      return;
    }
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const perVideoCredits = creditsPerVideo();
    const needed = perVideoCredits * videoCount;
    if (needed > 0 && credits < needed) {
      setNeededCredits(needed);
      setShowCreditModal(true);
      return;
    }

    setGenerating(true);
    setGeneratedInCurrentRun(0);
    setGenerationProgress(null);
    setVideoError(null);
    setGenerationBatch(Array.from({ length: videoCount }, (_, index) => ({
      id: `batch-${Date.now()}-${index}`,
      status: "generating",
      videoUrl: null,
    })));

    try {
      // Submit and monitor every requested video concurrently. Each request
      // has its own provider job ID and its own server-side credit hold.
      const results = await Promise.all(
        Array.from({ length: videoCount }, async (_, index) => {
          try {
            const generation = await generateOne();
            const url = generation.videoUrl;
            setGeneratedInCurrentRun((count) => count + 1);
            setVideoUrls((current) => [url, ...current.filter((item) => item !== url)]);
            setSelectedVideoIndex(0);
            setGenerationBatch((items) => items.map((item, itemIndex) =>
              itemIndex === index
                ? { ...item, status: "completed", videoUrl: url }
                : item
            ));


            // The generation API persists the completed video server-side,
            // including when the user leaves this page before it finishes.

            return { success: true };
          } catch (err) {
            setGenerationBatch((items) => items.map((item, itemIndex) =>
              itemIndex === index ? { ...item, status: "failed" } : item
            ));
            return {
              success: false,
              error: err.message || "Video generation failed.",
            };
          }
        })
      );

      const failures = results.filter((result) => !result.success);
      if (failures.length > 0) {
        setVideoError(
          `${failures.length} of ${videoCount} videos failed. ${failures[0].error}`
        );
      }
    } finally {
      setGenerating(false);
      setGenerationProgress(null);
    }
  };

  const selectedVideoUrl =
    videoUrls[selectedVideoIndex] || videoUrls[0] || DEFAULT_PREVIEW_VIDEO;

  const generateDisabled =
    generating ||
    (!isTextMode && images.length === 0) ||
    (model.requiresPrompt && !prompt.trim()) ||
    (!isTextMode && model.requiresLastFrame && !lastFrame);

  return (
    <div className="h-screen overflow-hidden no-x-scroll">
      <SidebarProvider>
        <Sidebar />
        <div className="fixed inset-0 z-0 overflow-hidden">
          {!scrollActivated && (
            <img
              src={TEMPLATE_VIDEOS[0].replace(".mp4", ".jpg")}
              alt=""
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-fill opacity-70"
            />
          )}
          {scrollActivated &&
            (() => {
              const cur = bgVideoIdx % TEMPLATE_VIDEOS.length;
              const nxt = (cur + 1) % TEMPLATE_VIDEOS.length;
              return [cur, nxt].map((idx, pos) => (
                <video
                  key={pos}
                  src={TEMPLATE_VIDEOS[idx]}
                  poster={TEMPLATE_VIDEOS[idx].replace(".mp4", ".jpg")}
                  muted
                  autoPlay
                  loop
                  playsInline
                  preload={pos === 0 ? "auto" : "metadata"}
                  className={`absolute inset-0 h-full w-full object-fill transition-opacity duration-1000 ${
                    pos === 0 ? "opacity-70" : "opacity-0"
                  }`}
                />
              ));
            })()}
          <div className="absolute inset-0 bg-gradient-to-r from-background/20 via-background/10 to-background/30"></div>
        </div>
        <header
          className="fixed top-0 right-0 z-40 flex h-14 w-full items-center justify-between border-b border-surface-border/50 bg-surface/70 px-4 backdrop-blur-xl md:h-16 md:w-[calc(100%-16rem)] md:justify-end md:px-8"
          style={{ boxShadow: "0 1px 20px rgba(0,0,0,0.3)" }}
        >
          <MenuButton />
          <div className="flex items-center gap-3 md:gap-6">
            <div className="flex items-center gap-2 rounded-xl border border-surface-border/60 bg-surface-container-low px-3 py-1.5 transition-all duration-200 hover:border-yellow-400/30">
              <Icon name="bolt" className="text-sm text-yellow-400" />
              <span className="text-sm font-bold text-yellow-400">
                {credits}
              </span>
              <button
                onClick={() => router.push("/pricing")}
                className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400/15 transition-all duration-200 hover:scale-110 hover:bg-yellow-400/25 active:scale-95"
              >
                <Icon name="add" className="text-[10px] text-yellow-400" />
              </button>
            </div>
            <div className="h-8 w-px bg-surface-border"></div>
            <ProfileDropdown />
          </div>
        </header>
        <main className="smooth-scroll fixed top-14 right-0 bottom-0 w-full overflow-y-auto md:top-16 md:w-[calc(100%-16rem)]">
          <div className="relative z-10 flex min-h-full flex-col gap-3 p-3 md:p-5 lg:pl-6 lg:pr-0 xl:grid xl:grid-cols-[432px_1fr] md:gap-4 xl:gap-5">
            <div className="flex flex-1 flex-col">
              <div
                className="glass-card card-glow flex flex-1 flex-col gap-0 rounded-xl border border-white/5 p-4 lg:p-5"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.02), transparent)",
                }}
              >
                <div className="mb-3 flex shrink-0 items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Icon
                      name={isTextMode ? "description" : "image"}
                      className="text-base"
                    />
                  </div>
                  <div>
                    <h1 className="text-sm font-semibold text-white">
                      {isTextMode ? "Text to Video" : "Image to Video"}
                    </h1>
                    {isTextMode && (
                      <p className="text-[11px] text-on-surface-variant/60">
                        Describe a scene and generate a video from text.
                      </p>
                    )}
                  </div>
                </div>

                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[200px] w-full resize-none rounded-xl border border-surface-border bg-surface-container-lowest p-4 text-sm outline-none transition-all placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-1 focus:ring-primary xl:flex-1"
                  placeholder={
                    isTextMode
                      ? "Describe the video you want to create. Be as detailed as possible for best results."
                      : "Describe how you want the image to move (optional). Add motion, camera, or scene details."
                  }
                ></textarea>

                {!isTextMode && (
                  <div className="mt-4 flex shrink-0 flex-wrap items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current.click()}
                      className="flex items-center gap-1.5 rounded-xl border border-surface-border/60 bg-surface-container-low px-3.5 py-2 text-xs font-medium transition-all duration-200 hover:border-primary/30 hover:bg-surface-container-high active:scale-95"
                      style={{ fontFamily: "Geist, sans-serif" }}
                    >
                      <Icon name="image" className="text-base" />{" "}
                      {images.length > 0 ? "Replace image" : "Upload image"}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    {!isTextMode && (
                      <button
                        onClick={() => model.supportsLastFrame && lastFrameInputRef.current.click()}
                        disabled={!model.supportsLastFrame}
                        title={!model.supportsLastFrame ? "The selected model does not support an end frame." : "Upload an optional end frame"}
                        className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 ${
                          model.requiresLastFrame && !lastFrame
                            ? "border-amber-400/40 bg-amber-400/10 text-amber-200 hover:bg-amber-400/15"
                            : "border-surface-border/60 bg-surface-container-low hover:border-primary/30 hover:bg-surface-container-high"
                        }`}
                        style={{ fontFamily: "Geist, sans-serif" }}
                      >
                        <Icon name="add_photo_alternate" className="text-base" />
                        {lastFrame
                          ? "Replace end frame"
                          : !model.supportsLastFrame
                            ? "End frame (not supported by this model)"
                            : model.requiresLastFrame
                              ? "End frame (required)"
                              : "End frame (optional)"}
                      </button>
                    )}
                    <input
                      ref={lastFrameInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLastFrameUpload}
                      className="hidden"
                    />
                  </div>
                )}

                {!isTextMode && images.length > 0 && (
                  <div className="mt-4 flex shrink-0 flex-wrap gap-3">
                    {images.map((img, i) => (
                      <div
                        key={i}
                        className="group relative h-20 w-20 overflow-hidden rounded-lg border border-surface-border"
                      >
                        <img
                          src={img}
                          alt="Uploaded reference"
                          className="h-full w-full object-cover"
                        />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <Icon name="close" className="text-xs text-white" />
                        </button>
                      </div>
                    ))}
                    {lastFrame && (
                      <div className="group relative h-20 w-20 overflow-hidden rounded-lg border border-primary/30">
                        <img
                          src={lastFrame}
                          alt="Uploaded end frame"
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5 text-center text-[8px] font-semibold uppercase tracking-wider text-white/70">
                          End frame
                        </span>
                        <button
                          onClick={() => setLastFrame(null)}
                          className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <Icon name="close" className="text-xs text-white" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-auto shrink-0 space-y-2 pt-3">
                  <ModelPickerButton
                    model={model}
                    credits={creditsPerVideo()}
                    onClick={() => setCatalogOpen(true)}
                  />

                  <button
                    type="button"
                    onClick={() => setSettingsOpen(true)}
                    disabled={generating}
                    aria-label={`Video Settings: ${currentConfig.aspectRatio?.label || "Aspect ratio"}, ${currentConfig.resolution || "Auto"}, ${currentConfig.duration}, ${videoCount} ${videoCount === 1 ? "video" : "videos"}`}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.025] px-4 py-3.5 text-left shadow-sm transition-all duration-200 hover:border-primary/40 hover:from-primary/[0.1] hover:to-primary/[0.03] active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold tracking-wide text-white/75">Video Settings</span>
                      <span className="mt-1.5 block whitespace-normal break-words text-xs font-semibold leading-relaxed text-white">
                        {currentConfig.aspectRatio?.label || "Aspect ratio"} · {currentConfig.resolution || "Auto"} · {currentConfig.duration} · {videoCount} {videoCount === 1 ? "video" : "videos"}
                      </span>
                    </span>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/65 transition-all duration-200 group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary ${settingsOpen ? "rotate-180" : ""}`}><Icon name="expand_more" className="text-base" /></span>
                  </button>

                  {!isTextMode && !supportsNativeAspectRatio && (
                    <p className="text-[10px] leading-relaxed text-on-surface-variant/60">
                      This model follows your image. We crop it to the selected
                      aspect ratio before generating.
                    </p>
                  )}

                  <AudioControl
                    model={model}
                    enabled={currentConfig.audio}
                    onToggle={() =>
                      updateConfig("audio", !currentConfig.audio)
                    }
                  />

                  <button
                    onClick={handleGenerate}
                    disabled={generateDisabled}
                    className="primary-gradient flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-200 hover:translate-y-[-1px] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ fontFamily: "Geist, sans-serif" }}
                  >
                    {generating ? (
                      <>
                        <svg
                          className="h-4 w-4 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>{" "}
                        Generating...
                      </>
                    ) : (
                      <>
                        <Icon name="auto_videocam" className="text-sm" /> Generate
                        Video{" "}
                        <span className="font-semibold text-yellow-300/90">
                          ({totalCredits()} credits)
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-3">
              <div
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.02), transparent)",
                }}
                className="glass-card card-glow relative flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-2xl border border-white/5 bg-black xl:min-h-[calc(100vh-7.5rem)]"
              >
                <div className="relative flex min-h-[420px] flex-1 flex-col items-center justify-center overflow-hidden">
                  <div
                    style={{
                      background:
                        "radial-gradient(ellipse at center, rgba(168,85,247,0.08) 0%, transparent 70%)",
                    }}
                    className="absolute inset-0"
                  ></div>
                  {!generating ? (
                    <>
                      <video
                        key={selectedVideoUrl}
                        src={selectedVideoUrl}
                        controls
                        autoPlay
                        loop
                        muted={selectedVideoUrl === DEFAULT_PREVIEW_VIDEO}
                        playsInline
                        className={`absolute inset-0 z-10 h-full w-full bg-black object-contain ${
                          selectedVideoUrl === DEFAULT_PREVIEW_VIDEO ? "sm:object-cover" : "sm:object-contain"
                        }`}
                      />
                      {generating && (
                        <div className="absolute left-3 top-3 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-black/70 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur">
                          <svg
                            className="h-3.5 w-3.5 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                          {videoCount > 1
                            ? `Generating ${Math.min(
                                generatedInCurrentRun + 1,
                                videoCount
                              )} of ${videoCount}...`
                            : "Generating..."}
                        </div>
                      )}
                    </>
                  ) : generating ? (
                    <div className="relative z-10 flex flex-col items-center px-6 text-center">
                      <div className="relative mb-5 h-20 w-20">
                        <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
                        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Icon
                            name="auto_videocam"
                            className="text-3xl text-primary"
                          />
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-white">
                        Generating your video...
                      </p>
                      <p className="mt-1.5 text-xs text-on-surface-variant/60">
                        {videoCount > 1
                          ? `Video ${Math.min(
                              videoUrls.length + 1,
                              videoCount
                            )} of ${videoCount} · `
                          : ""}
                        {elapsedSeconds > 0
                          ? `${elapsedSeconds}s elapsed`
                          : "This can take a few minutes"}
                      </p>
                      {generationProgress != null ? (
                        <div className="mt-4 w-52 max-w-full">
                          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-500"
                              style={{ width: `${generationProgress}%` }}
                            ></div>
                          </div>
                          <p className="mt-1.5 text-[10px] text-on-surface-variant/60">
                            {Math.round(generationProgress)}%
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4 h-1.5 w-52 max-w-full overflow-hidden rounded-full bg-white/10">
                          <div className="h-full w-2/3 animate-pulse rounded-full bg-primary/70"></div>
                        </div>
                      )}
                      <p className="mt-4 text-[10px] text-on-surface-variant/50">
                        Credits are only deducted when your video is ready.
                      </p>
                      {videoError && (
                        <div className="mt-4 max-w-xs rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs leading-relaxed text-red-200/90">
                          {videoError}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative z-10 flex flex-col items-center px-6 text-center">
                      <div className="mb-4 flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-primary/20">
                        <Icon
                          name="circle_play"
                          className="text-3xl text-primary"
                        />
                      </div>
                      <p className="mt-2 text-xs text-on-surface-variant/60">
                        Your video will appear here
                      </p>
                      {videoError && (
                        <div className="mt-4 max-w-xs rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs leading-relaxed text-red-200/90">
                          {videoError}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {videoError && videoUrls.length > 0 && (
                <div className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs leading-relaxed text-red-200/90">
                  {videoError}
                </div>
              )}
            </div>

            {(videoUrls.length > 0 || generationBatch.length > 0) && (
              <div
                className="glass-card card-glow rounded-xl border border-white/5 p-4 xl:col-span-2"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.02), transparent)",
                }}
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <Icon name="checklist" className="text-base text-primary" />
                    Generated Videos <span className="text-xs text-white/40">({videoUrls.length + generationBatch.filter((item) => item.status !== "completed" && item.status !== "not-started").length})</span>
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => videoHistoryRef.current?.scrollBy({ left: -360, behavior: "smooth" })}
                      aria-label="Scroll videos left"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/70 transition hover:border-primary/40 hover:text-white"
                    >
                      <Icon name="chevron-left" />
                    </button>
                    <button
                      type="button"
                      onClick={() => videoHistoryRef.current?.scrollBy({ left: 360, behavior: "smooth" })}
                      aria-label="Scroll videos right"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/70 transition hover:border-primary/40 hover:text-white"
                    >
                      <Icon name="chevron-right" />
                    </button>
                  </div>
                </div>
                <div
                  ref={videoHistoryRef}
                  className="flex gap-3 overflow-x-auto pb-2 [scrollbar-color:rgba(168,85,247,0.55)_rgba(255,255,255,0.06)] [scrollbar-width:thin]"
                >
                  {generationBatch.map((item, i) => (
                    <button
                      key={item.id}
                      type="button"
                      disabled={!item.videoUrl}
                      onClick={() => item.videoUrl && setSelectedVideoIndex(videoUrls.indexOf(item.videoUrl))}
                      className={`group relative w-40 shrink-0 overflow-hidden rounded-xl border text-left transition-all sm:w-48 ${item.videoUrl ? "border-white/10 hover:border-primary/50" : "border-white/10 bg-black/30"}`}
                    >
                      {item.videoUrl ? (
                        <video src={item.videoUrl} muted playsInline preload="metadata" className="aspect-video w-full bg-black object-cover" />
                      ) : (
                        <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-white/[0.03] text-white/55">
                          {item.status === "generating" ? (
                            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                          ) : <Icon name={item.status === "failed" ? "alert-circle" : "clock"} className="text-lg" />}
                          <span className="text-[10px] font-medium">{item.status === "generating" ? "Generating..." : item.status === "failed" ? "Failed" : item.status === "not-started" ? "Not started" : "Waiting"}</span>
                        </div>
                      )}
                      <span className="block truncate bg-black/50 px-2 py-1.5 text-left text-[10px] font-medium text-white/75">Video {i + 1}</span>
                    </button>
                  ))}
                  {videoUrls.filter((url) => !generationBatch.some((item) => item.videoUrl === url)).map((url, i) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setSelectedVideoIndex(i)}
                      aria-label={`Play generated video ${i + 1}`}
                      aria-pressed={selectedVideoUrl === url}
                      className={`group relative w-40 shrink-0 overflow-hidden rounded-xl border text-left transition-all sm:w-48 ${
                        selectedVideoUrl === url
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-white/10 hover:border-primary/50"
                      }`}
                    >
                      <video
                        src={url}
                        muted
                        playsInline
                        preload="metadata"
                        className="aspect-video w-full bg-black object-cover"
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/10 transition group-hover:bg-black/25">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur">
                          <Icon name="play" className="text-sm" />
                        </span>
                      </span>
                      <span className="block truncate bg-black/50 px-2 py-1.5 text-left text-[10px] font-medium text-white/75">
                        Video {i + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
        {settingsOpen && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setSettingsOpen(false);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="video-settings-title"
              className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#15131d] p-3 shadow-2xl sm:p-4"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-indigo-400/25 bg-gradient-to-br from-violet-500/15 to-indigo-500/10 text-indigo-200">
                      <Icon name="tune" className="text-base" />
                    </span>
                    <h2 id="video-settings-title" className="text-base font-semibold tracking-tight text-white">Video Settings</h2>
                  </div>
                  <p className="text-xs text-white/45">Customize your video before generating.</p>
                </div>
                <button type="button" onClick={() => setSettingsOpen(false)} aria-label="Close settings" className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/60 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white">
                  <Icon name="close" />
                </button>
              </div>

              <div className="space-y-3">
                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-white/80">Aspect Ratio</h3>
                    <span className="text-[10px] text-white/35">Choose your format</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {availableAspectRatios.map((ratio) => {
                      const selected = currentConfig.aspectRatio?.label === ratio.label;
                      return (
                        <button
                          key={ratio.label}
                          type="button"
                          onClick={() => updateConfig("aspectRatio", ratio)}
                          aria-pressed={selected}
                          className={`flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-lg border px-2 py-1.5 transition-all duration-150 active:scale-[0.98] ${
                            selected
                              ? "border-indigo-400/70 bg-gradient-to-br from-violet-500/25 to-indigo-500/15 text-white shadow-[0_0_0_1px_rgba(129,140,248,0.22),0_8px_22px_rgba(79,70,229,0.12)]"
                              : "border-white/[0.08] bg-white/[0.025] text-white/55 hover:border-white/20 hover:bg-white/[0.055] hover:text-white/85"
                          }`}
                        >
                          <AspectIcon label={ratio.label} size="text-base" />
                          <span className="text-[11px] font-semibold">{ratio.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {availableResolutions.length > 0 && (
                  <section>
                    <div className="mb-2.5 flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-white/80">Resolution</h3>
                      <span className="text-[10px] text-white/35">Output quality</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {availableResolutions.map((resolution) => {
                        const selected = currentConfig.resolution === resolution;
                        return (
                          <button
                            key={resolution}
                            type="button"
                            onClick={() => updateConfig("resolution", resolution)}
                            aria-pressed={selected}
                            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all duration-150 active:scale-[0.98] ${
                              selected
                                ? "border-indigo-400/70 bg-gradient-to-br from-violet-500/25 to-indigo-500/15 text-white shadow-[0_4px_16px_rgba(79,70,229,0.12)]"
                                : "border-white/[0.08] bg-white/[0.025] text-white/55 hover:border-white/20 hover:bg-white/[0.055] hover:text-white/85"
                            }`}
                          >
                            {prettyResolution(resolution)}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                <section>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-semibold text-white/80">Duration</h3>
                      <p className="mt-0.5 text-[10px] text-white/35">Drag to choose video length</p>
                    </div>
                    <span className="min-w-[84px] rounded-lg border border-indigo-400/30 bg-gradient-to-r from-violet-500/15 to-indigo-500/15 px-2.5 py-1.5 text-center text-sm font-bold tabular-nums text-indigo-100 shadow-[0_4px_16px_rgba(79,70,229,0.12)]">
                      {currentConfig.duration}
                    </span>
                  </div>
                  <div className="rounded-lg border border-white/[0.08] bg-[#1b1a26] px-3 pb-2 pt-2.5">
                    <input
                      type="range"
                      min={0}
                      max={Math.max(0, availableDurations.length - 1)}
                      step={1}
                      value={Math.max(0, availableDurations.indexOf(currentConfig.duration))}
                      onChange={(event) => {
                        const nextDuration = availableDurations[Number(event.target.value)];
                        if (nextDuration) updateConfig("duration", nextDuration);
                      }}
                      aria-label="Video duration"
                      aria-valuetext={currentConfig.duration}
                      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gradient-to-r from-violet-500/40 via-indigo-500/60 to-indigo-400 accent-indigo-400"
                    />
                    <div className="mt-2 flex items-center justify-between text-[10px] font-medium tabular-nums text-white/40">
                      <span>{availableDurations[0] || "—"}</span>
                      <span>{availableDurations[availableDurations.length - 1] || "—"}</span>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-white/80">Quantity</h3>
                    <span className="text-[10px] text-white/35">Number of videos</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((count) => {
                      const selected = videoCount === count;
                      return (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setVideoCount(count)}
                          aria-pressed={selected}
                          className={`flex h-9 items-center justify-center rounded-lg border text-sm font-semibold transition-all duration-150 active:scale-[0.97] ${
                            selected
                              ? "border-indigo-400/70 bg-gradient-to-br from-violet-500/25 to-indigo-500/15 text-white shadow-[0_4px_16px_rgba(79,70,229,0.12)]"
                              : "border-white/[0.08] bg-white/[0.025] text-white/55 hover:border-white/20 hover:bg-white/[0.055] hover:text-white/85"
                          }`}
                        >
                          {count}
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>

              <div className="mt-3 border-t border-white/[0.07] pt-2.5">
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="group relative flex min-h-[42px] w-full items-center justify-center gap-2 overflow-hidden rounded-lg border border-violet-300/25 bg-gradient-to-r from-violet-600 via-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(91,33,182,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200/45 hover:shadow-[0_12px_30px_rgba(91,33,182,0.3)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#15131d]"
                >
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/0 via-white/[0.09] to-white/0 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                  <span className="relative flex h-6 w-6 items-center justify-center rounded-lg border border-white/15 bg-white/10">
                    <Icon name="check" className="text-sm" />
                  </span>
                  <span className="relative">Apply Settings</span>
                  <Icon name="arrow-right" className="relative text-sm text-white/75 transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
                <p className="mt-1.5 text-center text-[10px] text-white/35">
                  Your selections will be applied to this video
                </p>
              </div>
            </div>
          </div>
        )}
        <VideoModelCatalog
          open={catalogOpen}
          onClose={() => setCatalogOpen(false)}
          models={models}
          selectedModel={model}
          onSelect={handleSelectModel}
          calcCredits={calcStartingCredits}
          mode={mode}
        />
        {showCreditModal && (
          <InsufficientCreditsModal
            needed={neededCredits}
            available={credits}
            onClose={() => setShowCreditModal(false)}
          />
        )}
      </SidebarProvider>
    </div>
  );
}

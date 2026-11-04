"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon";
import { VIDEO_FAMILIES } from "../lib/videoCatalog";

function prettyResolution(value) {
  if (!value) return "Auto";
  const text = String(value);
  if (text.toLowerCase() === "4k") return "4K";
  if (text.toLowerCase() === "2k") return "2K";
  return text;
}

function prettyDuration(value) {
  return value || "Auto";
}

function familySlug(name) {
  return String(name || "family").toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function ProviderLogo({ model, size = 38 }) {
  if (model.logo) {
    return (
      <img
        src={`/logos/${model.logo}`}
        alt={model.provider || model.family}
        width={size}
        height={size}
        className="rounded-xl shrink-0 border border-white/10"
        style={{ width: size, height: size, objectFit: "cover" }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-xl border border-white/10"
      style={{
        width: size,
        height: size,
        background: `${model.color || "#a855f7"}18`,
      }}
    >
      <Icon
        name={model.icon || "smart_toy"}
        className="text-lg"
        style={{ color: model.color || "#a855f7" }}
      />
    </div>
  );
}

function Chip({ children, tone = "default" }) {
  const tones = {
    default: "border-white/10 bg-white/[0.04] text-white/55",
    purple: "border-primary/25 bg-primary/10 text-primary",
    green: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
    blue: "border-sky-400/25 bg-sky-400/10 text-sky-300",
    gray: "border-white/10 bg-white/[0.03] text-white/35",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${tones[tone] || tones.default}`}
    >
      {children}
    </span>
  );
}

function audioChip(model) {
  if (model.audioMode === "native") return <Chip tone="blue">Audio included</Chip>;
  if (model.audioMode === "optional") return <Chip tone="blue">Audio option</Chip>;
  return <Chip tone="gray">Silent</Chip>;
}

function Stat({ label, value, accent }) {
  return (
    <div className="min-w-0">
      <div className="text-[8px] font-semibold uppercase tracking-[0.14em] text-white/30">
        {label}
      </div>
      <div
        className={`mt-0.5 truncate text-[11px] font-semibold ${
          accent ? "text-yellow-300" : "text-white/80"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export default function VideoModelCatalog({
  open,
  onClose,
  models,
  selectedModel,
  onSelect,
  calcCredits,
  mode = "image",
}) {
  const [activeFamily, setActiveFamily] = useState(null);

  const groups = useMemo(() => {
    return VIDEO_FAMILIES.map((family) => ({
      ...family,
      models: models.filter((model) => model.family === family.name),
    })).filter((family) => family.models.length > 0);
  }, [models]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setActiveFamily(groups[0]?.name || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const scrollToFamily = (name) => {
    setActiveFamily(name);
    const el = document.getElementById(`video-family-${familySlug(name)}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const modeLabel = mode === "text" ? "Text to Video" : "Image to Video";

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-stretch justify-center sm:items-center sm:p-5">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative flex h-full w-full flex-col overflow-hidden border border-white/10 bg-[#0c0814] shadow-[0_40px_140px_rgba(0,0,0,0.8)] sm:h-[88vh] sm:max-w-6xl sm:rounded-2xl">
        <div className="relative shrink-0 border-b border-white/[0.07] px-4 pb-4 pt-5 sm:px-6">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-70"
            style={{
              background:
                "radial-gradient(ellipse at 20% 0%, rgba(168,85,247,0.24), transparent 65%)",
            }}
          />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Icon name="auto_awesome" className="text-base" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-white sm:text-lg">
                    Choose a video model
                  </h2>
                  <p className="text-[11px] text-white/40">
                    Premium AI video models, powered by Renderful.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary sm:inline-flex">
                {modeLabel}
              </span>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/60 transition-all hover:border-white/20 hover:bg-white/[0.08] hover:text-white active:scale-95"
                aria-label="Close model catalog"
              >
                <Icon name="close" className="text-lg" />
              </button>
            </div>
          </div>

          <div className="relative mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {groups.map((family) => {
              const isActive = activeFamily === family.name;
              return (
                <button
                  key={family.name}
                  type="button"
                  onClick={() => scrollToFamily(family.name)}
                  aria-pressed={isActive}
                  className={`group/provider relative flex min-h-[57px] w-full items-center gap-2 overflow-hidden rounded-xl border px-2.5 py-2 text-left transition-all duration-200 active:scale-[0.98] ${
                    isActive
                      ? "border-primary/50 bg-gradient-to-br from-primary/20 via-primary/[0.09] to-white/[0.025] text-white shadow-[0_0_0_1px_rgba(168,85,247,0.12),0_10px_28px_rgba(88,28,135,0.18)]"
                      : "border-white/10 bg-white/[0.035] text-white/65 hover:border-primary/35 hover:bg-white/[0.07] hover:text-white"
                  }`}
                >
                  <span className={`absolute inset-y-2 left-0 w-[3px] rounded-r-full transition-colors ${
                    isActive ? "bg-primary" : "bg-transparent group-hover/provider:bg-primary/50"
                  }`} />
                  <img
                    src={`/logos/${family.logo}`}
                    alt=""
                    className={`h-7 w-7 shrink-0 rounded-lg border object-cover shadow-sm ${
                      isActive ? "border-primary/30" : "border-white/10"
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-bold tracking-wide">{family.name}</span>
                    <span className={`mt-0.5 block text-[9px] ${
                      isActive ? "text-primary/90" : "text-white/35"
                    }`}>
                      {family.models.length} {family.models.length === 1 ? "model" : "models"}
                    </span>
                  </span>
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                    isActive
                      ? "border-primary bg-primary text-white"
                      : "border-white/10 bg-black/20 text-transparent group-hover/provider:border-primary/40"
                  }`}>
                    <Icon name="check" className="text-[10px]" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-10 pt-5 sm:px-6">
          <div className="space-y-8">
            {groups.map((family) => (
              <section
                key={family.name}
                id={`video-family-${familySlug(family.name)}`}
                className="scroll-mt-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={`/logos/${family.logo}`}
                      alt={family.name}
                      className="h-8 w-8 rounded-lg border border-white/10 object-cover"
                    />
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        {family.name}
                      </h3>
                      <p className="text-[10px] text-white/35">
                        {family.provider} · {family.models.length}{" "}
                        {family.models.length === 1 ? "model" : "models"}
                      </p>
                    </div>
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {family.models.map((model) => {
                    const selected = selectedModel?.id === model.id;
                    return (
                      <button
                        key={model.id}
                        onClick={() => onSelect(model)}
                        className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 active:scale-[0.99] ${
                          selected
                            ? "border-primary/50 bg-primary/[0.08] shadow-[0_0_0_1px_rgba(168,85,247,0.2),0_18px_50px_rgba(88,28,135,0.25)]"
                            : "border-white/[0.07] bg-white/[0.025] hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white/[0.045] hover:shadow-[0_18px_45px_rgba(0,0,0,0.35)]"
                        }`}
                      >
                        <div
                          className="pointer-events-none absolute inset-x-0 top-0 h-20 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                          style={{
                            background: `radial-gradient(ellipse at 20% 0%, ${model.color || "#a855f7"}18, transparent 70%)`,
                          }}
                        />
                        <div className="relative flex items-start gap-3">
                          <ProviderLogo model={model} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h4 className="truncate text-[13px] font-semibold text-white">
                                {model.name}
                              </h4>
                              {model.badge && (
                                <span className="shrink-0 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-emerald-300">
                                  {model.badge}
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-[10px] text-white/35">
                              {model.provider}
                            </p>
                          </div>
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                              selected
                                ? "border-primary bg-primary text-white"
                                : "border-white/15 bg-white/[0.03] text-transparent group-hover:border-primary/40"
                            }`}
                          >
                            <Icon name="check" className="text-[11px]" />
                          </span>
                        </div>

                        <p className="relative mt-3 line-clamp-2 min-h-[30px] text-[11px] leading-relaxed text-white/45">
                          {model.desc}
                        </p>

                        <div className="relative mt-3 flex flex-wrap gap-1.5">
                          <Chip tone="purple">{model.speed}</Chip>
                          {audioChip(model)}
                          {model.supportedModes?.includes("text") && (
                            <Chip>Text → Video</Chip>
                          )}
                          {model.supportedModes?.includes("image") && (
                            <Chip>Image → Video</Chip>
                          )}
                        </div>

                        <div className="relative mt-3 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3">
                          <Stat
                            label="Max Res"
                            value={prettyResolution(model.maxResolution)}
                          />
                          <Stat
                            label="Duration"
                            value={prettyDuration(model.durationLabel)}
                          />
                          <Stat
                            label="Credits"
                            value={
                              calcCredits?.(model) != null
                                ? `${calcCredits(model)}`
                                : "—"
                            }
                            accent
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

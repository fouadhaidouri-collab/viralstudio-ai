"use client";

import Icon from "../../components/Icon";

export default function SettingsSplash({ leaving = false }) {
  return (
    <div
      className={`fixed inset-0 z-[80] flex items-center justify-center bg-background transition-opacity duration-200 ${
        leaving ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-busy="true"
      aria-label="Loading settings"
    >
      <div className="flex w-full max-w-[290px] flex-col items-center gap-5 px-6">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-xl bg-primary/40 blur-xl animate-pulse-glow" />
            <div
              className="relative flex h-11 w-11 items-center justify-center rounded-[14px]"
              style={{
                background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 50%, #3b0764 100%)",
                boxShadow: "0 0 30px rgba(168,85,247,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              <Icon name="bolt" className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" size={20} />
            </div>
          </div>

          <div className="min-w-0 text-left">
            <h1
              className="whitespace-nowrap text-xl font-extrabold leading-none tracking-tight"
              style={{
                background: "linear-gradient(135deg, #fff 30%, #a855f7 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontFamily: "Geist, sans-serif",
              }}
            >
              ViralStudio AI
            </h1>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-primary" />
              <span className="whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.15em] text-on-surface-variant">
                Premium Suite
              </span>
            </div>
          </div>
        </div>

        <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="settings-loader-bar h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #a855f7, #6366f1, #22d3ee)" }}
          />
        </div>
      </div>
    </div>
  );
}

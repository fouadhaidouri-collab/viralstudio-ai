"use client";

import { useEffect, useRef, useState } from "react";
import BrandLogo from "./BrandLogo";
import { useAuth } from "../lib/AuthContext";

const MILESTONES = {
  hydrated: 33,
  session: 66,
  painted: 100,
};

export default function SiteLoader() {
  const { loading: sessionLoading } = useAuth();
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [removed, setRemoved] = useState(false);
  const sessionMilestone = useRef(false);
  const paintMilestone = useRef(false);

  // 1. The app shell has mounted in the browser.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setProgress((value) => Math.max(value, MILESTONES.hydrated));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  // 2. Wait for the existing real session request owned by AuthProvider.
  useEffect(() => {
    if (sessionLoading || sessionMilestone.current) return;

    sessionMilestone.current = true;

    let firstFrame = 0;
    let secondFrame = 0;

    firstFrame = window.requestAnimationFrame(() => {
      setProgress((value) => Math.max(value, MILESTONES.session));

      // 3. Wait for the next painted frame after the session is ready.
      secondFrame = window.requestAnimationFrame(() => {
        if (paintMilestone.current) return;
        paintMilestone.current = true;
        setProgress(MILESTONES.painted);
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [sessionLoading]);

  // Let the completed bar register before the smooth exit.
  useEffect(() => {
    if (progress < MILESTONES.painted) return;

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const timer = window.setTimeout(() => setLeaving(true), reducedMotion ? 0 : 120);
    return () => window.clearTimeout(timer);
  }, [progress]);

  // Remove the overlay after its fade-out.
  useEffect(() => {
    if (!leaving) return;

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const timer = window.setTimeout(() => setRemoved(true), reducedMotion ? 0 : 500);
    return () => window.clearTimeout(timer);
  }, [leaving]);

  if (removed) return null;

  const status =
    progress >= MILESTONES.painted
      ? "Ready"
      : progress >= MILESTONES.session
        ? "Finalizing interface"
        : progress >= MILESTONES.hydrated
          ? "Connecting to your workspace"
          : "Starting up";

  return (
    <div
      id="site-initial-loader"
      data-leaving={leaving ? "true" : "false"}
      role="status"
      aria-live="polite"
      aria-label="Loading ViralStudio AI"
      aria-busy={leaving ? "false" : "true"}
      onTransitionEnd={(event) => {
        if (leaving && event.target === event.currentTarget) setRemoved(true);
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
          padding: "0 24px",
        }}
      >
        <div className="motion-safe:animate-fade-in-up">
          <BrandLogo
            subtitle="Premium Suite"
            className="scale-[1.28] sm:scale-[1.45]"
          />
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            boxSizing: "border-box",
            padding: "0 24px max(28px, env(safe-area-inset-bottom))",
          }}
        >
          <div className="mx-auto w-full max-w-[340px] sm:max-w-[380px]">
            <div className="mb-2.5 flex items-center justify-between gap-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                {status}
              </span>
              <span className="text-[10px] font-semibold tabular-nums text-white/45">
                {progress}%
              </span>
            </div>

            <div
              className="h-[3px] w-full overflow-hidden rounded-full bg-white/[0.08]"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              aria-label="Initialization progress"
            >
              <div
                className="h-full rounded-full transition-[width] duration-500 ease-out"
                style={{
                  width: `${progress}%`,
                  background:
                    "linear-gradient(90deg, #7c3aed 0%, #a855f7 55%, #22d3ee 100%)",
                  boxShadow: "0 0 12px rgba(168,85,247,0.45)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

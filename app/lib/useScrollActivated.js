"use client";

import { useEffect, useState } from "react";

/**
 * Returns true after the first real user scroll attempt.
 *
 * The user-intent gate keeps layout/scroll-restoration events from loading
 * background videos before the visitor actually starts scrolling.
 */
export default function useScrollActivated() {
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    if (activated) return;

    let pointerArmed = false;
    let touchStartY = null;

    const activate = () => setActivated(true);

    const handleWheel = () => activate();

    const handleTouchStart = (event) => {
      touchStartY = event.touches?.[0]?.clientY ?? null;
    };

    const handleTouchMove = (event) => {
      const currentY = event.touches?.[0]?.clientY;
      if (
        touchStartY != null &&
        currentY != null &&
        Math.abs(currentY - touchStartY) > 8
      ) {
        activate();
      }
    };

    const handleKeyDown = (event) => {
      if (
        event.key === "ArrowDown" ||
        event.key === "PageDown" ||
        event.key === "End" ||
        event.key === " " ||
        event.key === "Spacebar"
      ) {
        activate();
      }
    };

    const handlePointerDown = () => {
      pointerArmed = true;
    };

    const handleScroll = (event) => {
      if (!pointerArmed) return;

      const target = event.target;

      if (
        target === document ||
        target === document.documentElement ||
        target === document.body
      ) {
        if (window.scrollY > 0) activate();
        return;
      }

      if (target instanceof Element && target.scrollTop > 0) {
        activate();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown, {
      capture: true,
      passive: true,
    });
    document.addEventListener("scroll", handleScroll, {
      capture: true,
      passive: true,
    });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown, {
        capture: true,
      });
      document.removeEventListener("scroll", handleScroll, {
        capture: true,
      });
    };
  }, [activated]);

  return activated;
}

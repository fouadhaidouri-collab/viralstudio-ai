"use client";

import Icon from "./Icon";
import { useSidebar } from "./SidebarContext";

// Renders inside SidebarProvider so it always controls the real drawer state.
// Visible on every breakpoint: on mobile it opens the drawer, on desktop it
// opens the same navigation drawer over the permanent sidebar.
export default function MenuButton({ className = "" }) {
  const { setMobileOpen } = useSidebar();

  return (
    <button
      type="button"
      onClick={() => setMobileOpen(true)}
      aria-label="Open navigation menu"
      className={`w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-low border border-surface-border/50 hover:bg-surface-container-high transition-all ${className}`}
      style={{ touchAction: "manipulation" }}
    >
      <Icon name="menu" className="text-white" size={20} />
    </button>
  );
}

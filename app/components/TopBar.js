"use client";

import { useRouter } from "next/navigation";
import ProfileDropdown from "./ProfileDropdown";
import LanguageToggle from "./LanguageToggle";
import { useSidebar } from "./SidebarContext";

export default function TopBar() {
  const router = useRouter();
  const { setMobileOpen } = useSidebar();

  return (
    <header className="shrink-0 w-full h-14 md:h-16 bg-surface/60 backdrop-blur-2xl border-b border-surface-border/40 flex justify-between items-center px-4 md:px-8" style={{ boxShadow: '0 1px 24px rgba(0,0,0,0.3)' }}>
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button onClick={() => setMobileOpen(true)} className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-low border border-surface-border/50 hover:bg-surface-container-high transition-all active:scale-90">
          <span className="material-symbols-outlined text-white text-xl">menu</span>
        </button>
        {/* Desktop spacer */}
        <div className="hidden md:block"></div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="flex items-center gap-2 px-2.5 md:px-3 py-1.5 bg-surface-container-low border border-surface-border/50 rounded-xl hover:border-yellow-400/20 transition-all duration-200" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}>
          <span className="material-symbols-outlined text-sm text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
          <span className="text-sm font-bold text-yellow-400">0</span>
          <button onClick={() => router.push("/pricing")} className="ml-1 w-5 h-5 flex items-center justify-center rounded-full bg-yellow-400/15 hover:bg-yellow-400/25 transition-all duration-200 hover:scale-110 active:scale-90">
            <span className="material-symbols-outlined text-[10px] text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
          </button>
        </div>
          <LanguageToggle />
        <div className="h-6 md:h-8 w-px bg-surface-border/30"></div>
        <ProfileDropdown />
      </div>
    </header>
  );
}

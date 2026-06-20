"use client";

import { useRouter } from "next/navigation";
import ProfileDropdown from "./ProfileDropdown";
import { useSidebar } from "./SidebarContext";
import Icon from "./Icon";

export default function TopBar() {
  const router = useRouter();
  const { setMobileOpen } = useSidebar();

  return (
    <header className="fixed top-0 right-0 w-full md:w-[calc(100%-16rem)] h-14 md:h-16 bg-surface/60 backdrop-blur-2xl border-b border-surface-border/40 z-40 flex justify-between items-center px-4 md:px-8" style={{ boxShadow: '0 1px 24px rgba(0,0,0,0.3)' }}>
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button onClick={() => setMobileOpen(true)} className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-low border border-surface-border/50 hover:bg-surface-container-high transition-all" style={{ touchAction: 'manipulation' }}>
          <Icon name="menu" className="text-white" size={20} />
        </button>
        {/* Desktop spacer */}
        <div className="hidden md:block"></div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="flex items-center gap-2 px-2.5 md:px-3 py-1.5 bg-surface-container-low border border-surface-border/50 rounded-xl hover:border-yellow-400/20 transition-all duration-200" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}>
          <Icon name="bolt" className="text-yellow-400" size={14} />
          <span className="text-sm font-bold text-yellow-400">0</span>
          <button onClick={() => router.push("/pricing")} className="ml-1 w-5 h-5 flex items-center justify-center rounded-full bg-yellow-400/15 hover:bg-yellow-400/25 transition-all duration-200 hover:scale-110 active:scale-90">
            <Icon name="add" className="text-yellow-400" size={10} />
          </button>
        </div>
        <button onClick={() => router.push("/admin")} className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-surface-container-low border border-surface-border/50 rounded-xl hover:border-primary/30 hover:bg-primary/10 transition-all duration-200 text-xs font-bold text-primary">
          <Icon name="shield" size={12} />
          Admin
        </button>
        <div className="h-6 md:h-8 w-px bg-surface-border/30"></div>
        <ProfileDropdown />
      </div>
    </header>
  );
}

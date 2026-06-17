"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslate } from "./LanguageProvider";
import { useSidebar } from "./SidebarContext";

const homeItem = { href: "/", label: "Dashboard", icon: "dashboard" };
const toolItems = [
  { href: "/ai-video", label: "AI Video", icon: "movie" },
  { href: "/chat-ai", label: "Chat AI", icon: "chat" },
  { href: "/ai-image", label: "Image Lab", icon: "image" },
  { href: "/ugc-engine", label: "UGC Engine", icon: "record_voice_over" },
  { href: "/hook-gen", label: "Hook Gen", icon: "auto_awesome" },
  { href: "/clipping", label: "Clipping", icon: "content_cut" },
];

function SidebarContent() {
  const pathname = usePathname();
  const t = useTranslate();
  const { setMobileOpen } = useSidebar();

  const handleNav = () => setMobileOpen(false);

  return (
    <aside className="fixed ltr:left-0 rtl:right-0 top-0 h-full w-64 bg-surface ltr:border-r rtl:border-l border-surface-border/80 z-50 flex flex-col p-4" style={{ boxShadow: '4px 0 32px rgba(0,0,0,0.4)' }}>
      <Link href="/" onClick={handleNav} className="mb-6 px-2 flex items-center gap-3 group relative">
        <div className="relative">
          <div className="absolute inset-0 rounded-xl blur-xl bg-primary/40 animate-pulse-glow" />
          <div className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 relative z-10" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 50%, #3b0764 100%)', boxShadow: '0 0 30px rgba(168,85,247,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
            <span className="material-symbols-outlined text-white text-xl drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
          </div>
        </div>
        <div>
          <h1 className="font-extrabold tracking-tight leading-none" style={{ background: 'linear-gradient(135deg, #fff 30%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '20px', fontFamily: 'Geist, sans-serif' }}>ViralStudio AI</h1>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-primary" />
            <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-[0.15em]">{t("Premium Suite")}</span>
          </div>
        </div>
      </Link>
      <nav className="flex-1 space-y-1 overflow-hidden">
        <Link
          key={homeItem.href}
          href={homeItem.href}
          onClick={handleNav}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 active:scale-[0.97] min-w-0 ${
            pathname === homeItem.href
              ? "primary-gradient text-white shadow-lg shadow-primary/30"
              : "text-on-surface-variant hover:bg-[rgba(255,255,255,0.04)] hover:text-white hover:translate-x-0.5"
          }`}
        >
          <span className="material-symbols-outlined shrink-0" style={{ fontVariationSettings: pathname === homeItem.href ? "'FILL' 1, 'wght' 300" : "'FILL' 0, 'wght' 300", fontSize: '20px' }}>
            {homeItem.icon}
          </span>
          <span className="font-bold text-sm truncate" style={{ fontFamily: 'Geist, sans-serif' }}>{t(homeItem.label)}</span>
        </Link>
        <div className="pt-4 pb-1 px-4">
          <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-[0.2em] opacity-60 truncate block">{t("AI Tools")}</span>
        </div>
        {toolItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNav}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 active:scale-[0.97] min-w-0 ${
                isActive
                  ? "primary-gradient text-white shadow-lg shadow-primary/30"
                  : "text-on-surface-variant hover:bg-[rgba(255,255,255,0.04)] hover:text-white hover:translate-x-0.5"
              }`}
            >
              <span className="material-symbols-outlined shrink-0" style={{ fontVariationSettings: isActive ? "'FILL' 1, 'wght' 300" : "'FILL' 0, 'wght' 300", fontSize: '20px' }}>
                {item.icon}
              </span>
              <span className="font-bold text-sm truncate" style={{ fontFamily: 'Geist, sans-serif' }}>{t(item.label)}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto pt-4 border-t border-surface-border/40 px-2 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-surface-container-low border border-surface-border/40 min-w-0" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}>
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-cyan to-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <span className="text-[11px] text-on-surface-variant font-medium truncate">{t("AI Credits")}: <span className="text-yellow-400 font-bold">0</span></span>
        </div>
      </div>
    </aside>
  );
}

export default function Sidebar() {
  const { isMobileOpen, setMobileOpen } = useSidebar();

  return (
    <>
      {/* Desktop sidebar - always visible */}
      <div className="hidden md:block">
        <SidebarContent />
      </div>

      {/* Mobile sidebar - overlay */}
      {isMobileOpen && (
        <div className="md:hidden">
          <div className="mobile-sidebar-overlay" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-0 z-[70] flex animate-slide-in-left">
            <SidebarContent />
            <div className="flex-1" onClick={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slide-in-left {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </>
  );
}

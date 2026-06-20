"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "./SidebarContext";
import { useAuth } from "../lib/AuthContext";
import Icon from "./Icon";

const homeItem = { href: "/", label: "Home", icon: "dashboard" };
const toolItems = [
  { href: "/ai-video", label: "AI Video", icon: "movie" },
  { href: "/chat-ai", label: "Chat AI", icon: "chat" },
  { href: "/ai-image", label: "Image Lab", icon: "image" },
];

function SidebarContent() {
  const pathname = usePathname();
  const { setMobileOpen } = useSidebar();
  const { user } = useAuth();

  const handleNav = () => setMobileOpen(false);

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface border-r border-surface-border/80 z-50 flex flex-col p-4 overflow-hidden" style={{ boxShadow: '4px 0 32px rgba(0,0,0,0.4)' }}>
      <Link href="/" onClick={handleNav} className="mb-5 px-2 flex items-center gap-3 group relative">
        <div className="relative">
          <div className="absolute inset-0 rounded-xl blur-xl bg-primary/40 animate-pulse-glow" />
          <div className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 relative z-10" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 50%, #3b0764 100%)', boxShadow: '0 0 30px rgba(168,85,247,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
            <Icon name="bolt" className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" size={20} />
          </div>
        </div>
        <div>
          <h1 className="font-extrabold tracking-tight leading-none" style={{ background: 'linear-gradient(135deg, #fff 30%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '20px', fontFamily: 'Geist, sans-serif' }}>ViralStudio AI</h1>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-primary" />
            <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-[0.15em]">Premium Suite</span>
          </div>
        </div>
      </Link>
      <nav className="flex-1 space-y-1">
        <Link
          key={homeItem.href}
          href={homeItem.href}
          onClick={handleNav}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 active:scale-[0.97] ${
            pathname === homeItem.href
              ? "primary-gradient text-white shadow-lg shadow-primary/30"
              : "text-on-surface-variant hover:bg-[rgba(255,255,255,0.04)] hover:text-white hover:translate-x-0.5"
          }`}
        >
          <Icon name={homeItem.icon} className="shrink-0" size={20} />
          <span className="sidebar-link-text flex-1">{homeItem.label}</span>
        </Link>
        <div className="pt-3 pb-1 px-4">
          <span className="sidebar-heading-text">AI Tools</span>
        </div>
        {toolItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNav}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 active:scale-[0.97] ${
                isActive
                  ? "primary-gradient text-white shadow-lg shadow-primary/30"
                  : "text-on-surface-variant hover:bg-[rgba(255,255,255,0.04)] hover:text-white hover:translate-x-0.5"
              }`}
            >
              <Icon name={item.icon} className="shrink-0" size={20} />
              <span className="sidebar-link-text flex-1">{item.label}</span>
            </Link>
          );
        })}
        {user && (
          <Link
            href="/admin"
            onClick={handleNav}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 active:scale-[0.97] ${
              pathname.startsWith("/admin")
                ? "primary-gradient text-white shadow-lg shadow-primary/30"
                : "text-on-surface-variant hover:bg-[rgba(255,255,255,0.04)] hover:text-white hover:translate-x-0.5"
            }`}
          >
            <Icon name="settings" className="shrink-0" size={20} />
            <span className="sidebar-link-text flex-1">Admin Panel</span>
          </Link>
        )}
      </nav>
      <div className="mt-auto pt-4 border-t border-surface-border/40 px-2">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-surface-container-low border border-surface-border/40" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}>
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-cyan to-primary flex items-center justify-center shrink-0">
            <Icon name="auto_awesome" className="text-white" size={12} />
          </div>
          <span className="sidebar-credits-text">AI Credits: <span className="text-yellow-400 font-bold">0</span></span>
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
      <div className={`md:hidden ${isMobileOpen ? '' : 'pointer-events-none'}`}>
        <div className={`mobile-sidebar-overlay transition-opacity duration-300 ${isMobileOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setMobileOpen(false)} />
        <div className={`fixed inset-0 z-[70] flex transition-transform duration-300 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <SidebarContent />
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      </div>

      <style jsx global>{`
        .sidebar-link-text {
          font-size: 14px;
          font-weight: 700;
          font-family: Geist, sans-serif;
          white-space: nowrap;
          text-align: left;
          display: block;
          flex: 1;
        }
        .sidebar-heading-text {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: var(--color-on-surface-variant);
          opacity: 0.6;
          display: block;
        }
        .sidebar-credits-text {
          font-size: 11px;
          font-weight: 500;
          color: var(--color-on-surface-variant);
        }
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

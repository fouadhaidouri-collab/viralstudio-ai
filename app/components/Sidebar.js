"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "./SidebarContext";
import { useState, useEffect } from "react";
import useLiveCredits from "../lib/useLiveCredits";
import Icon from "./Icon";

const homeItem = { href: "/", label: "Home", icon: "dashboard" };
const toolItems = [
  {
    href: "/ai-video",
    label: "AI Video",
    icon: "movie",
    children: [
      {
        href: "/ai-video/text-to-video",
        label: "Text to Video",
        icon: "description",
      },
      {
        href: "/ai-video/image-to-video",
        label: "Image to Video",
        icon: "image",
      },
    ],
  },
  { href: "/ai-image", label: "Image Lab", icon: "image" },
  { href: "/library", label: "Library", icon: "folder" },
];

function SidebarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const { setMobileOpen } = useSidebar();
  const credits = useLiveCredits();
  const [showAdmin, setShowAdmin] = useState(false);
  const [openMegaMenu, setOpenMegaMenu] = useState(null);

  useEffect(() => {
    const host = window.location.hostname;
    setShowAdmin(!host.endsWith("viralstudio-ai.com"));
  }, []);

  useEffect(() => {
    const routes = [
      homeItem.href,
      ...toolItems.flatMap((i) => [i.href, ...(i.children || []).map((c) => c.href)]),
      ...(showAdmin ? ["/admin"] : []),
    ];
    routes.forEach((href) => router.prefetch(href));
  }, [router, showAdmin]);

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
          <h1 className="whitespace-nowrap font-extrabold tracking-tight leading-none" style={{ background: 'linear-gradient(135deg, #fff 30%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '16px', fontFamily: 'Geist, sans-serif' }}>ViralStudio AI</h1>
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
        {[...toolItems, ...(showAdmin ? [{ href: "/admin", label: "Admin Panel", icon: "shield" }] : [])].map((item) => {
          const isActive =
            pathname === item.href ||
            (item.children && pathname.startsWith(`${item.href}/`));

          if (item.children) {
            return (
              <div key={item.href}>
                <button
                  onClick={() => setOpenMegaMenu(openMegaMenu === item.href ? null : item.href)}
                  aria-expanded={openMegaMenu === item.href}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 transition-all duration-200 active:scale-[0.97] ${
                    isActive || openMegaMenu === item.href
                      ? "bg-white/[0.06] text-white"
                      : "text-on-surface-variant hover:bg-[rgba(255,255,255,0.04)] hover:text-white hover:translate-x-0.5"
                  }`}
                >
                  <Icon name={item.icon} className="shrink-0" size={20} />
                  <span className="sidebar-link-text flex-1 text-left">{item.label}</span>
                  <Icon name={openMegaMenu === item.href ? "chevron-left" : "chevron-right"} size={16} />
                </button>
                {openMegaMenu === item.href && (
                  <div className="fixed left-[272px] top-12 z-[60] w-[min(520px,calc(100vw-288px))] rounded-2xl border border-white/10 bg-[#171619]/95 p-5 shadow-2xl backdrop-blur-xl">
                    <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">AI Tools</p>
                        <h3 className="mt-1 text-lg font-bold text-white">AI Video</h3>
                      </div>
                      <button
                        onClick={() => setOpenMegaMenu(null)}
                        aria-label="Close AI Video menu"
                        className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                      >
                        <Icon name="x" size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {item.children.map((child) => {
                        const childActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => {
                              handleNav();
                              setOpenMegaMenu(null);
                            }}
                            className={`group flex items-center gap-4 rounded-xl border p-4 transition-all duration-200 ${
                              childActive
                                ? "border-primary/50 bg-primary/15 text-white"
                                : "border-white/[0.07] bg-white/[0.025] text-white/75 hover:border-primary/40 hover:bg-white/[0.07] hover:text-white"
                            }`}
                          >
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.07] text-primary transition group-hover:bg-primary/15">
                              <Icon name={child.icon} size={21} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-bold">{child.label}</span>
                              <span className="mt-1 block text-xs text-white/45">
                                {child.label === "Text to Video" ? "Create a video from a text prompt" : "Animate an image into a video"}
                              </span>
                            </span>
                            <Icon name="arrow-up-right" size={17} className="text-white/35 transition group-hover:text-primary" />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          }

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
      </nav>
      <div className="mt-auto pt-4 border-t border-surface-border/40 px-2">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-surface-container-low border border-surface-border/40" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}>
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-cyan to-primary flex items-center justify-center shrink-0">
            <Icon name="auto_awesome" className="text-white" size={12} />
          </div>
          <span className="sidebar-credits-text">AI Credits: <span className="text-yellow-400 font-bold">{credits ?? 0}</span></span>
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

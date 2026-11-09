"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "./SidebarContext";
import { useState } from "react";
import Icon from "./Icon";

const navItems = [
  { href: "/", label: "Home", icon: "dashboard" },
  {
    href: "/ai-video",
    label: "AI Video",
    icon: "movie",
    children: [
      { href: "/ai-video/text-to-video", label: "Text to Video", icon: "description", description: "Create videos from a text prompt" },
      { href: "/ai-video/image-to-video", label: "Image to Video", icon: "image", description: "Turn an image into a video" },
    ],
  },
  { href: "/ai-image", label: "Image Lab", icon: "image" },
  { href: "/library", label: "Library", icon: "folder" },
  { href: "/admin", label: "Admin Panel", icon: "settings" },
];

function SidebarContent() {
  const pathname = usePathname();
  const { setMobileOpen } = useSidebar();
  const [openMegaMenu, setOpenMegaMenu] = useState(false);
  const handleNav = () => {
    setMobileOpen(false);
    setOpenMegaMenu(false);
  };

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-full w-56 flex-col overflow-visible border-r border-white/[0.09] bg-[#0d0d12] p-3">
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

      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.children && pathname.startsWith(item.href + "/"));
          if (item.children) {
            return (
              <div
                key={item.href}
                className="relative"
                onMouseEnter={() => {
                  if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) {
                    setOpenMegaMenu(true);
                  }
                }}
                onMouseLeave={() => {
                  if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) {
                    setOpenMegaMenu(false);
                  }
                }}
                onFocus={() => {
                  if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) {
                    setOpenMegaMenu(true);
                  }
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenMegaMenu((value) => !value)}
                  aria-expanded={openMegaMenu}
                  className={`group flex h-10 w-full items-center gap-3 rounded-full px-3.5 text-left text-[15px] font-semibold transition-colors duration-150 active:scale-[0.985] motion-reduce:transform-none ${
                    active || openMegaMenu
                      ? "bg-white/[0.09] text-white"
                      : "text-white/75 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <Icon name={item.icon} size={18} className={active ? "text-primary" : "text-white/65 group-hover:text-white"} />
                  <span className="flex-1">{item.label}</span>
                  <Icon name="chevron_right" size={15} className={`hidden md:block transition-transform ${openMegaMenu ? "rotate-90 text-primary" : "text-white/45"}`} />
                  <span aria-hidden="true" className={`ml-auto text-[21px] font-normal leading-none md:hidden ${openMegaMenu ? "text-primary" : "text-white/55"}`}>›</span>
                </button>

                {openMegaMenu && (
                  <>
                    <div className="absolute left-0 top-0 z-[-1] h-10 w-full" />
                    <div className="absolute left-[calc(100%+10px)] top-0 z-[80] hidden w-[360px] rounded-[18px] border border-white/[0.10] bg-[#19191d]/85 p-3 shadow-[0_20px_64px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:block">
                      <div className="flex flex-col gap-1">
                        {item.children.map((child) => {
                          const childActive = pathname === child.href;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={handleNav}
                              className={`group flex h-10 items-center gap-2.5 rounded-xl border px-3 text-left text-[14px] font-semibold transition-all duration-200 ${
                                childActive
                                  ? "border-primary/40 bg-primary/[0.12]"
                                  : "border-white/[0.07] bg-white/[0.025] hover:border-primary/30 hover:bg-white/[0.07]"
                              }`}
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.07] text-primary transition group-hover:bg-primary/15">
                                <Icon name={child.icon} size={19} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block whitespace-nowrap text-[14px] font-semibold leading-5 text-white/95">{child.label}</span>
                                <span className="mt-1 block text-[12px] leading-5 text-white/50">{child.description}</span>
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {openMegaMenu && (
                  <div className="mt-1 flex flex-col gap-1 pl-3 md:hidden">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={handleNav}
                        className={`group flex h-10 items-center gap-3 rounded-full px-3.5 text-[15px] font-semibold transition-colors duration-150 active:scale-[0.985] motion-reduce:transform-none ${
                          pathname === child.href
                            ? "bg-primary/[0.12] text-primary shadow-[inset_0_0_0_1px_rgba(168,85,247,0.08)]"
                            : "text-white/75 hover:bg-white/[0.06] hover:text-white"
                        }`}
                      >
                        <Icon name={child.icon} size={child.icon === "image" ? 21 : 19} className={pathname === child.href ? "text-primary" : "text-white/65 group-hover:text-white"} />
                        <span className="whitespace-nowrap leading-5">{child.label}</span>
                      </Link>
                    ))}
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
              className={`group flex h-10 items-center gap-3 rounded-full px-3.5 text-[15px] font-semibold transition-all duration-200 ${
                active
                  ? "bg-primary/[0.12] text-primary shadow-[inset_0_0_0_1px_rgba(168,85,247,0.08)]"
                  : "text-white/75 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <Icon name={item.icon} size={18} className={active ? "text-primary" : "text-white/65 group-hover:text-white"} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-white/[0.07] px-2 pb-2 pt-4">
        <Link
          href="/affiliate"
          onClick={handleNav}
          className="group flex h-11 w-full items-center gap-3 rounded-xl border border-primary/20 bg-primary/[0.08] px-3.5 text-[15px] font-semibold text-white/90 shadow-[0_4px_18px_rgba(0,0,0,0.16)] transition-all duration-200 hover:border-primary/35 hover:bg-primary/[0.14] hover:text-white"
        >
          <Icon name="users" size={18} className="text-primary" />
          <span>Affiliate</span>
          <Icon name="arrow-up-right" size={14} className="ml-auto text-white/45 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </aside>
  );
}

export default function Sidebar() {
  const { isMobileOpen, setMobileOpen } = useSidebar();

  return (
    <>
      <div className="hidden md:block"><SidebarContent /></div>
      <div className={`md:hidden ${isMobileOpen ? "" : "pointer-events-none"}`}>
        <div className={`mobile-sidebar-overlay transition-opacity duration-300 ${isMobileOpen ? "opacity-100" : "opacity-0"}`} onClick={() => setMobileOpen(false)} />
        <div className={`fixed inset-0 z-[70] flex transition-transform duration-300 ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <SidebarContent />
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      </div>
    </>
  );
}

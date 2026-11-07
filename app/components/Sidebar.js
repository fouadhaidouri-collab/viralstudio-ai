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
                onMouseEnter={() => setOpenMegaMenu(true)}
                onMouseLeave={() => setOpenMegaMenu(false)}
              >
                <button
                  type="button"
                  onClick={() => setOpenMegaMenu((value) => !value)}
                  aria-expanded={openMegaMenu}
                  className={`group flex h-10 w-full items-center gap-3 rounded-full px-3.5 text-left text-[14px] font-medium transition-all duration-200 ${
                    active || openMegaMenu
                      ? "bg-white/[0.09] text-white"
                      : "text-white/75 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <Icon name={item.icon} size={18} className={active ? "text-primary" : "text-white/65 group-hover:text-white"} />
                  <span className="flex-1">{item.label}</span>
                  <Icon name="chevron-right" size={15} className={`transition-transform ${openMegaMenu ? "rotate-90 text-primary" : "text-white/45"}`} />
                </button>

                {openMegaMenu && (
                  <>
                    <div className="absolute left-0 top-0 z-[-1] h-10 w-full" />
                    <div className="absolute left-[calc(100%+10px)] top-[-52px] z-[80] hidden w-[430px] rounded-[22px] border border-white/[0.10] bg-[#19191d]/65 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.48)] backdrop-blur-2xl md:block">
                      <div className="mb-3 flex items-center justify-between px-1">
                        <div>
                          <div className="text-[11px] font-medium text-white/40">CREATE</div>
                          <div className="mt-1 text-[15px] font-semibold text-white">AI Video</div>
                        </div>
                        <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">2 tools</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {item.children.map((child) => {
                          const childActive = pathname === child.href;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={handleNav}
                              className={`group flex min-h-[112px] flex-col rounded-2xl border p-3.5 transition-all duration-200 ${
                                childActive
                                  ? "border-primary/40 bg-primary/[0.12]"
                                  : "border-white/[0.07] bg-white/[0.025] hover:border-primary/30 hover:bg-white/[0.07]"
                              }`}
                            >
                              <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.07] text-primary transition group-hover:bg-primary/15">
                                <Icon name={child.icon} size={19} />
                              </span>
                              <span className="text-[13px] font-semibold text-white/90">{child.label}</span>
                              <span className="mt-1 text-[11px] leading-4 text-white/40">{child.description}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {openMegaMenu && (
                  <div className="mt-1.5 space-y-1 pl-8 md:hidden">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={handleNav}
                        className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] transition ${
                          pathname === child.href ? "bg-primary/15 text-primary" : "text-white/65 hover:bg-white/[0.06] hover:text-white"
                        }`}
                      >
                        <Icon name={child.icon} size={16} />
                        {child.label}
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
              className={`group flex h-10 items-center gap-3 rounded-full px-3.5 text-[14px] font-medium transition-all duration-200 ${
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
          className="flex h-10 w-full items-center gap-3 rounded-full px-3.5 text-[14px] font-medium text-white/75 transition-all duration-200 hover:bg-white/[0.06] hover:text-white"
        >
          <Icon name="users" size={18} className="text-white/65" />
          <span>Affiliate</span>
          <Icon name="arrow-up-right" size={14} className="ml-auto text-white/40" />
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

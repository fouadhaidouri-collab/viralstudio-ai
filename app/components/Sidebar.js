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
      <Link href="/" onClick={handleNav} className="mb-7 flex items-center gap-3 px-2 py-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 shadow-[0_0_22px_rgba(249,115,22,0.24)]">
          <Icon name="bolt" size={19} className="text-white" />
        </div>
        <div className="min-w-0">
          <div className="whitespace-nowrap text-[15px] font-extrabold tracking-tight text-white">ViralStudio AI</div>
          <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.17em] text-white/35">Creative Studio</div>
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
                  <Icon name={item.icon} size={18} className={active ? "text-orange-400" : "text-white/65 group-hover:text-white"} />
                  <span className="flex-1">{item.label}</span>
                  <Icon name="chevron-right" size={15} className={`transition-transform ${openMegaMenu ? "rotate-90 text-orange-400" : "text-white/45"}`} />
                </button>

                {openMegaMenu && (
                  <>
                    <div className="absolute left-0 top-0 z-[-1] h-10 w-full" />
                    <div className="absolute left-[calc(100%+10px)] top-[-52px] z-[80] hidden w-[430px] rounded-[22px] border border-white/[0.09] bg-[#19191d]/95 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl md:block">
                      <div className="mb-3 flex items-center justify-between px-1">
                        <div>
                          <div className="text-[11px] font-medium text-white/40">CREATE</div>
                          <div className="mt-1 text-[15px] font-semibold text-white">AI Video</div>
                        </div>
                        <span className="rounded-full border border-orange-400/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-semibold text-orange-300">2 tools</span>
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
                                  ? "border-orange-400/40 bg-orange-500/[0.12]"
                                  : "border-white/[0.07] bg-white/[0.025] hover:border-orange-400/30 hover:bg-white/[0.07]"
                              }`}
                            >
                              <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.07] text-orange-300 transition group-hover:bg-orange-500/15">
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
                          pathname === child.href ? "bg-orange-500/15 text-orange-300" : "text-white/65 hover:bg-white/[0.06] hover:text-white"
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
                  ? "bg-orange-500/[0.12] text-orange-400 shadow-[inset_0_0_0_1px_rgba(249,115,22,0.08)]"
                  : "text-white/75 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <Icon name={item.icon} size={18} className={active ? "text-orange-400" : "text-white/65 group-hover:text-white"} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-3 pb-2 pt-4 text-[10px] font-medium tracking-wide text-white/25">VIRALSTUDIO AI</div>
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

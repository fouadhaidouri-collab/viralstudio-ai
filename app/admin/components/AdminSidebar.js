"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "../../components/Icon";

const menuGroups = [
  {
    heading: "Main",
    items: [
      { href: "/admin", label: "Overview", icon: "dashboard" },
      { href: "/admin/users", label: "Users", icon: "group_add" },
      { href: "/admin/credits", label: "Credits", icon: "currency_bitcoin" },
      { href: "/admin/payment-methods", label: "Payments", icon: "credit_card" },
      { href: "/admin/payment-logs", label: "Payment Logs", icon: "webhook" },
    ],
  },
  {
    heading: "AI Tools",
    items: [
      { href: "/ai-video", label: "AI Video", icon: "video" },
      { href: "/ai-image", label: "Image Lab", icon: "image" },
    ],
  },
  {
    heading: "Business",
    items: [
      { href: "/admin/plans", label: "Plans & Pricing", icon: "workspace_premium" },
      { href: "/admin/affiliates", label: "Affiliates", icon: "share" },
    ],
  },
];

export default function AdminSidebar({ mobileOpen, setMobileOpen }) {
  const pathname = usePathname();

  const handleNav = () => setMobileOpen(false);

  const isActive = (href) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <aside className="w-64 h-full bg-surface border-r border-surface-border/80 flex flex-col overflow-hidden" style={{ boxShadow: "4px 0 32px rgba(0,0,0,0.4)" }}>
      <Link href="/admin" onClick={handleNav} className="flex items-center gap-3 px-5 pt-5 pb-4 shrink-0">
        <div className="relative">
          <div className="absolute inset-0 rounded-xl blur-xl bg-primary/40" />
          <div className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 relative z-10" style={{ background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 50%, #3b0764 100%)", boxShadow: "0 0 30px rgba(168,85,247,0.4), inset 0 1px 0 rgba(255,255,255,0.2)" }}>
            <Icon name="bolt" className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" size={20} />
          </div>
        </div>
        <div>
          <h2 className="font-extrabold tracking-tight leading-none" style={{ background: "linear-gradient(135deg, #fff 30%, #a855f7 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: "16px", fontFamily: "Geist, sans-serif" }}>ViralStudio AI</h2>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-primary" />
            <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-[0.15em]">Admin Panel</span>
          </div>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4 space-y-5">
        {menuGroups.map((group) => (
          <div key={group.heading}>
            <div className="pt-3 pb-1 px-2">
              <span className="sidebar-heading-text">{group.heading}</span>
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNav}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 active:scale-[0.97] ${
                      active
                        ? "primary-gradient text-white shadow-lg shadow-primary/30"
                        : "text-on-surface-variant hover:bg-[rgba(255,255,255,0.04)] hover:text-white hover:translate-x-0.5"
                    }`}
                  >
                    <Icon name={item.icon} className="shrink-0" size={20} />
                    <span className="sidebar-link-text flex-1">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 px-4 pb-4">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-[rgba(255,255,255,0.04)] hover:text-white transition-all duration-200 text-xs font-semibold active:scale-[0.97]"
          onClick={handleNav}
        >
          <Icon name="arrow_back" className="shrink-0" size={20} />
          <span className="sidebar-link-text flex-1">Back to Dashboard</span>
        </Link>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden md:block h-full">{sidebarContent}</div>
      <div className={`md:hidden fixed inset-0 z-[70] ${mobileOpen ? "" : "pointer-events-none"}`}>
        <div className={`mobile-sidebar-overlay transition-opacity duration-300 ${mobileOpen ? "opacity-100" : "opacity-0"}`} onClick={() => setMobileOpen(false)} />
        <div className={`fixed left-0 top-0 h-full transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
          {sidebarContent}
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
      `}</style>
    </>
  );
}

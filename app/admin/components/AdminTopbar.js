"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Icon from "../../components/Icon";
import ProfileDropdown from "../../components/ProfileDropdown";

export default function AdminTopbar({ title, setMobileOpen }) {
  const router = useRouter();
  const [lang, setLang] = useState("en");
  const [searchOpen, setSearchOpen] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    fetch("/api/admin/notifications").then((r) => r.json()).then((d) => {
      setNotifications(d.notifications || []);
      setUnread(d.unread || 0);
    }).catch(() => {});
    const iv = setInterval(() => {
      fetch("/api/admin/notifications").then((r) => r.json()).then((d) => {
        setNotifications(d.notifications || []);
        setUnread(d.unread || 0);
      }).catch(() => {});
    }, 15000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markRead = async (id) => {
    await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: 1 } : n));
    setUnread((prev) => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: null }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    setUnread(0);
  };

  const languages = [
    { code: "en", label: "English", dir: "ltr" },
    { code: "ar", label: "العربية", dir: "rtl" },
  ];

  const handleLanguageChange = (code) => {
    setLang(code);
    document.documentElement.dir = code === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = code;
  };

  return (
    <header className="h-14 md:h-16 bg-surface/60 backdrop-blur-2xl border-b border-surface-border/40 flex items-center justify-between px-4 md:px-6 shrink-0" style={{ boxShadow: "0 1px 24px rgba(0,0,0,0.3)" }}>
      <div className="flex items-center gap-3">
        <button onClick={() => setMobileOpen(true)} className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-surface-container-low border border-surface-border/50 hover:bg-surface-container-high transition-all">
          <Icon name="menu" className="text-white" size={18} />
        </button>
        <div className="hidden md:flex items-center gap-2">
          {title && (
            <>
              <Icon name="auto_awesome" className="text-primary" size={14} />
              <h1 className="text-sm font-bold text-white">{title}</h1>
            </>
          )}
        </div>
        <div className="md:hidden">
          {title && (
            <h1 className="text-sm font-bold text-white truncate max-w-[140px]">{title}</h1>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <div className="relative hidden sm:block">
          <Icon name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant" size={14} />
          <input
            type="text"
            value={searchOpen}
            onChange={(e) => setSearchOpen(e.target.value)}
            placeholder="Search admin..."
            className="w-40 md:w-56 bg-surface-container-low border border-surface-border/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-on-surface-variant focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>

        <div className="relative group">
          <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-surface-container-low border border-surface-border/50 hover:bg-surface-container-high transition-all text-xs">
            <Icon name="language" className="text-on-surface-variant" size={14} />
            <span className="text-xs font-medium text-on-surface-variant hidden sm:inline">{lang === "en" ? "EN" : "AR"}</span>
          </button>
          <div className="absolute right-0 top-full mt-1 w-32 bg-surface-container border border-surface-border/80 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => handleLanguageChange(l.code)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${
                  lang === l.code ? "text-primary bg-primary/10" : "text-on-surface-variant hover:bg-surface-container-high hover:text-white"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${lang === l.code ? "bg-primary" : "bg-on-surface-variant/30"}`} />
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative" ref={notifRef}>
          <button onClick={() => setNotifOpen(!notifOpen)} className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-surface-container-low border border-surface-border/50 hover:bg-surface-container-high transition-all">
            <Icon name="notifications" className="text-on-surface-variant" size={16} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full shadow-lg">{unread > 9 ? "9+" : unread}</span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-surface-container border border-surface-border/80 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border/40">
                <span className="text-xs font-bold text-white">Notifications</span>
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-[10px] text-primary font-semibold hover:underline">Mark all read</button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-on-surface-variant">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => { if (!n.is_read) markRead(n.id); }}
                      className={`px-4 py-3 border-b border-surface-border/20 cursor-pointer hover:bg-surface-container-high transition-all ${!n.is_read ? 'bg-primary/5' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />}
                        <div className={!n.is_read ? '' : 'ml-[14px]'}>
                          <p className="text-xs font-semibold text-white">{n.title}</p>
                          {n.message && <p className="text-[11px] text-on-surface-variant mt-0.5">{n.message}</p>}
                          <p className="text-[10px] text-on-surface-variant/50 mt-1">{new Date(n.created_at + 'Z').toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-5 md:h-6 w-px bg-surface-border/30" />
        <ProfileDropdown />
      </div>
    </header>
  );
}

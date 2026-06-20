"use client";
import { useState, useRef, useEffect } from "react";
import Icon from "../../components/Icon";

export default function ActionMenu({ items, size = "sm" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className={`${size === "sm" ? "w-7 h-7" : "w-8 h-8"} flex items-center justify-center rounded-lg bg-surface-container-high border border-surface-border/50 hover:bg-surface-container-higher transition-all`}>
        <Icon name="more_horiz" className="text-on-surface-variant" size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-surface-container border border-surface-border/80 rounded-xl shadow-2xl z-50 overflow-hidden animate-dropdown-open">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => { item.onClick?.(); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-colors ${
                item.variant === "danger" ? "text-error hover:bg-error/10" :
                item.variant === "success" ? "text-green-400 hover:bg-green-500/10" :
                "text-on-surface-variant hover:bg-surface-container-high hover:text-white"
              }`}
            >
              {item.icon && <Icon name={item.icon} size={14} />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

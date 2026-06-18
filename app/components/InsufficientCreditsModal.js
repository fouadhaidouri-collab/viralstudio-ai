"use client";
import { useRouter } from "next/navigation";

export default function InsufficientCreditsModal({ needed, current, onClose }) {
  const router = useRouter();
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-container border border-surface-border/60 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()} style={{ boxShadow: "0 25px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.08)" }}>
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400/20 to-yellow-500/10 flex items-center justify-center border border-yellow-400/20">
            <span className="material-symbols-outlined text-2xl text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-white mb-1">Insufficient Credits</h3>
            <p className="text-xs text-on-surface-variant/80 leading-relaxed">
              You need <span className="text-yellow-400 font-semibold">{needed}</span> credits but you have <span className="text-on-surface-variant font-semibold">{current}</span>.
            </p>
          </div>
          <div className="flex gap-2 w-full pt-1">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-surface-border/60 text-xs font-medium text-on-surface-variant hover:bg-surface-container-high transition-all">
              Cancel
            </button>
            <button onClick={() => router.push("/pricing")} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-xs font-bold text-black shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 hover:translate-y-[-1px] transition-all active:scale-[0.97]">
              Get Credits
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

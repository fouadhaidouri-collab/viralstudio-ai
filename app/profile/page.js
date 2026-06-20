"use client";

import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { SidebarProvider } from "../components/SidebarContext";
import Icon from "../components/Icon";

export default function ProfilePage() {
  const sample = {
    email: "user@example.com",
    credits: "1,250",
    plan: "Pro Plan",
  };

  return (
    <div className="h-screen overflow-hidden no-x-scroll">
      <SidebarProvider>
      <Sidebar />
      <TopBar />
      <main className="fixed top-14 md:top-16 right-0 w-full md:w-[calc(100%-16rem)] bottom-0 overflow-y-auto smooth-scroll">
        <div className="max-w-xl mx-auto px-4 py-6 md:py-10 space-y-6">
          <div className="glass-card rounded-xl p-6 border border-white/5 card-glow" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
            <div className="flex items-center gap-4 pb-5 border-b border-surface-border/40">
              <div className="w-14 h-14 rounded-full p-[2px] shrink-0" style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}>
                <div className="w-full h-full rounded-full bg-surface flex items-center justify-center">
                  <Icon name="person" className="text-primary" size={24} />
                </div>
              </div>
              <div>
                <div className="text-lg font-semibold text-white">{sample.email}</div>
                <div className="text-sm text-on-surface-variant">{sample.plan}</div>
              </div>
            </div>

            <div className="flex items-center justify-between py-4 px-1">
              <span className="text-sm text-on-surface-variant">Credits</span>
              <span className="text-lg font-bold text-yellow-400">{sample.credits}</span>
            </div>

            <div className="space-y-1 pt-2 border-t border-surface-border/40">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface hover:bg-white/[0.06] hover:text-white transition-all text-left">
                <Icon name="edit" className="text-primary shrink-0" size={16} /> Change Email
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface hover:bg-white/[0.06] hover:text-white transition-all text-left">
                <Icon name="lock" className="text-primary shrink-0" size={16} /> Reset Password
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface hover:bg-white/[0.06] hover:text-white transition-all text-left">
                <Icon name="refresh" className="text-primary shrink-0" size={16} /> Recover Password / استيراد كلمة السر
              </button>
            </div>
          </div>
        </div>
      </main>
      </SidebarProvider>
    </div>
  );
}

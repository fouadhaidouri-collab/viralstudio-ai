"use client";

import { useState, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import AuthGuard from "../components/AuthGuard";
import { SidebarProvider } from "../components/SidebarContext";
import { useAuth } from "../lib/AuthContext";
import Icon from "../components/Icon";

function md5(str) {
  const md5cycle = (x, k) => {
    let a = x[0], b = x[1], c = x[2], d = x[3];
    a = ff(a, b, c, d, k[0], 7, -680876936); d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819); b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897); d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341); b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416); d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063); b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682); d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290); b = ff(b, c, d, a, k[15], 22, 1236535329);
    a = gg(a, b, c, d, k[1], 5, -165796510); d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713); b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691); d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335); b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438); d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961); b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467); d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473); b = gg(b, c, d, a, k[12], 20, -1926607734);
    a = hh(a, b, c, d, k[5], 4, -378558); d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562); b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060); d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632); b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174); d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979); b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487); d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520); b = hh(b, c, d, a, k[2], 23, -995338651);
    a = ii(a, b, c, d, k[0], 6, -198630844); d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905); b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571); d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523); b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359); d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380); b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070); d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259); b = ii(b, c, d, a, k[9], 21, -343485551);
    x[0] = add32(a, x[0]); x[1] = add32(b, x[1]); x[2] = add32(c, x[2]); x[3] = add32(d, x[3]);
  };
  const add32 = (a, b) => (a + b) & 0xFFFFFFFF;
  const cmn = (q, a, b, x, s, t) => add32(add32(a, q), add32(x, t)) << s | add32(add32(a, q), add32(x, t)) >>> (32 - s);
  const ff = (a, b, c, d, x, s, t) => cmn(b & c | ~b & d, a, b, x, s, t);
  const gg = (a, b, c, d, x, s, t) => cmn(b & d | c & ~d, a, b, x, s, t);
  const hh = (a, b, c, d, x, s, t) => cmn(b ^ c ^ d, a, b, x, s, t);
  const ii = (a, b, c, d, x, s, t) => cmn(c ^ (b | ~d), a, b, x, s, t);
  const hex = (n) => (n >>> 0).toString(16).padStart(8, '0');
  const strToChrs8 = (str) => { const chrs = [], mask = 0xFF; for (let i = 0; i < str.length; i++) chrs[i] = str.charCodeAt(i) & mask; return chrs; };
  let n = str.length, state = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
  let cnt = [], len = n * 8;
  for (let i = 0; i < 16; i++) cnt[i] = 0;
  for (let i = 0; i < n; i++) cnt[i >> 2] |= strToChrs8(str)[i] << ((i % 4) * 8);
  cnt[n >> 2] |= 0x80 << ((n % 4) * 8);
  if (n > 55) { md5cycle(state, cnt); for (let i = 0; i < 16; i++) cnt[i] = 0; }
  cnt[14] = len;
  md5cycle(state, cnt);
  return hex(state[0]) + hex(state[1]) + hex(state[2]) + hex(state[3]);
}

export default function ProfilePage() {
  const [tab, setTab] = useState("overview");
  const { user, logout } = useAuth();
  const email = user?.email || "user@example.com";
  const name = user?.name || email.split("@")[0];
  const username = email.split("@")[0];
  const gravatarUrl = useMemo(() => {
    const hash = md5(email.trim().toLowerCase());
    return `https://www.gravatar.com/avatar/${hash}?s=200&d=identicon`;
  }, [email]);

  const sample = {
    email,
    credits: "1,250",
    plan: "Pro Plan",
    memberSince: "Jan 2026",
  };

  const tabs = [
    { key: "overview", label: "Overview", icon: "person" },
    { key: "security", label: "Security", icon: "lock" },
  ];

  return (
    <AuthGuard>
    <div className="h-screen overflow-hidden no-x-scroll">
      <SidebarProvider>
      <Sidebar />
      <TopBar />
      <main className="fixed top-14 md:top-16 right-0 w-full md:w-[calc(100%-16rem)] bottom-0 overflow-y-auto smooth-scroll">
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-10">

          {/* Profile Header */}
          <div className="glass-card rounded-2xl p-6 md:p-8 border border-white/5 card-glow mb-6" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
            <div className="flex items-start gap-5">
              <div className="relative shrink-0">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full p-[2px]" style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}>
                  <div className="w-full h-full rounded-full bg-surface overflow-hidden">
                    <img src={gravatarUrl} alt={email} className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-500 border-2 border-surface rounded-full" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl md:text-2xl font-bold text-white truncate">{name}</h1>
                <p className="text-sm text-on-surface-variant mt-0.5">{email} · @{username}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-primary/15 text-primary border border-primary/20">
                    <Icon name="workspace_premium" size={12} /> {sample.plan}
                  </span>
                  <span className="text-[11px] text-on-surface-variant">Member since {sample.memberSince}</span>
                </div>
              </div>
              <button onClick={() => { logout(); }} className="shrink-0 px-4 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 border border-red-400/20 transition-all flex items-center gap-1.5">
                <Icon name="logout" size={14} /> Logout
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 p-1 bg-surface-container-low rounded-xl border border-surface-border/40">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  tab === t.key
                    ? "bg-surface-container-high text-white shadow-sm"
                    : "text-on-surface-variant hover:text-white"
                }`}
              >
                <Icon name={t.icon} size={16} />
                {t.label}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <div className="space-y-5">

              {/* Credits Card */}
              <div className="glass-card rounded-2xl p-6 border border-white/5 card-glow relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.06), rgba(99,102,241,0.03), transparent)' }}>
                <div className="absolute top-0 right-0 w-40 h-40 opacity-5" style={{ background: 'radial-gradient(circle, #a855f7, transparent 70%)' }} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-on-surface-variant">Available Credits</span>
                    <Icon name="bolt" className="text-yellow-400" size={18} />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-white mb-3">{sample.credits.toLocaleString()}</div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 rounded-full bg-surface-container-high overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: '65%', background: 'linear-gradient(90deg, #a855f7, #6366f1)' }} />
                    </div>
                    <span className="text-[11px] text-on-surface-variant shrink-0">65% remaining</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="glass-card rounded-2xl p-6 border border-white/5 card-glow" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
                <h2 className="text-sm font-semibold text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-surface-container-low border border-surface-border/50 hover:border-primary/30 hover:bg-surface-container-high transition-all text-left group">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Icon name="edit" className="text-primary" size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Change Email</div>
                      <div className="text-[11px] text-on-surface-variant">Update your email address</div>
                    </div>
                  </button>
                  <button className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-surface-container-low border border-surface-border/50 hover:border-primary/30 hover:bg-surface-container-high transition-all text-left group">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Icon name="lock" className="text-primary" size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Reset Password</div>
                      <div className="text-[11px] text-on-surface-variant">Change your password</div>
                    </div>
                  </button>
                  <button className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-surface-container-low border border-surface-border/50 hover:border-primary/30 hover:bg-surface-container-high transition-all text-left group">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Icon name="refresh" className="text-primary" size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Recover Password</div>
                      <div className="text-[11px] text-on-surface-variant">استيراد كلمة السر</div>
                    </div>
                  </button>
                  <button className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-surface-container-low border border-surface-border/50 hover:border-primary/30 hover:bg-surface-container-high transition-all text-left group">
                    <div className="w-10 h-10 rounded-lg bg-yellow-400/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Icon name="bolt" className="text-yellow-400" size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Buy Credits</div>
                      <div className="text-[11px] text-on-surface-variant">Top up your balance</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === "security" && (
            <div className="space-y-5">

              {/* Email Section */}
              <div className="glass-card rounded-2xl p-6 border border-white/5 card-glow" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon name="mail" className="text-primary" size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">Email Address</h2>
                    <p className="text-[11px] text-on-surface-variant">Your current login email</p>
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-surface-container-low rounded-xl border border-surface-border/40">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                    <span className="text-sm text-white truncate">{sample.email}</span>
                  </div>
                  <button className="text-xs font-medium text-primary hover:text-primary/80 transition-colors shrink-0 ml-3">Change</button>
                </div>
              </div>

              {/* Password Section */}
              <div className="glass-card rounded-2xl p-6 border border-white/5 card-glow" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon name="lock" className="text-primary" size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">Password</h2>
                    <p className="text-[11px] text-on-surface-variant">Set a strong password to protect your account</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-medium text-on-surface-variant mb-1.5 block">Current Password</label>
                    <input type="password" placeholder="Enter current password" className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 transition-colors" />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-on-surface-variant mb-1.5 block">New Password</label>
                    <input type="password" placeholder="Enter new password" className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 transition-colors" />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-on-surface-variant mb-1.5 block">Confirm New Password</label>
                    <input type="password" placeholder="Confirm new password" className="w-full bg-surface-container-lowest border border-surface-border/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 transition-colors" />
                  </div>
                  <button className="w-full primary-gradient text-white font-semibold py-2.5 rounded-xl text-sm hover:opacity-90 transition-all active:scale-[0.98]">
                    Update Password
                  </button>
                </div>
              </div>

              {/* Recover Password */}
              <div className="glass-card rounded-2xl p-6 border border-white/5 card-glow" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon name="refresh" className="text-primary" size={18} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-sm font-semibold text-white">Recover Password</h2>
                    <p className="text-[11px] text-on-surface-variant">استيراد كلمة السر — Send recovery link to your email</p>
                  </div>
                  <button className="text-xs font-medium text-primary hover:text-primary/80 transition-colors shrink-0">Send Link</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
      </SidebarProvider>
    </div>
    </AuthGuard>
  );
}

"use client";

import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { SidebarProvider } from "../components/SidebarContext";
import { useTranslate } from "../components/LanguageProvider";

const stats = [
  { label: "Videos Created", value: "128", icon: "movie", color: "text-primary" },
  { label: "Images Generated", value: "3,452", icon: "image", color: "text-secondary" },
  { label: "Total Credits Used", value: "18,240", icon: "bolt", color: "text-yellow-400" },
  { label: "Projects Completed", value: "64", icon: "checklist", color: "text-tertiary" },
  { label: "Scripts Written", value: "891", icon: "auto_awesome", color: "text-accent-pink" },
  { label: "Reels Clipped", value: "2,156", icon: "content_cut", color: "text-accent-orange" },
];

const recentActivity = [
  { action: "Generated AI Video", detail: "Cinematic drone shot over mountains", time: "2 min ago", icon: "movie", color: "text-primary" },
  { action: "Created AI Image", detail: "Portrait with dramatic lighting", time: "15 min ago", icon: "image", color: "text-secondary" },
  { action: "Clipped Reels", detail: "12 reels from product review video", time: "1 hour ago", icon: "content_cut", color: "text-accent-orange" },
  { action: "Optimized Script", detail: "Hook Gen for SaaS product launch", time: "3 hours ago", icon: "auto_awesome", color: "text-accent-pink" },
  { action: "Generated UGC Ad", detail: "Skincare product testimonial", time: "5 hours ago", icon: "record_voice_over", color: "text-tertiary" },
  { action: "Upgraded Plan", detail: "Professional Plan activated", time: "2 days ago", icon: "workspace_premium", color: "text-yellow-400" },
  { action: "Team Member Added", detail: "alex@studio.com joined your workspace", time: "1 week ago", icon: "group_add", color: "text-primary" },
];

const feedbackData = [
  { text: "The quality of AI-generated videos has dramatically improved our content pipeline. We're publishing 3x more now.", name: "Sarah Chen", title: "Content Director", rating: 5 },
  { text: "UGC Engine saved us thousands on creator fees. The avatars look incredibly realistic.", name: "Marcus Johnson", title: "Marketing Lead", rating: 5 },
  { text: "Hook Generator is a game-changer. Our engagement rates went up 40% since we started using it.", name: "Emily Rodriguez", title: "Social Media Manager", rating: 5 },
  { text: "Been using ViralStudio for 6 months. The clipping engine alone is worth the subscription.", name: "David Park", title: "Video Editor", rating: 5 },
  { text: "The image generation quality rivals Midjourney. Incredible for a fraction of the cost.", name: "Lisa Thompson", title: "Graphic Designer", rating: 4 },
  { text: "Customer support is exceptional. They helped us set up custom workflows for our team.", name: "James Wilson", title: "CEO, GrowthLab", rating: 5 },
  { text: "We switched from Runway to ViralStudio and haven't looked back. Better value and results.", name: "Nina Patel", title: "Creative Director", rating: 5 },
  { text: "The AI voices are so natural, our audience can't tell the difference. Amazing technology.", name: "Alex Rivera", title: "Content Creator", rating: 5 },
  { text: "Clip length options are perfect for multi-platform publishing. Saves us hours of manual editing.", name: "Ryan O'Brien", title: "Digital Strategist", rating: 4 },
  { text: "Template library is extensive and high quality. We use them as starting points for every project.", name: "Hannah Kim", title: "Video Producer", rating: 5 },
  { text: "Credit system is transparent and fair. No hidden costs or surprise charges.", name: "Omar Hassan", title: "Freelance Creator", rating: 4 },
  { text: "The platform keeps getting better with each update. The team clearly listens to user feedback.", name: "Sophie Martin", title: "Product Manager", rating: 5 },
  { text: "Multi-language support made it possible for us to create content for our global audience.", name: "Takeshi Yamamoto", title: "Localization Lead", rating: 5 },
  { text: "Script optimization suggestions are surprisingly accurate. Saves us so many revisions.", name: "Priya Sharma", title: "Copywriter", rating: 4 },
  { text: "Dashboard analytics help us track exactly what's performing. Data-driven content creation.", name: "Michael Torres", title: "Growth Hacker", rating: 5 },
  { text: "The preview system lets us iterate quickly without wasting credits. Very well thought out.", name: "Laura Beck", title: "UI Designer", rating: 5 },
  { text: "Team collaboration features are seamless. My whole team can work on projects simultaneously.", name: "Chris Evans", title: "Team Lead", rating: 4 },
  { text: "Resolution options give us flexibility for different platforms. From TikTok to YouTube, it all works.", name: "Fatima Al-Rashid", title: "Media Producer", rating: 5 },
  { text: "Pricing is very competitive compared to other AI video platforms. Best value in the market.", name: "Daniel Kowalski", title: "Startup Founder", rating: 5 },
  { text: "The learning curve is minimal. I had my first video generated within 5 minutes of signing up.", name: "Grace Liu", title: "New Creator", rating: 5 },
  { text: "Bulk generation feature is a lifesaver for agencies. We can produce client content at scale.", name: "Robert Chen", title: "Agency Owner", rating: 5 },
  { text: "Aspect ratio presets cover all major platforms perfectly. No more manual cropping.", name: "Maya Singh", title: "Content Strategist", rating: 4 },
  { text: "Voice cloning accuracy is impressive. We use it for consistent brand narration across videos.", name: "Andrew Foster", title: "Brand Manager", rating: 5 },
  { text: "The community templates are a goldmine. Other creators share amazing starting points.", name: "Zoe Williams", title: "Community Manager", rating: 4 },
  { text: "Integrates perfectly with our existing workflow. API documentation is clear and complete.", name: "Kevin Brown", title: "Developer", rating: 5 },
  { text: "Annual plan saved us 30% and the credits last longer than expected. Great ROI.", name: "Rachel Green", title: "Operations Manager", rating: 5 },
  { text: "The quality-to-speed ratio is unmatched. We get production-quality results in minutes.", name: "Tom Anderson", title: "Production Lead", rating: 5 },
  { text: "I've tried every AI video tool on the market. This is by far the most polished experience.", name: "Jessica Park", title: "Tech Reviewer", rating: 5 },
  { text: "Brand kit feature keeps all our content consistent. Every video automatically matches our style.", name: "Diana Lopez", title: "Brand Designer", rating: 5 },
  { text: "The roadmap and transparency about upcoming features gives me confidence in the platform.", name: "Samuel Adams", title: "Power User", rating: 5 },
];

const accountSettings = [
  { label: "Full Name", value: "Alex Rivera", icon: "badge" },
  { label: "Email Address", value: "alex@viralstudio.io", icon: "mail" },
  { label: "Phone Number", value: "+1 (555) 123-4567", icon: "call" },
  { label: "Company", value: "ViralStudio AI", icon: "business" },
  { label: "Timezone", value: "EST (UTC-5)", icon: "schedule" },
  { label: "Language", value: "English", icon: "language" },
];

export default function ProfilePage() {
  const t = useTranslate();
  const router = useRouter();

  return (
    <div className="h-screen overflow-hidden no-x-scroll">
      <SidebarProvider>
      <Sidebar />
      <TopBar />
      <main className="fixed top-14 md:top-16 ltr:right-0 rtl:left-0 w-full md:w-[calc(100%-16rem)] bottom-0 overflow-y-auto smooth-scroll">
        <div className="px-3 md:px-5 lg:px-6 py-4 md:py-5 lg:py-6 space-y-5">

          {/* Profile Header */}
          <section className="hero-glow relative rounded-2xl overflow-hidden border border-primary/20" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.12) 0%, rgba(6,182,212,0.05) 50%, transparent 100%)' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent z-10"></div>
            <div className="relative z-20 p-6 lg:p-8 flex items-center gap-6">
              <div className="w-20 h-20 rounded-full p-[2px] shadow-xl shadow-primary/30 shrink-0" style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}>
                <div className="w-full h-full rounded-full bg-surface flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Geist, sans-serif' }}>Alex Rivera</h1>
                <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">workspace_premium</span> Pro Plan
                  </span>
                  <span className="w-1 h-1 rounded-full bg-on-surface-variant/30"></span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">calendar_month</span> Member since Jan 2025
                  </span>
                  <span className="w-1 h-1 rounded-full bg-on-surface-variant/30"></span>
                  <span className="flex items-center gap-1 text-yellow-400">
                    <span className="material-symbols-outlined text-xs">bolt</span> 12,400 Credits
                  </span>
                </div>
              </div>
              <button className="primary-gradient text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-primary/25 transition-all duration-200 hover:translate-y-[-1px] active:scale-[0.97]">
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>edit</span> Edit Profile
                </span>
              </button>
            </div>
          </section>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="glass-card rounded-2xl p-4 border border-white/5 flex flex-col items-center text-center card-glow" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
                <span className={`material-symbols-outlined text-2xl ${stat.color} mb-2`} style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
                <p className="text-xl font-bold text-white" style={{ fontFamily: 'Geist, sans-serif' }}>{stat.value}</p>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-0.5">{t(stat.label)}</p>
              </div>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left: Activity */}
            <div className="lg:col-span-2 space-y-6">

              {/* Recent Activity */}
              <div className="glass-card rounded-2xl p-5 border border-white/5 card-glow" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'Geist, sans-serif' }}>
                  <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>history</span> Recent Activity
                </h2>
                <div className="space-y-0">
                  {recentActivity.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 py-3 border-b border-white/5 last:border-b-0">
                      <div className={`w-9 h-9 rounded-xl bg-surface-container-low flex items-center justify-center ${item.color} shrink-0`}>
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{item.action}</p>
                        <p className="text-xs text-on-surface-variant truncate">{item.detail}</p>
                      </div>
                      <span className="text-[10px] text-on-surface-variant/60 shrink-0">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feedback / Reviews */}
              <div className="glass-card rounded-2xl p-5 border border-white/5 card-glow" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2" style={{ fontFamily: 'Geist, sans-serif' }}>
                    <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>reviews</span> Feedback & Reviews
                    <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[9px] font-bold">{feedbackData.length}</span>
                  </h2>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(i => (
                      <span key={i} className="material-symbols-outlined text-yellow-400 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    ))}
                    <span className="text-xs text-on-surface-variant ml-1">4.8 avg</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                  {feedbackData.map((fb, i) => (
                    <div key={i} className="glass-card rounded-xl p-4 border border-white/5 hover:border-primary/20 transition-all duration-200">
                      <div className="flex items-center gap-1 mb-2">
                        {Array.from({ length: 5 }, (_, j) => (
                          <span key={j} className={`material-symbols-outlined text-[10px] ${j < fb.rating ? 'text-yellow-400' : 'text-surface-border'}`} style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        ))}
                      </div>
                      <p className="text-xs text-on-surface-variant/80 leading-relaxed mb-2">&ldquo;{fb.text}&rdquo;</p>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-[8px] text-primary font-bold">{fb.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-white">{fb.name}</p>
                          <p className="text-[9px] text-on-surface-variant">{fb.title}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Account Settings */}
            <div className="space-y-6">
              <div className="glass-card rounded-2xl p-5 border border-white/5 card-glow" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)' }}>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'Geist, sans-serif' }}>
                  <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>settings</span> Account Settings
                </h2>
                <div className="space-y-3">
                  {accountSettings.map((setting, i) => (
                    <div key={i} className="flex items-start gap-3 pb-3 border-b border-white/5 last:border-b-0 last:pb-0">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant shrink-0">
                        <span className="material-symbols-outlined text-sm">{setting.icon}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">{setting.label}</p>
                        <p className="text-sm font-medium text-white truncate">{setting.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 btn-subtle text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm">edit</span> Edit Settings
                </button>
              </div>

              <div className="glass-card rounded-2xl p-5 border border-white/5 card-glow" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.05), rgba(6,182,212,0.02))' }}>
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2" style={{ fontFamily: 'Geist, sans-serif' }}>
                  <span className="material-symbols-outlined text-yellow-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span> Current Plan
                </h2>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl primary-gradient flex items-center justify-center shadow-lg shadow-primary/30">
                    <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white" style={{ fontFamily: 'Geist, sans-serif' }}>Professional</p>
                    <p className="text-xs text-on-surface-variant">$35/month — billed annually</p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  {["600 min of video/month", "12,000 AI credits/year", "20 GB storage", "Voice cloning", "Priority support"].map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[10px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                      <span className="text-xs text-on-surface-variant">{f}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => router.push("/pricing")} className="w-full primary-gradient text-white py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-primary/25 transition-all duration-200 hover:translate-y-[-1px] active:scale-[0.97] flex items-center justify-center gap-2">
                  Upgrade Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      </SidebarProvider>
    </div>
  );
}

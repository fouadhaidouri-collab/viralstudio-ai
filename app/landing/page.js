"use client";
import { useState } from "react";

const faqs = [
  { q: "What is ViralStudio AI?", a: "ViralStudio AI is a comprehensive AI-powered content creation suite that helps you generate videos, images, scripts, and more in minutes." },
  { q: "How does the AI video generation work?", a: "Simply describe what you want to create, select your preferred style and settings, and our AI generates a high-quality video in seconds." },
  { q: "Can I cancel my subscription anytime?", a: "Yes, you can cancel your subscription at any time with no hidden fees. Your access remains active until the end of your billing period." },
  { q: "What payment methods do you accept?", a: "We accept credit cards via YouCan Pay, PayPal, and cryptocurrency payments including USDT, Bitcoin, and Ethereum." },
  { q: "Is my content and data secure?", a: "Absolutely. All data is encrypted in transit and at rest. We never share your content with third parties. SSL secure and PCI compliant." },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#030303] text-[#e4e4e7] overflow-x-hidden" style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif", lineHeight: 1.6 }}>

          {/* Nav */}
          <nav className="fixed top-0 left-0 right-0 z-50 py-3" style={{ background: "rgba(3,3,3,0.8)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="max-w-[1200px] mx-auto px-5 flex items-center justify-between gap-4">
              <a href="#" className="flex items-center gap-2 text-base font-bold text-white shrink-0" translate="no">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0" style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)" }}>B</span>
                ViralStudio AI
              </a>
              <div className={`items-center gap-6 ${mobileOpen ? "flex flex-col absolute top-full left-0 right-0 p-5 pb-6" : "hidden"} md:flex`} style={mobileOpen ? { background: "rgba(3,3,3,0.98)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" } : {}}>
                <a href="#features" className="text-sm text-[#a1a1aa] hover:text-white transition-colors whitespace-nowrap" onClick={() => setMobileOpen(false)}>Features</a>
                <a href="#pricing" className="text-sm text-[#a1a1aa] hover:text-white transition-colors whitespace-nowrap" onClick={() => setMobileOpen(false)}>Pricing</a>
                <a href="#testimonials" className="text-sm text-[#a1a1aa] hover:text-white transition-colors whitespace-nowrap" onClick={() => setMobileOpen(false)}>Testimonials</a>
                <a href="#faq" className="text-sm text-[#a1a1aa] hover:text-white transition-colors whitespace-nowrap" onClick={() => setMobileOpen(false)}>FAQ</a>
                <div className="flex items-center gap-2 md:hidden mt-2">
                  <a href="#" className="btn-subtle text-white text-sm font-semibold px-4 py-2 rounded-xl border border-white/10">Sign In</a>
                  <a href="#" className="primary-gradient text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg shadow-primary/25">Get Started</a>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-3">
                <a href="#" className="btn-subtle text-white text-sm font-semibold px-4 py-2 rounded-xl border border-white/10 hover:border-primary/30 transition-all">Sign In</a>
                <a href="#" className="primary-gradient text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg shadow-primary/25 hover:translate-y-[-1px] transition-all">Get Started</a>
              </div>
              <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-white text-2xl p-1" aria-label="Menu">&#9776;</button>
            </div>
          </nav>

          {/* Hero */}
          <section className="min-h-[90vh] flex items-center justify-center px-5 pt-24 pb-16 relative overflow-hidden text-center" id="hero">
            <div className="absolute -top-[40%] -right-[20%] w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle,rgba(168,85,247,0.08),transparent 70%)" }} />
            <div className="absolute -bottom-[30%] -left-[20%] w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle,rgba(6,182,212,0.06),transparent 70%)" }} />
            <div className="max-w-[720px] relative z-10">
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold mb-5" style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.15)", color: "#a855f7" }}>
                <span>&#9889;</span> AI-Powered Content Engine
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight text-white mb-4">
                Create Viral Content<br />
                <span style={{ background: "linear-gradient(135deg,#a855f7,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>With AI</span>
              </h1>
              <p className="text-sm md:text-base text-[#a1a1aa] leading-relaxed max-w-[560px] mx-auto mb-8">
                Transform your ideas into studio-quality short-form videos, high-fidelity images, and viral scripts in seconds.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <a href="#" className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:translate-y-[-1px]" style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)", boxShadow: "0 4px 20px rgba(168,85,247,0.25)" }}>
                  &#9654; Start Creating Free
                </a>
                <a href="#" className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold transition-all hover:translate-y-[-1px] border border-white/10 text-[#a1a1aa] hover:text-white hover:border-primary/30">
                  &#9654; Watch Demo
                </a>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="py-16 md:py-20 px-5" id="features">
            <div className="max-w-[1200px] mx-auto">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.12)", color: "#a855f7" }}>&#9889; Features</div>
                <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 tracking-tight">Everything You Need to Go Viral</h2>
                <p className="text-sm text-[#a1a1aa] max-w-[520px] mx-auto">A complete AI-powered suite designed for modern content creators who demand speed and quality.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  { icon: "🎬", color: "rgba(168,85,247,0.12)", text: "#a855f7", title: "AI Video Studio", desc: "Generate high-quality cinematic clips from text prompts, with professional transitions and effects." },
                  { icon: "📷", color: "rgba(6,182,212,0.12)", text: "#06b6d4", title: "Image Lab", desc: "Ultra-realistic 8K image generation for thumbnails, covers, and conceptual art in any style." },
                  { icon: "🧠", color: "rgba(250,204,21,0.12)", text: "#facc15", title: "Chat AI Assistant", desc: "Intelligent assistant that helps you brainstorm, script, and refine your content strategy." },

                ].map((f) => (
                  <div key={f.title} className="rounded-2xl p-6 md:p-7 transition-all hover:translate-y-[-3px]" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4" style={{ background: f.color, color: f.text }}>{f.icon}</div>
                    <h3 className="text-base font-bold text-white mb-1.5">{f.title}</h3>
                    <p className="text-sm text-[#a1a1aa] leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="py-16 md:py-20 px-5" id="pricing">
            <div className="max-w-[1200px] mx-auto">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.12)", color: "#a855f7" }}>&#128176; Pricing</div>
                <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 tracking-tight">Simple, Transparent Pricing</h2>
                <p className="text-sm text-[#a1a1aa] max-w-[520px] mx-auto">Choose the plan that fits your content creation needs. Upgrade anytime.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { name: "Starter", sub: "For creators starting out", price: "$25", popular: false, features: ["200 min of video", "5 GB storage", "1 brand kit", "1,200 AI credits/yr", "No watermark", "Basic AI tools"] },
                  { name: "Professional", sub: "For serious creators", price: "$35", popular: true, features: ["600 min of video", "20 GB storage", "5 brand kits", "12,000 AI credits/yr", "Voice cloning", "Advanced AI tools"] },
                  { name: "Team", sub: "For collaborative teams", price: "$119", popular: false, features: ["1,800 min of video", "100 GB storage", "10 brand kits", "28,800 AI credits/yr", "Collaborative workspace", "Team onboarding"] },
                  { name: "Enterprise", sub: "For large organizations", price: "Custom", popular: false, features: ["Custom video minutes", "Custom storage", "Unlimited brand kits", "Custom AI credits", "SSO & manager", "Custom integrations"] },
                ].map((plan) => (
                  <div key={plan.name} className={`rounded-2xl p-6 flex flex-col relative transition-all hover:translate-y-[-3px] ${plan.popular ? "shadow-xl" : ""}`} style={{
                    border: plan.popular ? "1px solid rgba(168,85,247,0.3)" : "1px solid rgba(255,255,255,0.06)",
                    background: plan.popular ? "linear-gradient(145deg,rgba(168,85,247,0.05),transparent)" : "rgba(255,255,255,0.015)",
                    boxShadow: plan.popular ? "0 8px 40px rgba(168,85,247,0.06)" : "none"
                  }}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[9px] font-extrabold text-black uppercase tracking-wider whitespace-nowrap" style={{ background: "linear-gradient(135deg,#facc15,#eab308)", boxShadow: "0 0 20px rgba(250,204,21,0.4)" }}>
                        &#9733; Most Popular
                      </div>
                    )}
                    <h3 className="text-lg font-bold text-white mb-0.5">{plan.name}</h3>
                    <p className="text-xs text-[#52525b] mb-4">{plan.sub}</p>
                    <div className="text-3xl md:text-4xl font-extrabold text-white mb-1">{plan.price}<span className="text-sm font-medium text-[#52525b]">{plan.price !== "Custom" ? "/mo" : ""}</span></div>
                    <div className="text-xs text-[#52525b] mb-5">{plan.price !== "Custom" ? "Billed monthly" : "Tailored to your needs"}</div>
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-[#a1a1aa]">
                          <span style={{ color: "#a855f7" }}>&#10003;</span> {f}
                        </li>
                      ))}
                    </ul>
                    <a href="#" className={`w-full inline-flex items-center justify-center py-2.5 rounded-xl text-sm font-semibold text-center transition-all ${plan.popular
                      ? "text-white shadow-lg shadow-primary/25"
                      : "text-white border border-white/10 hover:border-primary/30"
                    }`} style={plan.popular ? { background: "linear-gradient(135deg,#a855f7,#7c3aed)" } : {}}>
                      {plan.price === "Custom" ? "Contact Sales" : plan.name === "Starter" ? "Start Free Trial" : "Buy Now"}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section className="py-16 md:py-20 px-5" id="testimonials">
            <div className="max-w-[1200px] mx-auto">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.12)", color: "#a855f7" }}>&#128172; Testimonials</div>
                <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 tracking-tight">Loved by Creators Worldwide</h2>
                <p className="text-sm text-[#a1a1aa] max-w-[520px] mx-auto">See what our users say about transforming their content workflow with AI.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  { avatar: "SK", name: "Sarah K.", role: "Content Creator", text: "ViralStudio has completely changed how I create content. I went from spending hours on one video to producing 10 in a day." },
                  { avatar: "MJ", name: "Marcus J.", role: "Digital Marketer", text: "The AI video quality is unreal. My clients can't tell the difference between this and footage shot by a professional crew." },
                  { avatar: "AL", name: "Aisha L.", role: "Social Media Manager", text: "The hook generator alone is worth the subscription. My engagement rates have tripled since I started using it." },
                ].map((t) => (
                  <div key={t.name} className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="text-[#facc15] text-sm mb-3">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                    <blockquote className="text-sm text-[#a1a1aa] leading-relaxed mb-4 italic">"{t.text}"</blockquote>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)" }}>{t.avatar}</div>
                      <div><strong className="text-sm font-semibold text-white">{t.name}</strong><br /><span className="text-[11px] text-[#52525b]">{t.role}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="py-16 md:py-20 px-5" id="faq">
            <div className="max-w-[640px] mx-auto">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.12)", color: "#a855f7" }}>&#10067; FAQ</div>
                <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 tracking-tight">Frequently Asked Questions</h2>
                <p className="text-sm text-[#a1a1aa]">Everything you need to know before getting started.</p>
              </div>
              <div className="space-y-3">
                {faqs.map((faq, i) => {
                  const open = openFaq === i;
                  return (
                    <div key={i} className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <button onClick={() => setOpenFaq(open ? null : i)} className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left text-sm font-semibold text-white">
                        {faq.q}
                        <span className={`text-xs text-[#52525b] shrink-0 transition-transform ${open ? "rotate-180" : ""}`}>&#9660;</span>
                      </button>
                      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-40" : "max-h-0"}`}>
                        <p className="px-5 pb-4 text-sm text-[#a1a1aa] leading-relaxed">{faq.a}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="px-5 pb-16 md:pb-20">
            <div className="max-w-[1200px] mx-auto">
              <div className="rounded-2xl p-10 md:p-12 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}>
                <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 tracking-tight">Ready to Transform Your Content?</h2>
                <p className="text-sm text-[#a1a1aa] max-w-[480px] mx-auto mb-7">Join thousands of creators already using ViralStudio AI to produce stunning content at scale.</p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <a href="#" className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:translate-y-[-1px]" style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)", boxShadow: "0 4px 20px rgba(168,85,247,0.25)" }}>
                    &#9654; Start Free Trial
                  </a>
                  <a href="#" className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold transition-all hover:translate-y-[-1px] border border-white/10 text-[#a1a1aa] hover:text-white hover:border-primary/30">
                    &#9654; Book a Demo
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t px-5 py-8" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-sm font-bold text-white" translate="no">
                <span className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] shrink-0" style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)" }}>B</span>
                ViralStudio AI
              </div>
              <p className="text-xs text-[#52525b]">&copy; 2026 All Rights Reserved.</p>
              <nav className="flex gap-4 flex-wrap">
                <a href="#" className="text-xs text-[#52525b] hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="text-xs text-[#52525b] hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="text-xs text-[#52525b] hover:text-white transition-colors">Support</a>
              </nav>
            </div>
          </footer>

        </div>
    );
  }

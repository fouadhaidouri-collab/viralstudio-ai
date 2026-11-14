"use client";
import BrandLogo from "./BrandLogo";

export default function LegalPage({ title, updated, intro, sections }) {
  return (
    <main className="min-h-screen bg-[#030303] text-[#e4e4e7] px-5 py-12 md:py-16" style={{ fontFamily: "Inter,ui-sans-serif,system-ui,sans-serif" }}>
      <div className="max-w-[900px] mx-auto">
        <header className="flex items-center justify-between gap-4 mb-12">
          <a href="/landing" aria-label="ViralStudio AI home"><BrandLogo subtitle="Premium Suite" size="sm" /></a>
          <a href="/pricing" className="text-sm text-[#c4b5fd] hover:text-white transition-colors">View pricing →</a>
        </header>
        <article className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 md:p-10">
          <p className="text-xs font-semibold tracking-[0.18em] uppercase text-violet-400 mb-3">ViralStudio AI · Legal</p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">{title}</h1>
          <p className="text-xs text-[#71717a] mb-8">Last updated: {updated}</p>
          <p className="text-sm md:text-base text-[#c4c4cc] leading-7 mb-9">{intro}</p>
          <div className="space-y-8">
            {sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-lg font-bold text-white mb-3">{section.heading}</h2>
                {section.paragraphs?.map((p, i) => <p key={i} className="text-sm text-[#a1a1aa] leading-7 mb-3">{p}</p>)}
                {section.items && <ul className="list-disc pl-5 space-y-2 text-sm text-[#a1a1aa] leading-7">{section.items.map((item, i) => <li key={i}>{item}</li>)}</ul>}
              </section>
            ))}
          </div>
          <div className="mt-10 pt-6 border-t border-white/[0.08] text-sm text-[#a1a1aa]">
            Questions? Contact <a className="text-violet-300 hover:text-white" href="mailto:contact@viralstudio-ai.com">contact@viralstudio-ai.com</a>.
          </div>
        </article>
        <footer className="py-8 flex flex-wrap items-center justify-between gap-4 text-xs text-[#71717a]">
          <span>© 2026 ViralStudio AI. All rights reserved.</span>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            <a href="/pricing" className="hover:text-white">Pricing</a>
            <a href="/terms" className="hover:text-white">Terms</a>
            <a href="/privacy" className="hover:text-white">Privacy</a>
            <a href="/refund-policy" className="hover:text-white">Refund Policy</a>
          </nav>
        </footer>
      </div>
    </main>
  );
}

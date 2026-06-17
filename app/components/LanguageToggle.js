"use client";

import { useLanguage } from "./LanguageProvider";

export default function LanguageToggle() {
  const { locale, setLocale } = useLanguage();
  return (
    <button
      onClick={() => setLocale(locale === "en" ? "ar" : "en")}
      className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-low border border-surface-border/60 text-[10px] font-bold text-on-surface-variant hover:border-primary/40 hover:text-primary transition-all duration-200 active:scale-90"
    >
      {locale === "en" ? "AR" : "EN"}
    </button>
  );
}
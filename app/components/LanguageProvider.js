"use client";

import { createContext, useContext, useState, useEffect } from "react";
import translations from "../translations";

const LanguageContext = createContext();

export function useTranslate() {
  const ctx = useContext(LanguageContext);
  return ctx ? ctx.t : (key) => key;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export default function LanguageProvider({ children }) {
  const [locale, setLocale] = useState("en");

  useEffect(() => {
    const saved = localStorage.getItem("locale");
    if (saved === "ar" || saved === "en") {
      setLocale(saved);
      document.documentElement.dir = saved === "ar" ? "rtl" : "ltr";
    } else {
      document.documentElement.dir = "ltr";
    }
  }, []);

  const switchLocale = (l) => {
    setLocale(l);
    localStorage.setItem("locale", l);
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
  };

  const t = (key) => {
    const map = translations[locale];
    return map && map[key] !== undefined ? map[key] : key;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale: switchLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
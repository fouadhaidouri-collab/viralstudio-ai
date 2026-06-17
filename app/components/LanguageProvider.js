"use client";

import { createContext, useContext } from "react";

const LanguageContext = createContext();

export function useTranslate() {
  const ctx = useContext(LanguageContext);
  return ctx ? ctx.t : (key) => key;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export default function LanguageProvider({ children }) {
  const t = (key) => key;
  return (
    <LanguageContext.Provider value={{ locale: "en", setLocale: () => {}, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
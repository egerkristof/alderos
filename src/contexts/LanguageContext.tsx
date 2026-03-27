import { createContext, useContext, useState, ReactNode } from "react";
import { Language, t, TranslationKey } from "@/i18n/translations";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Language>(() => {
    const stored = localStorage.getItem("alderos-lang");
    if (stored && ["en", "de", "es", "fr", "hu"].includes(stored)) return stored as Language;
    const browserLang = navigator.language.slice(0, 2);
    if (["en", "de", "es", "fr", "hu"].includes(browserLang)) return browserLang as Language;
    return "en";
  });

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("alderos-lang", newLang);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t: (key) => t(lang, key) }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

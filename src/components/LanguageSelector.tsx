import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LANGUAGES, Language } from "@/i18n/translations";
import { useLanguage } from "@/contexts/LanguageContext";

const LanguageSelector = () => {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.code === lang)!;

  return (
    <div className="fixed top-5 right-5 z-50">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-full border border-border bg-card/80 backdrop-blur-sm
                   hover:border-accent/30 transition-all text-sm font-body shadow-sm"
      >
        <span className="text-lg leading-none">{current.flag}</span>
        <span className="text-xs text-muted-foreground hidden sm:inline">{current.label}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden"
          >
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm font-body transition-colors
                  ${l.code === lang ? "bg-accent/10 text-accent" : "text-foreground hover:bg-secondary"}`}
              >
                <span className="text-lg leading-none">{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {open && <div className="fixed inset-0 z-[-1]" onClick={() => setOpen(false)} />}
    </div>
  );
};

export default LanguageSelector;

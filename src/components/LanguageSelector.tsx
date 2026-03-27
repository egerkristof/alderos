import { motion } from "framer-motion";
import { LANGUAGES } from "@/i18n/translations";
import { useLanguage } from "@/contexts/LanguageContext";

const LanguageSelector = () => {
  const { lang, setLang } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.6 }}
      className="flex items-center justify-center gap-3 pt-8 pb-2"
    >
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body transition-all duration-200
            ${l.code === lang
              ? "bg-accent/10 text-accent border border-accent/30"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent"
            }`}
        >
          <span className="text-base leading-none">{l.flag}</span>
          <span className="hidden sm:inline">{l.label}</span>
        </button>
      ))}
    </motion.div>
  );
};

export default LanguageSelector;

import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowDown } from "lucide-react";
import LiveCounter from "@/components/LiveCounter";

const HeroSection = ({ onBegin }: { onBegin: () => void }) => {
  const { t } = useLanguage();

  return (
    <section className="min-h-[85vh] lg:min-h-[75vh] flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      {/* Subtle background shapes */}
      <motion.div
        className="absolute top-20 right-20 w-72 h-72 rounded-full opacity-[0.04]"
        style={{ background: "hsl(var(--terracotta))" }}
        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-32 left-16 w-56 h-56 rounded-full opacity-[0.03]"
        style={{ background: "hsl(var(--olive-deep))" }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="max-w-3xl relative z-10"
      >
        {/* Pain-point headline */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-4xl md:text-5xl lg:text-[3.5rem] xl:text-6xl font-heading font-semibold tracking-tight text-foreground mb-6 leading-[1.15]"
        >
          {t("hero_title_pain")}
        </motion.h1>

        {/* Promise line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="text-xl md:text-2xl font-heading italic text-muted-foreground mb-4 leading-relaxed"
        >
          {t("hero_promise")}
        </motion.p>

        {/* Supporting copy */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="text-base text-muted-foreground/80 mb-10 max-w-xl mx-auto leading-relaxed font-body"
        >
          {t("hero_body_new")}
        </motion.p>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={onBegin}
          className="px-10 py-4 bg-primary text-primary-foreground rounded-full font-body text-sm tracking-wide
                     hover:opacity-90 transition-opacity shadow-lg shadow-primary/10"
        >
          {t("hero_cta_new")}
        </motion.button>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-12"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-xs font-body text-muted-foreground/70 tracking-widest uppercase">
            {t("hero_scroll")}
          </span>
          <ArrowDown className="w-4 h-4 text-muted-foreground/60" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;

import { motion } from "framer-motion";
import { Sparkles, PenLine, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ModeChooserProps {
  onChoose: (mode: "ai" | "training") => void;
}

const ModeChooser = ({ onChoose }: ModeChooserProps) => {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-2xl mx-auto"
    >
      <h3 className="text-xl md:text-2xl font-heading font-semibold text-foreground text-center mb-10">
        {t("mode_title")}
      </h3>

      <div className="flex flex-col gap-5">
        {/* Primary: Show me the reframing */}
        <motion.button
          onClick={() => onChoose("ai")}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="relative text-left p-6 md:p-8 rounded-2xl border-2 border-accent/30 bg-accent/[0.04]
                     hover:border-accent/60 hover:bg-accent/[0.08] hover:shadow-lg hover:shadow-accent/10
                     transition-all duration-300 group cursor-pointer"
        >
          <div className="flex items-start gap-4 md:gap-5">
            <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center text-accent flex-shrink-0
                            group-hover:bg-accent/25 transition-colors">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[0.65rem] tracking-[0.2em] uppercase text-accent font-body font-medium">
                  {t("mode_recommended") || "Recommended"}
                </span>
              </div>
              <p className="font-heading font-semibold text-foreground text-lg mb-1">{t("mode_ai")}</p>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">{t("mode_ai_desc")}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-accent/50 group-hover:text-accent flex-shrink-0 mt-3 transition-colors" />
          </div>
        </motion.button>

        {/* Subtle divider */}
        <div className="flex items-center gap-3 px-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground/50 font-body tracking-wider uppercase">
            {t("mode_or") || "or"}
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Secondary: Let me try first */}
        <motion.button
          onClick={() => onChoose("training")}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="text-left p-5 md:p-6 rounded-xl border border-border bg-card/50
                     hover:border-accent/30 hover:bg-card hover:shadow-md
                     transition-all duration-300 group cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0
                            group-hover:bg-primary/15 transition-colors">
              <PenLine className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-medium text-foreground/80 mb-0.5">{t("mode_training")}</p>
              <p className="text-xs text-muted-foreground/70 font-body">{t("mode_training_desc")}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 flex-shrink-0 transition-colors" />
          </div>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ModeChooser;

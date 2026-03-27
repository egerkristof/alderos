import { motion } from "framer-motion";
import { Sparkles, PenLine } from "lucide-react";
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
      <h3 className="text-xl md:text-2xl font-heading font-semibold text-foreground text-center mb-8">
        {t("mode_title")}
      </h3>

      <div className="grid sm:grid-cols-2 gap-4">
        <button
          onClick={() => onChoose("ai")}
          className="phase-card text-left hover:border-accent/40 transition-all group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-4
                          group-hover:bg-accent/20 transition-colors">
            <Sparkles className="w-5 h-5" />
          </div>
          <p className="font-heading font-semibold text-foreground mb-1">{t("mode_ai")}</p>
          <p className="text-sm text-muted-foreground font-body">{t("mode_ai_desc")}</p>
        </button>

        <button
          onClick={() => onChoose("training")}
          className="phase-card text-left hover:border-accent/40 transition-all group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4
                          group-hover:bg-primary/20 transition-colors">
            <PenLine className="w-5 h-5" />
          </div>
          <p className="font-heading font-semibold text-foreground mb-1">{t("mode_training")}</p>
          <p className="text-sm text-muted-foreground font-body">{t("mode_training_desc")}</p>
        </button>
      </div>
    </motion.div>
  );
};

export default ModeChooser;

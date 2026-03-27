import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { PenLine, Sparkles, ArrowRight, Eye } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface TrainingModeProps {
  challenge: string;
  aiPhases: { empathy: string; shared_value: string; message: string } | null;
  isAiLoading: boolean;
}

const TrainingMode = ({ challenge, aiPhases, isAiLoading }: TrainingModeProps) => {
  const { t } = useLanguage();
  const [userAnswers, setUserAnswers] = useState({ empathy: "", shared_value: "", message: "" });
  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [revealedSteps, setRevealedSteps] = useState<Set<string>>(new Set());

  const STEPS = [
    { key: "empathy" as const, labelKey: "train_step1_label" as const, placeholderKey: "train_step1_placeholder" as const },
    { key: "shared_value" as const, labelKey: "train_step2_label" as const, placeholderKey: "train_step2_placeholder" as const },
    { key: "message" as const, labelKey: "train_step3_label" as const, placeholderKey: "train_step3_placeholder" as const },
  ];

  const handleNext = () => {
    if (currentStep < 2) setCurrentStep(currentStep + 1);
    else setSubmitted(true);
  };

  const toggleReveal = (key: string) => {
    setRevealedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const step = STEPS[currentStep];

  if (!submitted) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <PenLine className="w-5 h-5 text-accent" />
          <p className="text-sm tracking-[0.2em] uppercase text-accent font-body">{t("training_label")}</p>
        </div>

        <div className="flex gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= currentStep ? "bg-accent" : "bg-border"}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }}>
            <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-body mb-2">
              {t("training_step")} {currentStep + 1} {t("training_of")} 3
            </p>
            <h3 className="text-xl font-heading font-semibold text-foreground mb-4">{t(step.labelKey)}</h3>
            <textarea
              value={userAnswers[step.key]}
              onChange={(e) => setUserAnswers((prev) => ({ ...prev, [step.key]: e.target.value }))}
              placeholder={t(step.placeholderKey)}
              className="w-full h-32 px-5 py-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground/50 resize-none font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all"
            />
            <div className="flex justify-end mt-4">
              <button onClick={handleNext} disabled={!userAnswers[step.key].trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity">
                {currentStep < 2 ? t("training_next") : t("training_reveal")}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-8">
        <Sparkles className="w-5 h-5 text-accent" />
        <p className="text-sm tracking-[0.2em] uppercase text-accent font-body">{t("training_compare")}</p>
      </div>

      <div className="space-y-6">
        {STEPS.map((s) => (
          <div key={s.key} className="phase-card">
            <p className="text-xs tracking-[0.15em] uppercase text-accent font-body mb-4">{t(s.labelKey)}</p>
            <div className="mb-4">
              <p className="text-xs font-body text-muted-foreground mb-1 flex items-center gap-1.5">
                <PenLine className="w-3 h-3" /> {t("training_your")}
              </p>
              <p className="text-sm text-foreground/85 font-body leading-relaxed">
                {userAnswers[s.key] || <span className="italic text-muted-foreground">{t("training_skipped")}</span>}
              </p>
            </div>
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-body text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> {t("training_ai")}
                </p>
                <button onClick={() => toggleReveal(s.key)} className="text-xs font-body text-accent flex items-center gap-1 hover:opacity-80 transition-opacity">
                  <Eye className="w-3 h-3" /> {revealedSteps.has(s.key) ? t("training_hide") : t("training_show")}
                </button>
              </div>
              <AnimatePresence>
                {revealedSteps.has(s.key) && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="text-sm text-foreground/85 font-body leading-relaxed overflow-hidden">
                    {isAiLoading ? t("loading") : aiPhases?.[s.key] || t("error_generic")}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default TrainingMode;

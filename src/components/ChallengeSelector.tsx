import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ChallengeSelectorProps {
  onSelect: (challenge: string, id?: string) => void;
}

const ChallengeSelector = ({ onSelect }: ChallengeSelectorProps) => {
  const { t } = useLanguage();
  const [customInput, setCustomInput] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const challenges = [
    { id: "wealth", labelKey: "challenge_wealth" as const, descKey: "challenge_wealth_desc" as const },
    { id: "recruitment", labelKey: "challenge_recruitment" as const, descKey: "challenge_recruitment_desc" as const },
    { id: "leaving", labelKey: "challenge_leaving" as const, descKey: "challenge_leaving_desc" as const },
    { id: "secrecy", labelKey: "challenge_secrecy" as const, descKey: "challenge_secrecy_desc" as const },
    { id: "autonomy", labelKey: "challenge_autonomy" as const, descKey: "challenge_autonomy_desc" as const },
  ];

  const handleChipClick = (challenge: typeof challenges[0]) => {
    setSelectedId(challenge.id);
    setCustomInput("");
    onSelect(t(challenge.descKey));
  };

  const handleCustomSubmit = () => {
    if (customInput.trim()) {
      setSelectedId(null);
      onSelect(customInput.trim());
    }
  };

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-3xl w-full text-center"
      >
        <p className="text-sm tracking-[0.25em] uppercase text-accent mb-4 font-body">
          {t("select_label")}
        </p>
        <h2 className="text-3xl md:text-4xl font-heading font-semibold text-foreground mb-3">
          {t("select_title")}
        </h2>
        <p className="text-muted-foreground font-body mb-12 max-w-lg mx-auto">
          {t("select_body")}
        </p>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {challenges.map((challenge, i) => (
            <motion.button
              key={challenge.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
              onClick={() => handleChipClick(challenge)}
              className={`challenge-chip text-sm font-body ${selectedId === challenge.id ? "active" : ""}`}
            >
              {t(challenge.labelKey)}
            </motion.button>
          ))}
        </div>

        {selectedId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-10 px-6 py-4 rounded-xl bg-card border border-border text-left max-w-xl mx-auto"
          >
            <p className="text-sm text-muted-foreground mb-1 font-body">{t("select_preview")}</p>
            <p className="text-foreground font-body italic">
              "{t(challenges.find(c => c.id === selectedId)!.descKey)}"
            </p>
          </motion.div>
        )}

        <div className="flex items-center gap-4 mb-10 max-w-md mx-auto">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground tracking-widest uppercase font-body">{t("select_or")}</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="max-w-xl mx-auto relative">
          <textarea
            value={customInput}
            onChange={(e) => {
              setCustomInput(e.target.value);
              setSelectedId(null);
            }}
            placeholder={t("select_placeholder")}
            className="w-full h-28 px-5 py-4 rounded-xl border border-border bg-card text-foreground
                       placeholder:text-muted-foreground/50 resize-none font-body text-sm
                       focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all"
          />
          {customInput.trim() && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleCustomSubmit}
              className="absolute bottom-4 right-4 p-2.5 bg-accent text-accent-foreground rounded-full
                         hover:opacity-90 transition-opacity shadow-md"
            >
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </motion.div>
    </section>
  );
};

export default ChallengeSelector;

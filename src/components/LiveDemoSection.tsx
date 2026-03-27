import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface LiveDemoSectionProps {
  onTryChallenge: (challenge: string, id?: string) => void;
}

const LiveDemoSection = ({ onTryChallenge }: LiveDemoSectionProps) => {
  const { t } = useLanguage();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const challenges = [
    { id: "wealth", labelKey: "challenge_wealth" as const, descKey: "challenge_wealth_desc" as const },
    { id: "recruitment", labelKey: "challenge_recruitment" as const, descKey: "challenge_recruitment_desc" as const },
    { id: "secrecy", labelKey: "challenge_secrecy" as const, descKey: "challenge_secrecy_desc" as const },
  ];

  return (
    <section className="py-24 px-6 relative">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-sm tracking-[0.25em] uppercase text-accent mb-4 font-body">
            {t("demo_label")}
          </p>
          <h2 className="text-3xl md:text-4xl font-heading font-semibold text-foreground mb-4">
            {t("demo_title")}
          </h2>
          <p className="text-muted-foreground font-body max-w-lg mx-auto">
            {t("demo_body")}
          </p>
        </motion.div>

        <div className="grid gap-4 max-w-2xl mx-auto">
          {challenges.map((challenge, i) => (
            <motion.button
              key={challenge.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              onMouseEnter={() => setHoveredId(challenge.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onTryChallenge(t(challenge.descKey), challenge.id)}
              className="group flex items-center justify-between p-6 rounded-xl border border-border
                         bg-card hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5
                         transition-all duration-300 text-left"
            >
              <div className="flex-1">
                <p className="text-xs tracking-[0.2em] uppercase text-accent font-body mb-1">
                  {t("demo_challenge_prefix")}
                </p>
                <p className="text-foreground font-heading text-lg font-medium italic leading-snug">
                  "{t(challenge.descKey)}"
                </p>
              </div>
              <motion.div
                animate={{ x: hoveredId === challenge.id ? 4 : 0, opacity: hoveredId === challenge.id ? 1 : 0.4 }}
                className="ml-4 p-2 rounded-full bg-accent/10 text-accent flex-shrink-0"
              >
                <ArrowRight className="w-4 h-4" />
              </motion.div>
            </motion.button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-center mt-10"
        >
          <button
            onClick={() => onTryChallenge("")}
            className="inline-flex items-center gap-2 text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {t("demo_custom")}
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default LiveDemoSection;

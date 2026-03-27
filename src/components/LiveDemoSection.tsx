import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { ArrowRight, Sparkles, RefreshCw, BookOpen } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface LiveDemoSectionProps {
  onTryChallenge: (challenge: string, id?: string) => void;
}

interface DynamicQuestion {
  text: string;
  topic: string;
}

const STATIC_CHALLENGES = [
  { id: "wealth", labelKey: "challenge_wealth" as const, descKey: "challenge_wealth_desc" as const },
  { id: "recruitment", labelKey: "challenge_recruitment" as const, descKey: "challenge_recruitment_desc" as const },
  { id: "secrecy", labelKey: "challenge_secrecy" as const, descKey: "challenge_secrecy_desc" as const },
];

const LiveDemoSection = ({ onTryChallenge }: LiveDemoSectionProps) => {
  const { t, lang } = useLanguage();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [dynamicQuestions, setDynamicQuestions] = useState<DynamicQuestion[]>([]);
  const [isLoadingDynamic, setIsLoadingDynamic] = useState(false);
  const [useDynamic, setUseDynamic] = useState(false);

  const fetchDynamicQuestions = useCallback(async () => {
    setIsLoadingDynamic(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const resp = await fetch(`${supabaseUrl}/functions/v1/generate-questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ language: lang, count: 4 }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.questions?.length) {
          setDynamicQuestions(data.questions);
          setUseDynamic(true);
        }
      }
    } catch {
      // Silently fall back to static
    } finally {
      setIsLoadingDynamic(false);
    }
  }, [lang]);

  useEffect(() => {
    fetchDynamicQuestions();
  }, [fetchDynamicQuestions]);

  const handleRefresh = () => {
    fetchDynamicQuestions();
  };

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
          <AnimatePresence mode="wait">
            {useDynamic && dynamicQuestions.length > 0 ? (
              <motion.div key="dynamic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-4">
                {dynamicQuestions.map((q, i) => (
                  <motion.button
                    key={`dyn-${i}-${q.text.slice(0, 20)}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    onMouseEnter={() => setHoveredId(`dyn-${i}`)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => onTryChallenge(q.text)}
                    className="group flex items-center justify-between p-6 rounded-xl border border-border
                               bg-card hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5
                               transition-all duration-300 text-left"
                  >
                    <div className="flex-1">
                      <p className="text-xs tracking-[0.2em] uppercase text-accent font-body mb-1">
                        {q.topic}
                      </p>
                      <p className="text-foreground font-heading text-lg font-medium italic leading-snug">
                        "{q.text}"
                      </p>
                    </div>
                    <motion.div
                      animate={{ x: hoveredId === `dyn-${i}` ? 4 : 0, opacity: hoveredId === `dyn-${i}` ? 1 : 0.4 }}
                      className="ml-4 p-2 rounded-full bg-accent/10 text-accent flex-shrink-0"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </motion.div>
                  </motion.button>
                ))}
              </motion.div>
            ) : (
              <motion.div key="static" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-4">
                {STATIC_CHALLENGES.map((challenge, i) => (
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex items-center justify-center gap-6 mt-10"
        >
          {useDynamic && (
            <button
              onClick={handleRefresh}
              disabled={isLoadingDynamic}
              className="inline-flex items-center gap-2 text-sm font-body text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDynamic ? "animate-spin" : ""}`} />
              {t("demo_refresh")}
            </button>
          )}
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

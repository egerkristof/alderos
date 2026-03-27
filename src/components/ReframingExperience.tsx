import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { Heart, Handshake, Lightbulb, ArrowLeft, Loader2, BookOpen, ExternalLink, ArrowRight } from "lucide-react";
import CitationText from "./CitationText";
import ResponseActions from "./ResponseActions";
import { useLanguage } from "@/contexts/LanguageContext";

interface Phase {
  icon: React.ReactNode;
  label: string;
  title: string;
  content: string;
}

interface Source {
  title: string;
  description: string;
  url?: string | null;
}

interface ReframingExperienceProps {
  challenge: string;
  onBack: () => void;
  onNewChallenge?: (text: string) => void;
}

const ReframingExperience = ({ challenge, onBack, onNewChallenge }: ReframingExperienceProps) => {
  const { t, lang } = useLanguage();
  const [phases, setPhases] = useState<Phase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePhase, setActivePhase] = useState(0);
  const [rawData, setRawData] = useState<{
    empathy: string;
    shared_value: string;
    message: string;
    sources?: Source[];
    follow_up_questions?: string[];
  } | null>(null);

  const phaseMeta = [
    { icon: <Heart className="w-5 h-5" />, label: t("phase1_label"), title: t("phase1_title"), key: "empathy" },
    { icon: <Handshake className="w-5 h-5" />, label: t("phase2_label"), title: t("phase2_title"), key: "shared_value" },
    { icon: <Lightbulb className="w-5 h-5" />, label: t("phase3_label"), title: t("phase3_title"), key: "message" },
  ];

  const fetchReframing = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setPhases([]);
    setRawData(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const resp = await fetch(`${supabaseUrl}/functions/v1/reframe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ challenge, language: lang }),
      });

      if (resp.status === 429) { setError(t("error_rate_limit")); setIsLoading(false); return; }
      if (resp.status === 402) { setError(t("error_unavailable")); setIsLoading(false); return; }
      if (!resp.ok) { setError(t("error_generic")); setIsLoading(false); return; }

      const data = await resp.json();
      setRawData({
        empathy: data.empathy || "",
        shared_value: data.shared_value || "",
        message: data.message || "",
        sources: data.sources || [],
        follow_up_questions: data.follow_up_questions || [],
      });

      const builtPhases: Phase[] = phaseMeta.map((meta) => ({
        icon: meta.icon, label: meta.label, title: meta.title,
        content: data[meta.key] || "",
      }));

      for (let i = 0; i < builtPhases.length; i++) {
        await new Promise((r) => setTimeout(r, i === 0 ? 400 : 800));
        setPhases((prev) => [...prev, builtPhases[i]]);
        setActivePhase(i);
      }
    } catch {
      setError(t("error_connection"));
    } finally {
      setIsLoading(false);
    }
  }, [challenge, lang]);

  useEffect(() => { fetchReframing(); }, [fetchReframing]);

  const allLoaded = phases.length === 3 && !isLoading;
  const sources = rawData?.sources || [];

  return (
    <section className="min-h-screen flex flex-col items-center px-6 py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-3xl w-full"
      >
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-12 font-body">
          <ArrowLeft className="w-4 h-4" /> {t("back")}
        </button>

        <div className="mb-12 text-center">
          <p className="text-sm tracking-[0.25em] uppercase text-accent mb-4 font-body">{t("concern_label")}</p>
          <blockquote className="text-xl md:text-2xl font-heading italic text-foreground/80 max-w-2xl mx-auto leading-relaxed">"{challenge}"</blockquote>
        </div>

        <div className="flex justify-center gap-3 mb-12">
          {phaseMeta.map((meta, i) => (
            <button key={meta.key} onClick={() => phases[i] && setActivePhase(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                i <= phases.length - 1 ? (i === activePhase ? "bg-accent scale-125" : "bg-accent/30") : "bg-border"
              }`} />
          ))}
        </div>

        {isLoading && phases.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Loader2 className="w-8 h-8 text-accent mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground font-body text-sm">{t("loading")}</p>
          </motion.div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <p className="text-muted-foreground font-body mb-4">{error}</p>
            <button onClick={fetchReframing} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm">{t("try_again")}</button>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {phases[activePhase] && (
            <motion.div key={activePhase} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.6 }} className="phase-card max-w-2xl mx-auto">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">{phases[activePhase].icon}</div>
                <div>
                  <p className="text-xs tracking-[0.2em] uppercase text-accent font-body">{phases[activePhase].label}</p>
                  <p className="text-sm text-muted-foreground font-body">{phases[activePhase].title}</p>
                </div>
              </div>
              <div className="prose prose-sm max-w-none text-foreground/85 font-body leading-relaxed">
                {sources.length > 0 ? (
                  <CitationText text={phases[activePhase].content} sources={sources} />
                ) : (
                  <p>{phases[activePhase].content}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {phases.length > 1 && (
          <div className="flex justify-center gap-4 mt-8">
            {phaseMeta.map((meta, i) => (
              phases[i] && (
                <button key={meta.key} onClick={() => setActivePhase(i)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-body transition-all ${
                    i === activePhase ? "bg-accent/10 text-accent border border-accent/20" : "text-muted-foreground hover:text-foreground"
                  }`}>
                  {meta.icon} {meta.label}
                </button>
              )
            ))}
          </div>
        )}

        {/* Sources section */}
        {allLoaded && sources.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="max-w-2xl mx-auto mt-12"
          >
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-heading tracking-wide text-foreground/80">{t("sources_label")}</h3>
            </div>
            <p className="text-xs text-muted-foreground font-body mb-5">{t("sources_subtitle")}</p>
            <ul className="space-y-4">
              {sources.map((source, i) => (
                <li key={i} className="flex gap-3 items-start group">
                  <span className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center text-accent text-[0.65rem] font-body font-semibold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <p className="text-sm font-body font-medium text-foreground/90 leading-snug">{source.title}</p>
                      {source.url && (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 mt-0.5 text-accent hover:text-accent/70 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <p className="text-xs font-body text-muted-foreground leading-relaxed mt-0.5">{source.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {allLoaded && rawData && <ResponseActions challenge={challenge} phases={rawData} />}

        {/* Follow-up questions */}
        {allLoaded && rawData?.follow_up_questions && rawData.follow_up_questions.length > 0 && onNewChallenge && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="max-w-2xl mx-auto mt-14"
          >
            <p className="text-center text-sm tracking-[0.2em] uppercase text-accent font-body mb-6">
              {t("followup_label")}
            </p>
            <div className="grid gap-3">
              {rawData.follow_up_questions.map((q, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + i * 0.1 }}
                  onClick={() => onNewChallenge(q)}
                  className="group flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-accent/40 hover:shadow-md hover:shadow-accent/5 transition-all text-left"
                >
                  <p className="text-sm font-body text-foreground/80 italic leading-snug flex-1">"{q}"</p>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent ml-3 flex-shrink-0 transition-colors" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
};

export default ReframingExperience;

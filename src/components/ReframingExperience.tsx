import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { Heart, Handshake, Lightbulb, ArrowLeft, Loader2, BookOpen, ExternalLink, ArrowRight, ChevronRight } from "lucide-react";
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

  const phaseIcons = [
    <Heart className="w-5 h-5" />,
    <Handshake className="w-5 h-5" />,
    <Lightbulb className="w-5 h-5" />,
  ];

  const phaseMeta = [
    { icon: phaseIcons[0], label: t("phase1_label"), title: t("phase1_title"), key: "empathy" },
    { icon: phaseIcons[1], label: t("phase2_label"), title: t("phase2_title"), key: "shared_value" },
    { icon: phaseIcons[2], label: t("phase3_label"), title: t("phase3_title"), key: "message" },
  ];

  const fetchReframing = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setPhases([]);
    setRawData(null);
    setActivePhase(0);

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
      }
      setActivePhase(0);
    } catch {
      setError(t("error_connection"));
    } finally {
      setIsLoading(false);
    }
  }, [challenge, lang]);

  useEffect(() => { fetchReframing(); }, [fetchReframing]);

  const allLoaded = phases.length === 3 && !isLoading;
  const sources = rawData?.sources || [];
  const isLastPhase = activePhase === 2;
  const canAdvance = activePhase < phases.length - 1;

  const handleNext = () => {
    if (canAdvance) setActivePhase((p) => p + 1);
  };

  const handlePrev = () => {
    if (activePhase > 0) setActivePhase((p) => p - 1);
  };

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

        {/* Concern quote */}
        <div className="mb-12 text-center">
          <p className="text-sm tracking-[0.25em] uppercase text-accent mb-4 font-body">{t("concern_label")}</p>
          <blockquote className="text-xl md:text-2xl font-heading italic text-foreground/80 max-w-2xl mx-auto leading-relaxed">"{challenge}"</blockquote>
        </div>

        {/* Vertical stepper */}
        {phases.length > 0 && (
          <div className="max-w-2xl mx-auto mb-10">
            <div className="flex items-center justify-between px-2">
              {phaseMeta.map((meta, i) => {
                const isActive = i === activePhase;
                const isCompleted = i < activePhase;
                const isAvailable = i < phases.length;

                return (
                  <div key={meta.key} className="flex items-center flex-1">
                    <button
                      onClick={() => isAvailable && setActivePhase(i)}
                      disabled={!isAvailable}
                      className={`flex items-center gap-2.5 transition-all duration-300 ${
                        isAvailable ? "cursor-pointer" : "cursor-default opacity-30"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                        isActive
                          ? "bg-accent text-accent-foreground shadow-md shadow-accent/20 scale-110"
                          : isCompleted
                            ? "bg-accent/20 text-accent"
                            : "bg-border/50 text-muted-foreground"
                      }`}>
                        {meta.icon}
                      </div>
                      <div className="hidden md:block text-left">
                        <p className={`text-[0.65rem] tracking-[0.15em] uppercase font-body transition-colors ${
                          isActive ? "text-accent" : "text-muted-foreground"
                        }`}>
                          {t("step_label")} {i + 1}
                        </p>
                        <p className={`text-xs font-body font-medium transition-colors ${
                          isActive ? "text-foreground" : "text-muted-foreground/70"
                        }`}>
                          {meta.label}
                        </p>
                      </div>
                    </button>
                    {i < 2 && (
                      <div className="flex-1 mx-3 hidden md:block">
                        <div className={`h-px transition-colors duration-500 ${
                          isCompleted ? "bg-accent/40" : "bg-border"
                        }`} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && phases.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Loader2 className="w-8 h-8 text-accent mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground font-body text-sm">{t("loading")}</p>
          </motion.div>
        )}

        {/* Error state */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <p className="text-muted-foreground font-body mb-4">{error}</p>
            <button onClick={fetchReframing} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm">{t("try_again")}</button>
          </motion.div>
        )}

        {/* Phase content */}
        <AnimatePresence mode="wait">
          {phases[activePhase] && (
            <motion.div
              key={activePhase}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl mx-auto"
            >
              {/* Phase header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                  {phases[activePhase].icon}
                </div>
                <div>
                  <p className="text-xs tracking-[0.2em] uppercase text-accent font-body mb-0.5">
                    {t("step_label")} {activePhase + 1} {t("step_of")} 3
                  </p>
                  <h3 className="text-lg font-heading font-semibold text-foreground">{phases[activePhase].label}</h3>
                  <p className="text-sm text-muted-foreground font-body">{phases[activePhase].title}</p>
                </div>
              </div>

              {/* Phase body */}
              <div className="phase-card">
                <div className="prose prose-sm max-w-none text-foreground/85 font-body leading-relaxed text-base">
                  {sources.length > 0 ? (
                    <CitationText text={phases[activePhase].content} sources={sources} />
                  ) : (
                    <p>{phases[activePhase].content}</p>
                  )}
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={handlePrev}
                  disabled={activePhase === 0}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-body transition-all ${
                    activePhase === 0
                      ? "opacity-0 pointer-events-none"
                      : "text-muted-foreground hover:text-foreground border border-border hover:border-accent/30"
                  }`}
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> {phaseMeta[activePhase - 1]?.label || ""}
                </button>

                {canAdvance ? (
                  <motion.button
                    onClick={handleNext}
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-body bg-accent text-accent-foreground hover:opacity-90 transition-opacity shadow-md shadow-accent/10"
                  >
                    {phaseMeta[activePhase + 1]?.label} <ChevronRight className="w-4 h-4" />
                  </motion.button>
                ) : (
                  <div />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sources section - show on every phase once loaded */}
        {allLoaded && sources.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
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
                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 mt-0.5 text-accent hover:text-accent/70 transition-colors">
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

        {allLoaded && isLastPhase && activePhase === 2 && rawData && <ResponseActions challenge={challenge} phases={rawData} />}

        {/* Follow-up questions */}
        {allLoaded && isLastPhase && activePhase === 2 && rawData?.follow_up_questions && rawData.follow_up_questions.length > 0 && onNewChallenge && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
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
                  transition={{ delay: 0.7 + i * 0.1 }}
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

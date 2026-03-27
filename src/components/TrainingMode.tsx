import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { PenLine, Sparkles, ArrowRight, Loader2, Star, Lightbulb, ChevronDown, ChevronUp, Heart, Handshake, Target, HelpCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import ReactMarkdown from "react-markdown";

interface TrainingModeProps {
  challenge: string;
  aiPhases: { empathy: string; shared_value: string; message: string } | null;
  isAiLoading: boolean;
}

interface StepFeedback {
  score: number;
  strengths: string;
  improvements: string;
  root_cause: string;
  ideal_example: string;
}

interface CoachingData {
  overall_score: number;
  overall_summary: string;
  empathy_feedback: StepFeedback;
  shared_value_feedback: StepFeedback;
  message_feedback: StepFeedback;
  key_takeaway: string;
}

const ScoreBadge = ({ score }: { score: number }) => {
  const color = score >= 8 ? "text-primary bg-primary/10 border-primary/20" :
    score >= 5 ? "text-accent bg-accent/10 border-accent/20" :
    "text-destructive bg-destructive/10 border-destructive/20";
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-body font-semibold border ${color}`}>
      <Star className="w-3 h-3" /> {score}/10
    </span>
  );
};

const FeedbackSection = ({ title, icon, feedback, expanded, onToggle }: {
  title: string;
  icon: React.ReactNode;
  feedback: StepFeedback;
  expanded: boolean;
  onToggle: () => void;
}) => {
  const { t } = useLanguage();
  return (
    <div className="phase-card">
      <button onClick={onToggle} className="w-full flex items-center justify-between text-left">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-accent">
            {icon}
          </div>
          <div>
            <p className="text-sm font-heading font-semibold text-foreground">{title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ScoreBadge score={feedback.score} />
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-5 space-y-5">
              {/* Strengths */}
              <div>
                <p className="text-xs tracking-[0.15em] uppercase text-primary font-body mb-1.5">{t("coach_strengths")}</p>
                <div className="text-sm text-foreground/85 font-body leading-relaxed prose prose-sm max-w-none">
                  <ReactMarkdown>{feedback.strengths}</ReactMarkdown>
                </div>
              </div>

              {/* Improvements */}
              <div>
                <p className="text-xs tracking-[0.15em] uppercase text-accent font-body mb-1.5">{t("coach_improve")}</p>
                <div className="text-sm text-foreground/85 font-body leading-relaxed prose prose-sm max-w-none">
                  <ReactMarkdown>{feedback.improvements}</ReactMarkdown>
                </div>
              </div>

              {/* Root cause */}
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-xs tracking-[0.15em] uppercase text-accent font-body mb-1.5 flex items-center gap-1.5">
                  <Lightbulb className="w-3 h-3" /> {t("coach_root_cause")}
                </p>
                <div className="text-sm text-foreground/80 font-body leading-relaxed italic prose prose-sm max-w-none">
                  <ReactMarkdown>{feedback.root_cause}</ReactMarkdown>
                </div>
              </div>

              {/* Ideal example */}
              <div className="border-t border-border pt-4">
                <p className="text-xs tracking-[0.15em] uppercase text-primary font-body mb-1.5">{t("coach_ideal")}</p>
                <div className="text-sm text-foreground/85 font-body leading-relaxed bg-primary/[0.03] p-4 rounded-lg border border-primary/10 prose prose-sm max-w-none">
                  <ReactMarkdown>{feedback.ideal_example}</ReactMarkdown>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TrainingMode = ({ challenge, aiPhases, isAiLoading }: TrainingModeProps) => {
  const { t, lang } = useLanguage();
  const [userAnswers, setUserAnswers] = useState({ empathy: "", shared_value: "", message: "" });
  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [coaching, setCoaching] = useState<CoachingData | null>(null);
  const [isCoachingLoading, setIsCoachingLoading] = useState(false);
  const [coachingError, setCoachingError] = useState<string | null>(null);
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>("empathy_feedback");
  const [hints, setHints] = useState<Record<string, string[]>>({});
  const [hintsLoading, setHintsLoading] = useState(false);

  const STEPS = [
    {
      key: "empathy" as const,
      labelKey: "train_step1_label" as const,
      placeholderKey: "train_step1_placeholder" as const,
      guidanceKey: "train_step1_guidance" as const,
      icon: <Heart className="w-5 h-5" />,
    },
    {
      key: "shared_value" as const,
      labelKey: "train_step2_label" as const,
      placeholderKey: "train_step2_placeholder" as const,
      guidanceKey: "train_step2_guidance" as const,
      icon: <Handshake className="w-5 h-5" />,
    },
    {
      key: "message" as const,
      labelKey: "train_step3_label" as const,
      placeholderKey: "train_step3_placeholder" as const,
      guidanceKey: "train_step3_guidance" as const,
      icon: <Target className="w-5 h-5" />,
    },
  ];

  const fetchCoaching = async () => {
    setIsCoachingLoading(true);
    setCoachingError(null);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const resp = await fetch(`${supabaseUrl}/functions/v1/coach`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          challenge,
          userAnswers,
          aiAnswers: aiPhases,
          language: lang,
        }),
      });
      if (resp.status === 429) { setCoachingError(t("error_rate_limit")); return; }
      if (resp.status === 402) { setCoachingError(t("error_unavailable")); return; }
      if (!resp.ok) { setCoachingError(t("error_generic")); return; }
      const data = await resp.json();
      setCoaching(data);
    } catch {
      setCoachingError(t("error_connection"));
    } finally {
      setIsCoachingLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      setSubmitted(true);
      if (aiPhases) fetchCoaching();
    }
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
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                {step.icon}
              </div>
              <div>
                <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-body">
                  {t("training_step")} {currentStep + 1} {t("training_of")} 3
                </p>
                <h3 className="text-xl font-heading font-semibold text-foreground">{t(step.labelKey)}</h3>
              </div>
            </div>

            {/* Guidance box */}
            <div className="bg-accent/[0.04] border border-accent/15 rounded-lg p-4 mb-5">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm font-body text-foreground/75 leading-relaxed">
                  {t(step.guidanceKey)}
                </p>
              </div>
            </div>

            <textarea
              value={userAnswers[step.key]}
              onChange={(e) => setUserAnswers((prev) => ({ ...prev, [step.key]: e.target.value }))}
              placeholder={t(step.placeholderKey)}
              className="w-full h-36 px-5 py-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground/50 resize-none font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all"
            />
            <div className="flex justify-between items-center mt-4">
              {currentStep > 0 ? (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("back")}
                </button>
              ) : <div />}
              <button onClick={handleNext} disabled={!userAnswers[step.key].trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity">
                {currentStep < 2 ? t("training_next") : t("training_submit")}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    );
  }

  // Coaching results
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-8">
        <Sparkles className="w-5 h-5 text-accent" />
        <p className="text-sm tracking-[0.2em] uppercase text-accent font-body">{t("coach_title")}</p>
      </div>

      {/* Loading state */}
      {isCoachingLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <Loader2 className="w-8 h-8 text-accent mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground font-body text-sm">{t("coach_loading")}</p>
        </motion.div>
      )}

      {/* Error state */}
      {coachingError && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <p className="text-muted-foreground font-body mb-4">{coachingError}</p>
          <button onClick={fetchCoaching} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm">
            {t("try_again")}
          </button>
        </motion.div>
      )}

      {/* Coaching results */}
      {coaching && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
          {/* Overall summary */}
          <div className="phase-card text-center">
            <div className="mb-3">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-heading font-semibold border border-accent/20 bg-accent/[0.05] text-accent">
                <Star className="w-5 h-5" /> {coaching.overall_score}/10
              </span>
            </div>
            <div className="text-base text-foreground/85 font-body leading-relaxed max-w-xl mx-auto prose prose-sm">
              <ReactMarkdown>{coaching.overall_summary}</ReactMarkdown>
            </div>
          </div>

          {/* Per-step feedback */}
          <FeedbackSection
            title={t("train_step1_label")}
            icon={<Heart className="w-4 h-4" />}
            feedback={coaching.empathy_feedback}
            expanded={expandedFeedback === "empathy_feedback"}
            onToggle={() => setExpandedFeedback(expandedFeedback === "empathy_feedback" ? null : "empathy_feedback")}
          />
          <FeedbackSection
            title={t("train_step2_label")}
            icon={<Handshake className="w-4 h-4" />}
            feedback={coaching.shared_value_feedback}
            expanded={expandedFeedback === "shared_value_feedback"}
            onToggle={() => setExpandedFeedback(expandedFeedback === "shared_value_feedback" ? null : "shared_value_feedback")}
          />
          <FeedbackSection
            title={t("train_step3_label")}
            icon={<Target className="w-4 h-4" />}
            feedback={coaching.message_feedback}
            expanded={expandedFeedback === "message_feedback"}
            onToggle={() => setExpandedFeedback(expandedFeedback === "message_feedback" ? null : "message_feedback")}
          />

          {/* Key takeaway */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-primary/[0.04] border border-primary/15 rounded-xl p-6 text-center"
          >
            <Lightbulb className="w-6 h-6 text-primary mx-auto mb-3" />
            <p className="text-xs tracking-[0.2em] uppercase text-primary font-body mb-2">{t("coach_takeaway")}</p>
            <div className="text-base font-heading italic text-foreground/85 leading-relaxed max-w-lg mx-auto prose prose-sm">
              <ReactMarkdown>{coaching.key_takeaway}</ReactMarkdown>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TrainingMode;

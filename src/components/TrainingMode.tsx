import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { PenLine, Sparkles, ArrowRight, Eye } from "lucide-react";

interface TrainingModeProps {
  challenge: string;
  aiPhases: { empathy: string; shared_value: string; message: string } | null;
  isAiLoading: boolean;
}

const STEPS = [
  { key: "empathy", label: "Acknowledge the concern", placeholder: "How would you empathize with this concern? What feelings or experiences would you acknowledge?" },
  { key: "shared_value", label: "Find a shared value", placeholder: "What values do you share with the person asking? What common ground can you find?" },
  { key: "message", label: "Craft a truth-based message", placeholder: "Based on that shared value, what positive, truthful message would you offer?" },
] as const;

const TrainingMode = ({ challenge, aiPhases, isAiLoading }: TrainingModeProps) => {
  const [userAnswers, setUserAnswers] = useState({ empathy: "", shared_value: "", message: "" });
  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [revealedSteps, setRevealedSteps] = useState<Set<string>>(new Set());

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      setSubmitted(true);
    }
  };

  const toggleReveal = (key: string) => {
    setRevealedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const step = STEPS[currentStep];

  if (!submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl mx-auto"
      >
        <div className="flex items-center gap-2 mb-8">
          <PenLine className="w-5 h-5 text-accent" />
          <p className="text-sm tracking-[0.2em] uppercase text-accent font-body">
            Training Mode — Your turn
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div
              key={s.key}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                i <= currentStep ? "bg-accent" : "bg-border"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-body mb-2">
              Step {currentStep + 1} of 3
            </p>
            <h3 className="text-xl font-heading font-semibold text-foreground mb-4">
              {step.label}
            </h3>
            <textarea
              value={userAnswers[step.key]}
              onChange={(e) =>
                setUserAnswers((prev) => ({ ...prev, [step.key]: e.target.value }))
              }
              placeholder={step.placeholder}
              className="w-full h-32 px-5 py-4 rounded-xl border border-border bg-card text-foreground
                         placeholder:text-muted-foreground/50 resize-none font-body text-sm
                         focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all"
            />
            <div className="flex justify-end mt-4">
              <button
                onClick={handleNext}
                disabled={!userAnswers[step.key].trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-full
                           font-body text-sm disabled:opacity-40 disabled:cursor-not-allowed
                           hover:opacity-90 transition-opacity"
              >
                {currentStep < 2 ? "Next" : "See how AI reframed it"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    );
  }

  // Comparison view
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-3xl mx-auto"
    >
      <div className="flex items-center gap-2 mb-8">
        <Sparkles className="w-5 h-5 text-accent" />
        <p className="text-sm tracking-[0.2em] uppercase text-accent font-body">
          Compare your reframing
        </p>
      </div>

      <div className="space-y-6">
        {STEPS.map((s) => (
          <div key={s.key} className="phase-card">
            <p className="text-xs tracking-[0.15em] uppercase text-accent font-body mb-4">
              {s.label}
            </p>

            {/* User's answer */}
            <div className="mb-4">
              <p className="text-xs font-body text-muted-foreground mb-1 flex items-center gap-1.5">
                <PenLine className="w-3 h-3" /> Your response
              </p>
              <p className="text-sm text-foreground/85 font-body leading-relaxed">
                {userAnswers[s.key] || <span className="italic text-muted-foreground">— skipped —</span>}
              </p>
            </div>

            {/* AI's answer */}
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-body text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> Alderos AI
                </p>
                <button
                  onClick={() => toggleReveal(s.key)}
                  className="text-xs font-body text-accent flex items-center gap-1 hover:opacity-80 transition-opacity"
                >
                  <Eye className="w-3 h-3" />
                  {revealedSteps.has(s.key) ? "Hide" : "Reveal"}
                </button>
              </div>
              <AnimatePresence>
                {revealedSteps.has(s.key) && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-sm text-foreground/85 font-body leading-relaxed overflow-hidden"
                  >
                    {isAiLoading
                      ? "Generating..."
                      : aiPhases?.[s.key] || "No response available."}
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

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { Heart, Handshake, Lightbulb, ArrowLeft, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Phase {
  icon: React.ReactNode;
  label: string;
  title: string;
  content: string;
}

interface ReframingExperienceProps {
  challenge: string;
  onBack: () => void;
}

const PHASE_META = [
  {
    icon: <Heart className="w-5 h-5" />,
    label: "I hear you",
    title: "Empathetic Acknowledgment",
    key: "empathy",
  },
  {
    icon: <Handshake className="w-5 h-5" />,
    label: "What we share",
    title: "Shared Values",
    key: "shared_value",
  },
  {
    icon: <Lightbulb className="w-5 h-5" />,
    label: "A different lens",
    title: "A Truth-Based Message",
    key: "message",
  },
];

const ReframingExperience = ({ challenge, onBack }: ReframingExperienceProps) => {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePhase, setActivePhase] = useState(0);

  const fetchReframing = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setPhases([]);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const resp = await fetch(`${supabaseUrl}/functions/v1/reframe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ challenge }),
      });

      if (resp.status === 429) {
        setError("We're receiving many requests right now. Please try again in a moment.");
        setIsLoading(false);
        return;
      }
      if (resp.status === 402) {
        setError("Service temporarily unavailable. Please try again later.");
        setIsLoading(false);
        return;
      }
      if (!resp.ok) {
        setError("Something went wrong. Please try again.");
        setIsLoading(false);
        return;
      }

      const data = await resp.json();

      const builtPhases: Phase[] = PHASE_META.map((meta, i) => ({
        icon: meta.icon,
        label: meta.label,
        title: meta.title,
        content: data[meta.key] || "",
      }));

      // Reveal phases sequentially
      for (let i = 0; i < builtPhases.length; i++) {
        await new Promise((r) => setTimeout(r, i === 0 ? 400 : 800));
        setPhases((prev) => [...prev, builtPhases[i]]);
        setActivePhase(i);
      }
    } catch {
      setError("Unable to connect. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [challenge]);

  useEffect(() => {
    fetchReframing();
  }, [fetchReframing]);

  return (
    <section className="min-h-screen flex flex-col items-center px-6 py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-3xl w-full"
      >
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground
                     transition-colors mb-12 font-body"
        >
          <ArrowLeft className="w-4 h-4" />
          Ask another question
        </button>

        {/* The challenge */}
        <div className="mb-12 text-center">
          <p className="text-sm tracking-[0.25em] uppercase text-accent mb-4 font-body">
            The concern
          </p>
          <blockquote className="text-xl md:text-2xl font-heading italic text-foreground/80 max-w-2xl mx-auto leading-relaxed">
            "{challenge}"
          </blockquote>
        </div>

        {/* Phase indicator dots */}
        <div className="flex justify-center gap-3 mb-12">
          {PHASE_META.map((meta, i) => (
            <button
              key={meta.key}
              onClick={() => phases[i] && setActivePhase(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                i <= phases.length - 1
                  ? i === activePhase
                    ? "bg-accent scale-125"
                    : "bg-accent/30"
                  : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* Loading state */}
        {isLoading && phases.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Loader2 className="w-8 h-8 text-accent mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground font-body text-sm">
              Thoughtfully considering your question...
            </p>
          </motion.div>
        )}

        {/* Error state */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-muted-foreground font-body mb-4">{error}</p>
            <button
              onClick={fetchReframing}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm"
            >
              Try again
            </button>
          </motion.div>
        )}

        {/* Phase cards */}
        <AnimatePresence mode="wait">
          {phases[activePhase] && (
            <motion.div
              key={activePhase}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6 }}
              className="phase-card max-w-2xl mx-auto"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                  {phases[activePhase].icon}
                </div>
                <div>
                  <p className="text-xs tracking-[0.2em] uppercase text-accent font-body">
                    {phases[activePhase].label}
                  </p>
                  <p className="text-sm text-muted-foreground font-body">
                    {phases[activePhase].title}
                  </p>
                </div>
              </div>
              <div className="prose prose-sm max-w-none text-foreground/85 font-body leading-relaxed">
                <ReactMarkdown>{phases[activePhase].content}</ReactMarkdown>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase navigation */}
        {phases.length > 1 && (
          <div className="flex justify-center gap-4 mt-8">
            {PHASE_META.map((meta, i) => (
              phases[i] && (
                <button
                  key={meta.key}
                  onClick={() => setActivePhase(i)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-body transition-all
                    ${i === activePhase
                      ? "bg-accent/10 text-accent border border-accent/20"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {meta.icon}
                  {meta.label}
                </button>
              )
            ))}
          </div>
        )}
      </motion.div>
    </section>
  );
};

export default ReframingExperience;

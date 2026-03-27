import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

const PRELOADED_CHALLENGES = [
  {
    id: "wealth",
    label: "Money & Power",
    summary: "Opus Dei is very rich, has expensive houses, and is interested in money and power.",
  },
  {
    id: "recruitment",
    label: "Recruitment & Control",
    summary: "Opus Dei wants to catch people as young as possible and then control them — everything is about recruitment.",
  },
  {
    id: "leaving",
    label: "People Who Leave",
    summary: "When people leave Opus Dei, they are very unhappy and are not helped by members they were with.",
  },
  {
    id: "secrecy",
    label: "Secrecy & Transparency",
    summary: "Opus Dei is secretive and doesn't want people to know what really goes on inside.",
  },
  {
    id: "autonomy",
    label: "Personal Freedom",
    summary: "Members of Opus Dei don't have real freedom — they're told what to do, how to spend money, and how to live.",
  },
];

interface ChallengeSelectorProps {
  onSelect: (challenge: string) => void;
  trainingMode?: boolean;
}

const ChallengeSelector = ({ onSelect, trainingMode }: ChallengeSelectorProps) => {
  const [customInput, setCustomInput] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleChipClick = (challenge: typeof PRELOADED_CHALLENGES[0]) => {
    setSelectedId(challenge.id);
    setCustomInput("");
    onSelect(challenge.summary);
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
          Step One
        </p>
        <h2 className="text-3xl md:text-4xl font-heading font-semibold text-foreground mb-3">
          What's on your mind?
        </h2>
        <p className="text-muted-foreground font-body mb-12 max-w-lg mx-auto">
          Choose a common concern or share your own. There are no wrong questions here.
        </p>

        {/* Preloaded challenges */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {PRELOADED_CHALLENGES.map((challenge, i) => (
            <motion.button
              key={challenge.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
              onClick={() => handleChipClick(challenge)}
              className={`challenge-chip text-sm font-body ${
                selectedId === challenge.id ? "active" : ""
              }`}
            >
              {challenge.label}
            </motion.button>
          ))}
        </div>

        {/* Selected challenge preview */}
        {selectedId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-10 px-6 py-4 rounded-xl bg-card border border-border text-left max-w-xl mx-auto"
          >
            <p className="text-sm text-muted-foreground mb-1 font-body">Selected concern:</p>
            <p className="text-foreground font-body italic">
              "{PRELOADED_CHALLENGES.find(c => c.id === selectedId)?.summary}"
            </p>
          </motion.div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-4 mb-10 max-w-md mx-auto">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground tracking-widest uppercase font-body">or ask your own</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Custom input */}
        <div className="max-w-xl mx-auto relative">
          <textarea
            value={customInput}
            onChange={(e) => {
              setCustomInput(e.target.value);
              setSelectedId(null);
            }}
            placeholder="Share your question, concern, or thought about Opus Dei..."
            className="w-full h-28 px-5 py-4 rounded-xl border border-border bg-card text-foreground
                       placeholder:text-muted-foreground/50 resize-none font-body text-sm
                       focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40
                       transition-all"
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

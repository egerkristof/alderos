import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Source {
  title: string;
  description: string;
  url?: string | null;
}

interface CitationTextProps {
  text: string;
  sources: Source[];
}

const CitationText = ({ text, sources }: CitationTextProps) => {
  const [hoveredCitation, setHoveredCitation] = useState<number | null>(null);

  const parts = useMemo(() => {
    const regex = /\[(\d+)\]/g;
    const result: { type: "text" | "citation"; value: string; index?: number }[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        result.push({ type: "text", value: text.slice(lastIndex, match.index) });
      }
      const citationIndex = parseInt(match[1], 10);
      result.push({ type: "citation", value: match[0], index: citationIndex });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      result.push({ type: "text", value: text.slice(lastIndex) });
    }

    return result;
  }, [text]);

  return (
    <span className="relative">
      {parts.map((part, i) => {
        if (part.type === "text") {
          return <span key={i}>{part.value}</span>;
        }

        const source = part.index != null ? sources[part.index - 1] : null;

        return (
          <span
            key={i}
            className="relative inline-block"
            onMouseEnter={() => setHoveredCitation(part.index ?? null)}
            onMouseLeave={() => setHoveredCitation(null)}
          >
            <sup className="cursor-help text-accent font-body font-semibold text-[0.7em] hover:text-accent/80 transition-colors px-0.5">
              {part.value}
            </sup>
            <AnimatePresence>
              {hoveredCitation === part.index && source && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-72 p-3 rounded-lg border border-border bg-card shadow-lg"
                >
                  <p className="text-xs font-body font-medium text-foreground mb-1">{source.title}</p>
                  <p className="text-[0.7rem] font-body text-muted-foreground leading-relaxed">{source.description}</p>
                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[0.7rem] font-body text-accent hover:underline mt-1 block truncate"
                    >
                      View source ↗
                    </a>
                  )}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-card border-r border-b border-border -mt-1" />
                </motion.div>
              )}
            </AnimatePresence>
          </span>
        );
      })}
    </span>
  );
};

export default CitationText;

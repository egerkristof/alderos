import { useState, useMemo, useRef, useEffect } from "react";
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
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (hoveredCitation == null || !triggerRef.current) return;

    const el = triggerRef.current;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const tooltipW = 288; // w-72 = 18rem = 288px
    let left = rect.left + rect.width / 2 - tooltipW / 2;

    // Clamp horizontally
    if (left < 8) left = 8;
    if (left + tooltipW > vw - 8) left = vw - 8 - tooltipW;

    // Position above or below
    const spaceAbove = rect.top;
    const above = spaceAbove > 160;

    setTooltipStyle({
      position: "fixed",
      left: `${left}px`,
      top: above ? `${rect.top - 8}px` : `${rect.bottom + 8}px`,
      transform: above ? "translateY(-100%)" : "translateY(0)",
      zIndex: 9999,
    });
  }, [hoveredCitation]);

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

  const hoveredSource = hoveredCitation != null ? sources[hoveredCitation - 1] : null;

  return (
    <span className="relative">
      {parts.map((part, i) => {
        if (part.type === "text") {
          return <span key={i}>{part.value}</span>;
        }

        return (
          <span
            key={i}
            className="relative inline-block"
            ref={hoveredCitation === part.index ? triggerRef : undefined}
            onMouseEnter={(e) => {
              triggerRef.current = e.currentTarget;
              setHoveredCitation(part.index ?? null);
            }}
            onMouseLeave={() => setTimeout(() => setHoveredCitation((prev) => prev === part.index ? null : prev), 150)}
            onTouchStart={(e) => {
              triggerRef.current = e.currentTarget;
              setHoveredCitation((prev) => (prev === part.index ? null : (part.index ?? null)));
            }}
          >
            <sup className="cursor-help text-accent font-body font-semibold text-[0.7em] hover:text-accent/80 transition-colors px-0.5">
              {part.value}
            </sup>
          </span>
        );
      })}

      {/* Portal-like fixed tooltip */}
      <AnimatePresence>
        {hoveredCitation != null && hoveredSource && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={tooltipStyle}
            className="w-72 p-3 rounded-lg border border-border bg-card shadow-lg pointer-events-none"
          >
            <p className="text-xs font-body font-medium text-foreground mb-1">{hoveredSource.title}</p>
            <p className="text-[0.7rem] font-body text-muted-foreground leading-relaxed">{hoveredSource.description}</p>
            {hoveredSource.url && (
              <span className="text-[0.7rem] font-body text-accent mt-1 block truncate">
                View source
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
};

export default CitationText;

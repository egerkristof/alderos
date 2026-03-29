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

/**
 * Splits the answer into paragraphs (double-newline separated),
 * renders inline markdown (bold, italic) and citation markers with tooltips.
 */
const CitationText = ({ text, sources }: CitationTextProps) => {
  const [hoveredCitation, setHoveredCitation] = useState<number | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (hoveredCitation == null || !triggerRef.current) return;

    const el = triggerRef.current;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const tooltipW = 288;
    let left = rect.left + rect.width / 2 - tooltipW / 2;

    if (left < 8) left = 8;
    if (left + tooltipW > vw - 8) left = vw - 8 - tooltipW;

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

  // Split into paragraphs on double newlines
  const paragraphs = useMemo(() => {
    return text.split(/\n{2,}/).filter((p) => p.trim().length > 0);
  }, [text]);

  const hoveredSource = hoveredCitation != null ? sources[hoveredCitation - 1] : null;

  const renderInlineContent = (content: string) => {
    // Parse: **bold**, *italic*, and [N] citations — all inline
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|\[(\d+)\])/g;
    const result: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      // Text before this match
      if (match.index > lastIndex) {
        result.push(content.slice(lastIndex, match.index));
      }

      if (match[2]) {
        // **bold**
        result.push(
          <strong key={`b-${match.index}`} className="font-semibold text-foreground">
            {match[2]}
          </strong>
        );
      } else if (match[3]) {
        // *italic*
        result.push(
          <em key={`i-${match.index}`}>{match[3]}</em>
        );
      } else if (match[4]) {
        // [N] citation
        const citationIndex = parseInt(match[4], 10);
        result.push(
          <span
            key={`c-${match.index}`}
            className="relative inline"
            ref={hoveredCitation === citationIndex ? triggerRef : undefined}
            onMouseEnter={(e) => {
              triggerRef.current = e.currentTarget;
              setHoveredCitation(citationIndex);
            }}
            onMouseLeave={() =>
              setTimeout(
                () => setHoveredCitation((prev) => (prev === citationIndex ? null : prev)),
                150
              )
            }
            onTouchStart={(e) => {
              triggerRef.current = e.currentTarget;
              setHoveredCitation((prev) =>
                prev === citationIndex ? null : citationIndex
              );
            }}
          >
            <sup className="cursor-help text-accent font-body font-semibold text-[0.7em] hover:text-accent/80 transition-colors px-0.5">
              [{match[4]}]
            </sup>
          </span>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      result.push(content.slice(lastIndex));
    }

    return result;
  };

  return (
    <div className="relative">
      {paragraphs.map((para, i) => {
        // Handle single-newline line breaks within a paragraph
        const lines = para.split(/\n/);

        return (
          <p key={i} className="mb-4 last:mb-0 leading-relaxed">
            {lines.map((line, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {renderInlineContent(line)}
              </span>
            ))}
          </p>
        );
      })}

      {/* Fixed tooltip */}
      <AnimatePresence>
        {hoveredCitation != null && hoveredSource && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={tooltipStyle}
            className="w-72 p-3 rounded-lg border border-border bg-card shadow-lg"
            onMouseEnter={() => setHoveredCitation(hoveredCitation)}
            onMouseLeave={() => setHoveredCitation(null)}
          >
            <p className="text-xs font-body font-medium text-foreground mb-1">
              {hoveredSource.title}
            </p>
            <p className="text-[0.7rem] font-body text-muted-foreground leading-relaxed">
              {hoveredSource.description}
            </p>
            {hoveredSource.url && (
              <a
                href={hoveredSource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[0.7rem] font-body text-accent mt-1 block truncate hover:text-accent/80 transition-colors"
              >
                View source
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CitationText;

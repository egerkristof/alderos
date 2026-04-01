import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import CitationText from "./CitationText";

interface Source {
  title: string;
  description: string;
  url?: string | null;
}

interface ExploreAnswerProps {
  answer: string;
  sources: Source[];
}

/**
 * Renders only the answer text with inline citations.
 * Sources and follow-ups are handled by the parent.
 */
const ExploreAnswer = ({ answer, sources }: ExploreAnswerProps) => {
  const { t } = useLanguage();

  const verifiedSources = sources.filter(s => !!s.url);

  const indexMap = new Map<number, number>();
  let newIdx = 1;
  sources.forEach((s, i) => {
    if (s.url) indexMap.set(i + 1, newIdx++);
  });

  const cleanedAnswer = answer.replace(/\[(\d+)\]/g, (_match, num) => {
    const n = parseInt(num, 10);
    const mapped = indexMap.get(n);
    return mapped ? `[${mapped}]` : "";
  });

  const wordCount = cleanedAnswer.split(/\s+/).length;
  const lowSourceCoverage = verifiedSources.length <= 1 && wordCount > 150;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-4"
    >
      <div className="prose prose-neutral max-w-none font-body text-foreground/90 leading-relaxed">
        <CitationText text={cleanedAnswer} sources={verifiedSources} />
      </div>

      {lowSourceCoverage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex gap-3 p-3 rounded-xl border border-accent/20 bg-accent/[0.04]"
        >
          <Info className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
          <p className="text-xs font-body text-foreground/70 leading-relaxed">
            {t("low_source_notice")}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ExploreAnswer;

/**
 * Helper to extract verified sources from raw sources array.
 * Used by parent to accumulate sources across turns.
 */
export function getVerifiedSources(sources: Source[]): (Source & { url: string })[] {
  return sources.filter((s): s is Source & { url: string } => !!s.url);
}

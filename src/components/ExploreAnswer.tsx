import { motion } from "framer-motion";
import { ExternalLink, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import ReactMarkdown from "react-markdown";
import CitationText from "./CitationText";

interface Source {
  title: string;
  description: string;
  url?: string | null;
}

interface ExploreAnswerProps {
  answer: string;
  sources: Source[];
  followUpQuestions: string[];
  onFollowUp: (question: string) => void;
}

const ExploreAnswer = ({ answer, sources, followUpQuestions, onFollowUp }: ExploreAnswerProps) => {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-8"
    >
      {/* Answer */}
      <div className="prose prose-neutral max-w-none font-body text-foreground/90 leading-relaxed">
        <CitationText text={answer} sources={sources} />
      </div>

      {/* Sources */}
      {sources.filter(s => !!s.url).length > 0 && (
        <div className="pt-6 border-t border-border">
          <p className="text-xs tracking-[0.2em] uppercase text-accent font-body mb-4">
            {t("sources_label")}
          </p>
          <div className="space-y-3">
            {sources.filter(s => !!s.url).map((source, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="text-xs font-body text-accent/70 mt-0.5 flex-shrink-0">[{i + 1}]</span>
                <div className="flex-1 min-w-0">
                  <p className="font-body font-medium text-foreground/80">
                    <a href={source.url!} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors inline-flex items-center gap-1">
                      {source.title}
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </p>
                  <p className="text-muted-foreground/70 font-body text-xs mt-0.5">{source.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Follow-up questions */}
      {followUpQuestions.length > 0 && (
        <div className="pt-6 border-t border-border">
          <p className="text-xs tracking-[0.2em] uppercase text-accent font-body mb-4">
            {t("followup_label")}
          </p>
          <div className="space-y-2">
            {followUpQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => onFollowUp(q)}
                className="w-full text-left group flex items-center gap-3 p-3 rounded-lg
                           border border-border hover:border-accent/30 hover:bg-accent/[0.03]
                           transition-all duration-200"
              >
                <span className="flex-1 text-sm font-body text-foreground/70 group-hover:text-foreground transition-colors">
                  {q}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-accent flex-shrink-0 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ExploreAnswer;

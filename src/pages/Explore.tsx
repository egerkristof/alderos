import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, ArrowLeft, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import ExploreAnswer from "@/components/ExploreAnswer";
import Footer from "@/components/Footer";

const EXPLORE_SESSION_ID = crypto.randomUUID();

interface AnswerData {
  answer: string;
  sources: { title: string; description: string; url?: string | null }[];
  follow_up_questions: string[];
}

const Explore = () => {
  const { t, lang } = useLanguage();
  const [question, setQuestion] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [answerData, setAnswerData] = useState<AnswerData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collectConsent, setCollectConsent] = useState(() => {
    const stored = localStorage.getItem("alderos_collect_consent");
    return stored !== "false";
  });
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const toggleConsent = () => {
    const newVal = !collectConsent;
    setCollectConsent(newVal);
    localStorage.setItem("alderos_collect_consent", String(newVal));
  };

  const askQuestion = async (q: string) => {
    if (!q.trim()) return;
    setCurrentQuestion(q);
    setQuestion("");
    setAnswerData(null);
    setError(null);
    setIsLoading(true);
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const resp = await fetch(`${supabaseUrl}/functions/v1/explore`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ question: q, language: lang, consent: collectConsent, session_id: EXPLORE_SESSION_ID }),
      });

      if (resp.status === 429) {
        setError(t("error_rate_limit"));
        return;
      }
      if (!resp.ok) {
        setError(t("error_generic"));
        return;
      }

      const data = await resp.json();
      setAnswerData(data);
    } catch {
      setError(t("error_connection"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    askQuestion(question);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askQuestion(question);
    }
  };

  const handleBack = () => {
    setAnswerData(null);
    setCurrentQuestion("");
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showingAnswer = !!answerData || isLoading || !!error;

  return (
    <main className="bg-background min-h-screen flex flex-col">
      <div className="flex-1">
        <LanguageSelector />

        <AnimatePresence mode="wait">
          {!showingAnswer ? (
            <motion.section
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center"
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-2xl w-full"
              >
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-semibold tracking-tight text-foreground mb-4 leading-[1.15]">
                  {t("explore_title")}
                </h1>
                <p className="text-lg text-muted-foreground font-body mb-10 max-w-lg mx-auto leading-relaxed">
                  {t("explore_subtitle")}
                </p>

                <form onSubmit={handleSubmit} className="relative max-w-xl mx-auto">
                  <textarea
                    ref={inputRef}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t("explore_placeholder")}
                    rows={3}
                    className="w-full px-5 py-4 pr-14 rounded-2xl border border-border bg-card text-foreground font-body
                               placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30
                               focus:border-accent/40 transition-all resize-none"
                  />
                  <button
                    type="submit"
                    disabled={!question.trim()}
                    className="absolute right-3 bottom-3 p-2.5 rounded-xl bg-accent text-accent-foreground
                               hover:opacity-90 transition-opacity disabled:opacity-30"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                {/* Suggested questions */}
                <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-xl mx-auto">
                  {[t("suggested_q1"), t("suggested_q2"), t("suggested_q3")].map((q, i) => (
                    <button
                      key={i}
                      onClick={() => askQuestion(q)}
                      className="px-4 py-2 text-sm font-body text-foreground/70 bg-card border border-border
                                 rounded-full hover:border-accent/40 hover:text-foreground transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground/50 font-body">
                  <span>{collectConsent ? t("consent_notice") : t("consent_opted_out")}</span>
                  <button
                    onClick={toggleConsent}
                    className="underline hover:text-muted-foreground transition-colors"
                  >
                    {collectConsent ? t("consent_opt_out") : t("consent_opt_in")}
                  </button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground/50 font-body">
                  {t("explore_hint")}
                </p>
              </motion.div>
            </motion.section>
          ) : (
            <motion.section
              key="answer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="px-6 py-12 md:py-16"
            >
              <div className="max-w-2xl mx-auto">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 font-body"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t("explore_new_question")}
                </button>

                {/* The question */}
                <div className="mb-8">
                  <p className="text-xs tracking-[0.2em] uppercase text-accent font-body mb-3">
                    {t("explore_your_question")}
                  </p>
                  <blockquote className="text-lg md:text-xl font-heading italic text-foreground/80 leading-relaxed">
                    "{currentQuestion}"
                  </blockquote>
                </div>

                {/* Loading */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 py-12 justify-center"
                  >
                    <Loader2 className="w-5 h-5 text-accent animate-spin" />
                    <span className="text-sm text-muted-foreground font-body">{t("explore_loading")}</span>
                  </motion.div>
                )}

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <p className="text-sm text-destructive font-body mb-4">{error}</p>
                    <button
                      onClick={() => askQuestion(currentQuestion)}
                      className="text-sm font-body text-accent hover:underline"
                    >
                      {t("try_again")}
                    </button>
                  </motion.div>
                )}

                {/* Answer */}
                {answerData && (
                  <ExploreAnswer
                    answer={answerData.answer}
                    sources={answerData.sources}
                    followUpQuestions={answerData.follow_up_questions}
                    onFollowUp={(q) => askQuestion(q)}
                  />
                )}

                {/* Ask another question inline */}
                {answerData && (
                  <div className="mt-10 pt-8 border-t border-border">
                    <form onSubmit={handleSubmit} className="relative">
                      <textarea
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t("explore_ask_another")}
                        rows={2}
                        className="w-full px-5 py-4 pr-14 rounded-2xl border border-border bg-card text-foreground font-body
                                   placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30
                                   focus:border-accent/40 transition-all resize-none"
                      />
                      <button
                        type="submit"
                        disabled={!question.trim()}
                        className="absolute right-3 bottom-3 p-2.5 rounded-xl bg-accent text-accent-foreground
                                   hover:opacity-90 transition-opacity disabled:opacity-30"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </main>
  );
};

export default Explore;

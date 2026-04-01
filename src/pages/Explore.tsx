import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowLeft, Sparkles, ArrowDown, Search, BookOpen, FileText, CheckCircle2, MessageSquare } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import ExploreAnswer from "@/components/ExploreAnswer";
import ExploreFeedback from "@/components/ExploreFeedback";
import Footer from "@/components/Footer";
import LiveCounter from "@/components/LiveCounter";

const EXPLORE_SESSION_ID = crypto.randomUUID();

const LOADING_STEPS = [
  { key: "loading_step_1", icon: Search, delay: 0 },
  { key: "loading_step_2", icon: BookOpen, delay: 2000 },
  { key: "loading_step_3", icon: FileText, delay: 5000 },
  { key: "loading_step_4", icon: CheckCircle2, delay: 8000 },
] as const;

const TypeWriter = ({ text, className }: { text: string; className: string }) => {
  const [displayed, setDisplayed] = useState("");
  
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <span className={className}>
      {displayed}
      {displayed.length < text.length && (
        <span className="inline-block w-[2px] h-[1em] bg-accent/60 ml-0.5 animate-pulse align-middle" />
      )}
    </span>
  );
};

const LoadingSteps = ({ t }: { t: (key: string) => string }) => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timers = LOADING_STEPS.slice(1).map((step, i) =>
      setTimeout(() => setActiveStep(i + 1), step.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="py-12 flex flex-col items-center gap-6"
    >
      <div className="w-full max-w-sm space-y-3">
        {LOADING_STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = i === activeStep;
          const isDone = i < activeStep;
          const isHidden = i > activeStep;

          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: isHidden ? 0 : 1, x: isHidden ? -10 : 0 }}
              transition={{ duration: 0.4 }}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                isActive
                  ? "bg-accent/[0.06] border border-accent/20"
                  : isDone
                  ? "border border-transparent"
                  : ""
              }`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                isActive ? "bg-accent/15 text-accent" : isDone ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground/40"
              }`}>
                {isDone ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                    <CheckCircle2 className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <Icon className={`w-4 h-4 ${isActive ? "animate-pulse" : ""}`} />
                )}
              </div>
              {isActive ? (
                <TypeWriter
                  text={t(step.key)}
                  className="text-sm font-body text-foreground font-medium"
                />
              ) : (
                <span className={`text-sm font-body transition-colors duration-300 ${
                  isDone ? "text-muted-foreground line-through decoration-muted-foreground/30" : "text-muted-foreground/40"
                }`}>
                  {isDone ? t(step.key) : ""}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="w-full max-w-sm h-1.5 bg-muted rounded-full overflow-hidden relative">
        <motion.div
          className="h-full rounded-full relative overflow-hidden bg-accent/50"
          initial={{ width: "0%" }}
          animate={{ width: activeStep >= 3 ? "95%" : `${(activeStep + 1) * 25}%` }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.5s_infinite] -translate-x-full" 
               style={{ animation: "shimmer 1.5s infinite" }} />
        </motion.div>
      </div>
    </motion.div>
  );
};

interface AnswerData {
  answer: string;
  sources: { title: string; description: string; url?: string | null }[];
  follow_up_questions: string[];
}

interface ConversationTurn {
  question: string;
  answer: AnswerData | null;
  isLoading: boolean;
  error: string | null;
}

const Explore = () => {
  const { t, lang } = useLanguage();
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [collectConsent, setCollectConsent] = useState(() => {
    const stored = localStorage.getItem("alderos_collect_consent");
    return stored !== "false";
  });
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const toggleConsent = () => {
    const newVal = !collectConsent;
    setCollectConsent(newVal);
    localStorage.setItem("alderos_collect_consent", String(newVal));
  };

  // Build history from conversation for the API
  const buildHistory = () => {
    const history: { role: string; content: string }[] = [];
    for (const turn of conversation) {
      history.push({ role: "user", content: turn.question });
      if (turn.answer) {
        history.push({ role: "assistant", content: turn.answer.answer });
      }
    }
    return history;
  };

  const askQuestion = async (q: string) => {
    if (!q.trim() || isLoading) return;
    const trimmedQ = q.trim();
    setQuestion("");
    setIsLoading(true);

    const newTurn: ConversationTurn = { question: trimmedQ, answer: null, isLoading: true, error: null };
    setConversation(prev => [...prev, newTurn]);

    // Scroll to bottom after adding new turn
    setTimeout(() => threadEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const history = buildHistory();
      const resp = await fetch(`${supabaseUrl}/functions/v1/explore`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ question: trimmedQ, language: lang, consent: collectConsent, session_id: EXPLORE_SESSION_ID, history }),
      });

      if (resp.status === 429) {
        setConversation(prev => prev.map((turn, i) =>
          i === prev.length - 1 ? { ...turn, isLoading: false, error: t("error_rate_limit") } : turn
        ));
        return;
      }
      if (!resp.ok) {
        setConversation(prev => prev.map((turn, i) =>
          i === prev.length - 1 ? { ...turn, isLoading: false, error: t("error_generic") } : turn
        ));
        return;
      }

      const data = await resp.json();
      setConversation(prev => prev.map((turn, i) =>
        i === prev.length - 1 ? { ...turn, isLoading: false, answer: data } : turn
      ));
    } catch {
      setConversation(prev => prev.map((turn, i) =>
        i === prev.length - 1 ? { ...turn, isLoading: false, error: t("error_connection") } : turn
      ));
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
      }, 200);
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

  const handleNewConversation = () => {
    setConversation([]);
    setQuestion("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const inConversation = conversation.length > 0;

  return (
    <main className="bg-background min-h-screen flex flex-col">
      <div className="flex-1">
        <LanguageSelector />

        <AnimatePresence mode="wait">
          {!inConversation ? (
            <motion.section
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-[100vh] flex flex-col"
            >
              <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="max-w-2xl w-full"
                >
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-semibold tracking-tight text-foreground mb-4 leading-[1.15]">
                    {t("explore_title")}
                  </h1>
                  <p className="text-lg text-muted-foreground font-body mb-6 max-w-lg mx-auto leading-relaxed">
                    {t("explore_subtitle")}
                  </p>

                  <div className="mb-6 flex justify-center">
                    <LiveCounter />
                  </div>

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

                  <div className="mt-5 flex flex-wrap gap-2 justify-center max-w-xl mx-auto">
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
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="pt-12 pb-6 flex justify-center"
              >
                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex flex-col items-center gap-2 cursor-pointer"
                  onClick={() => document.getElementById("coach-cta")?.scrollIntoView({ behavior: "smooth" })}
                >
                  <span className="text-sm font-body text-muted-foreground/60 tracking-widest uppercase">
                    {t("explore_scroll_more")}
                  </span>
                  <ArrowDown className="w-5 h-5 text-muted-foreground/50" />
                </motion.div>
              </motion.div>

              <section id="coach-cta" className="px-6 py-8 md:py-12 flex flex-col items-center text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.7 }}
                  className="max-w-lg"
                >
                  <p className="text-base text-muted-foreground font-body mb-5 leading-relaxed">
                    {t("explore_coach_intro")}
                  </p>
                  <a
                    href="/coach"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-accent/30 bg-accent/[0.05]
                               text-foreground font-body text-sm hover:border-accent/60 hover:bg-accent/[0.1]
                               transition-all duration-300"
                  >
                    <Sparkles className="w-4 h-4 text-accent" />
                    {t("explore_coach_cta")}
                  </a>
                </motion.div>
              </section>
            </motion.section>
          ) : (
            <motion.section
              key="conversation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="px-6 py-12 md:py-16"
            >
              <div className="max-w-2xl mx-auto">
                <button
                  onClick={handleNewConversation}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 font-body"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t("explore_new_question")}
                </button>

                {/* Conversation thread */}
                <div className="space-y-10">
                  {conversation.map((turn, idx) => (
                    <div key={idx} className="space-y-6">
                      {/* Question */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center mt-0.5">
                            <MessageSquare className="w-3.5 h-3.5 text-accent" />
                          </div>
                          <div>
                            <p className="text-xs tracking-[0.2em] uppercase text-accent font-body mb-2">
                              {idx === 0 ? t("explore_your_question") : t("explore_followup_label")}
                            </p>
                            <blockquote className="text-lg md:text-xl font-heading italic text-foreground/80 leading-relaxed">
                              "{turn.question}"
                            </blockquote>
                          </div>
                        </div>
                      </motion.div>

                      {/* Loading */}
                      {turn.isLoading && <LoadingSteps t={t} />}

                      {/* Error */}
                      {turn.error && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center py-8"
                        >
                          <p className="text-sm text-destructive font-body mb-4">{turn.error}</p>
                          <button
                            onClick={() => askQuestion(turn.question)}
                            className="text-sm font-body text-accent hover:underline"
                          >
                            {t("try_again")}
                          </button>
                        </motion.div>
                      )}

                      {/* Answer */}
                      {turn.answer && (
                        <>
                          <ExploreAnswer
                            answer={turn.answer.answer}
                            sources={turn.answer.sources}
                            followUpQuestions={idx === conversation.length - 1 ? turn.answer.follow_up_questions : []}
                            onFollowUp={(q) => askQuestion(q)}
                          />
                          {idx === conversation.length - 1 && (
                            <ExploreFeedback
                              question={turn.question}
                              sessionId={EXPLORE_SESSION_ID}
                            />
                          )}
                        </>
                      )}

                      {/* Separator between turns */}
                      {idx < conversation.length - 1 && turn.answer && (
                        <div className="border-t border-border pt-2" />
                      )}
                    </div>
                  ))}
                </div>

                <div ref={threadEndRef} />

                {/* Input for follow-up */}
                {conversation.length > 0 && conversation[conversation.length - 1].answer && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-10 pt-8 border-t border-border"
                  >
                    <form onSubmit={handleSubmit} className="relative">
                      <textarea
                        ref={inputRef}
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t("explore_continue_conversation")}
                        rows={2}
                        className="w-full px-5 py-4 pr-14 rounded-2xl border border-border bg-card text-foreground font-body
                                   placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30
                                   focus:border-accent/40 transition-all resize-none"
                      />
                      <button
                        type="submit"
                        disabled={!question.trim() || isLoading}
                        className="absolute right-3 bottom-3 p-2.5 rounded-xl bg-accent text-accent-foreground
                                   hover:opacity-90 transition-opacity disabled:opacity-30"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </motion.div>
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

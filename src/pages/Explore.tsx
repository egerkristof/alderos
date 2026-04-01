import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, RotateCcw, Sparkles, ArrowDown, Search, BookOpen, FileText, CheckCircle2, ExternalLink, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import ExploreAnswer, { getVerifiedSources } from "@/components/ExploreAnswer";
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-6 flex flex-col items-center gap-4">
      <div className="w-full max-w-xs space-y-2.5">
        {LOADING_STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = i === activeStep;
          const isDone = i < activeStep;
          const isHidden = i > activeStep;
          return (
            <motion.div key={step.key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: isHidden ? 0 : 1, x: isHidden ? -10 : 0 }} transition={{ duration: 0.4 }}
              className={`flex items-center gap-3 p-2.5 rounded-lg transition-all duration-300 ${isActive ? "bg-accent/[0.06] border border-accent/20" : isDone ? "border border-transparent" : ""}`}>
              <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-300 ${isActive ? "bg-accent/15 text-accent" : isDone ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground/40"}`}>
                {isDone ? (<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}><CheckCircle2 className="w-3.5 h-3.5" /></motion.div>) : (<Icon className={`w-3.5 h-3.5 ${isActive ? "animate-pulse" : ""}`} />)}
              </div>
              {isActive ? (<TypeWriter text={t(step.key)} className="text-xs font-body text-foreground font-medium" />) : (
                <span className={`text-xs font-body transition-colors duration-300 ${isDone ? "text-muted-foreground line-through decoration-muted-foreground/30" : "text-muted-foreground/40"}`}>{isDone ? t(step.key) : ""}</span>
              )}
            </motion.div>
          );
        })}
      </div>
      <div className="w-full max-w-xs h-1 bg-muted rounded-full overflow-hidden relative">
        <motion.div className="h-full rounded-full relative overflow-hidden bg-accent/50" initial={{ width: "0%" }} animate={{ width: activeStep >= 3 ? "95%" : `${(activeStep + 1) * 25}%` }} transition={{ duration: 1.5, ease: "easeInOut" }}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{ animation: "shimmer 1.5s infinite" }} />
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
  const inlineInputRef = useRef<HTMLTextAreaElement>(null);
  const lastResponseRef = useRef<HTMLDivElement>(null);

  const toggleConsent = () => {
    const newVal = !collectConsent;
    setCollectConsent(newVal);
    localStorage.setItem("alderos_collect_consent", String(newVal));
  };

  const buildHistory = () => {
    const history: { role: string; content: string }[] = [];
    for (const turn of conversation) {
      history.push({ role: "user", content: turn.question });
      if (turn.answer) history.push({ role: "assistant", content: turn.answer.answer });
    }
    return history;
  };

  // Accumulate all verified sources across turns, deduped by URL
  const allSources = useMemo(() => {
    const seen = new Set<string>();
    const accumulated: { title: string; description: string; url: string }[] = [];
    for (const turn of conversation) {
      if (!turn.answer) continue;
      for (const s of getVerifiedSources(turn.answer.sources)) {
        if (!seen.has(s.url)) {
          seen.add(s.url);
          accumulated.push(s);
        }
      }
    }
    return accumulated;
  }, [conversation]);

  const lastTurn = conversation[conversation.length - 1];
  const lastAnswerReady = lastTurn?.answer != null;
  const followUps = lastAnswerReady ? lastTurn.answer!.follow_up_questions : [];

  const askQuestion = async (q: string) => {
    if (!q.trim() || isLoading) return;
    const trimmedQ = q.trim();
    setQuestion("");
    setIsLoading(true);
    const newTurn: ConversationTurn = { question: trimmedQ, answer: null, isLoading: true, error: null };
    setConversation(prev => [...prev, newTurn]);
    setTimeout(() => threadEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const history = buildHistory();
      const resp = await fetch(`${supabaseUrl}/functions/v1/explore`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseKey}` },
        body: JSON.stringify({ question: trimmedQ, language: lang, consent: collectConsent, session_id: EXPLORE_SESSION_ID, history }),
      });
      if (resp.status === 429) {
        setConversation(prev => prev.map((turn, i) => i === prev.length - 1 ? { ...turn, isLoading: false, error: t("error_rate_limit") } : turn));
        return;
      }
      if (!resp.ok) {
        setConversation(prev => prev.map((turn, i) => i === prev.length - 1 ? { ...turn, isLoading: false, error: t("error_generic") } : turn));
        return;
      }
      const data = await resp.json();
      setConversation(prev => prev.map((turn, i) => i === prev.length - 1 ? { ...turn, isLoading: false, answer: data } : turn));
    } catch {
      setConversation(prev => prev.map((turn, i) => i === prev.length - 1 ? { ...turn, isLoading: false, error: t("error_connection") } : turn));
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        lastResponseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        inlineInputRef.current?.focus();
      }, 300);
    }
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); askQuestion(question); };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askQuestion(question); } };
  const handleNewConversation = () => { setConversation([]); setQuestion(""); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const inConversation = conversation.length > 0;

  return (
    <main className="bg-background min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col">
        <LanguageSelector />

        <AnimatePresence mode="wait">
          {!inConversation ? (
            /* ── Landing ── */
            <motion.section key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[100vh] flex flex-col">
              <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-2xl w-full">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-semibold tracking-tight text-foreground mb-4 leading-[1.15]">{t("explore_title")}</h1>
                  <p className="text-lg text-muted-foreground font-body mb-6 max-w-lg mx-auto leading-relaxed">{t("explore_subtitle")}</p>
                  <div className="mb-6 flex justify-center"><LiveCounter /></div>
                  <form onSubmit={handleSubmit} className="relative max-w-xl mx-auto">
                    <textarea ref={inputRef} value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={handleKeyDown} placeholder={t("explore_placeholder")} rows={3}
                      className="w-full px-5 py-4 pr-14 rounded-2xl border border-border bg-card text-foreground font-body placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all resize-none" />
                    <button type="submit" disabled={!question.trim()} className="absolute right-3 bottom-3 p-2.5 rounded-xl bg-accent text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-30"><Send className="w-4 h-4" /></button>
                  </form>
                  <div className="mt-5 flex flex-wrap gap-2 justify-center max-w-xl mx-auto">
                    {[t("suggested_q1"), t("suggested_q2"), t("suggested_q3")].map((q, i) => (
                      <button key={i} onClick={() => askQuestion(q)} className="px-4 py-2 text-sm font-body text-foreground/70 bg-card border border-border rounded-full hover:border-accent/40 hover:text-foreground transition-all">{q}</button>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground/50 font-body">
                    <span>{collectConsent ? t("consent_notice") : t("consent_opted_out")}</span>
                    <button onClick={toggleConsent} className="underline hover:text-muted-foreground transition-colors">{collectConsent ? t("consent_opt_out") : t("consent_opt_in")}</button>
                  </div>
                </motion.div>
              </div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ delay: 1.5, duration: 1 }} className="pt-12 pb-6 flex justify-center">
                <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }} className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => document.getElementById("coach-cta")?.scrollIntoView({ behavior: "smooth" })}>
                  <span className="text-sm font-body text-muted-foreground/60 tracking-widest uppercase">{t("explore_scroll_more")}</span>
                  <ArrowDown className="w-5 h-5 text-muted-foreground/50" />
                </motion.div>
              </motion.div>
              <section id="coach-cta" className="px-6 py-8 md:py-12 flex flex-col items-center text-center">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.7 }} className="max-w-lg">
                  <p className="text-base text-muted-foreground font-body mb-5 leading-relaxed">{t("explore_coach_intro")}</p>
                  <a href="/coach" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-accent/30 bg-accent/[0.05] text-foreground font-body text-sm hover:border-accent/60 hover:bg-accent/[0.1] transition-all duration-300">
                    <Sparkles className="w-4 h-4 text-accent" />{t("explore_coach_cta")}
                  </a>
                </motion.div>
              </section>
            </motion.section>
          ) : (
            /* ── Chat Thread ── */
            <motion.section key="conversation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
              {/* Top bar */}
              <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-6 py-3">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center"><Sparkles className="w-4 h-4 text-accent" /></div>
                    <div>
                      <h2 className="text-sm font-heading font-semibold text-foreground">Alderos</h2>
                      <p className="text-[0.65rem] text-muted-foreground font-body">{conversation.length} {conversation.length === 1 ? "message" : "messages"}</p>
                    </div>
                  </div>
                  <button onClick={handleNewConversation} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body text-muted-foreground hover:text-foreground border border-border hover:border-accent/30 transition-all">
                    <RotateCcw className="w-3 h-3" />{t("explore_new_question")}
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
                  {conversation.map((turn, idx) => (
                    <div key={idx} className="space-y-4">
                      {/* User bubble */}
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="flex justify-end">
                        <div className="max-w-[85%] md:max-w-[75%] px-4 py-3 rounded-2xl rounded-br-md bg-accent text-accent-foreground font-body text-sm leading-relaxed">{turn.question}</div>
                      </motion.div>

                      {/* AI response */}
                      <motion.div ref={idx === conversation.length - 1 ? lastResponseRef : undefined} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center mt-1"><Sparkles className="w-3.5 h-3.5 text-accent" /></div>
                          <div className="flex-1 min-w-0">
                            {turn.isLoading && <LoadingSteps t={t} />}
                            {turn.error && (
                              <div className="py-6 text-center">
                                <p className="text-sm text-destructive font-body mb-3">{turn.error}</p>
                                <button onClick={() => askQuestion(turn.question)} className="text-sm font-body text-accent hover:underline">{t("try_again")}</button>
                              </div>
                            )}
                            {turn.answer && (
                              <div className="rounded-2xl rounded-tl-md bg-card border border-border p-5">
                                <ExploreAnswer answer={turn.answer.answer} sources={turn.answer.sources} />
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  ))}

                  {/* ── After all messages: feedback → input → sources → follow-ups ── */}
                  {lastAnswerReady && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-6">

                      {/* Feedback — prominent banner */}
                      <div className="rounded-xl border border-accent/20 bg-accent/[0.04] p-4">
                        <ExploreFeedback question={lastTurn.question} sessionId={EXPLORE_SESSION_ID} />
                      </div>

                      {/* Continue conversation — inline input */}
                      <div className="pt-2">
                        <p className="text-xs tracking-[0.2em] uppercase text-accent font-body mb-3">{t("explore_continue_conversation")}</p>
                        <form onSubmit={handleSubmit} className="relative">
                          <textarea
                            ref={inlineInputRef}
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={t("explore_ask_another")}
                            rows={2}
                            className="w-full px-5 py-3.5 pr-14 rounded-2xl border border-border bg-card text-foreground font-body text-sm
                                       placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30
                                       focus:border-accent/40 transition-all resize-none"
                          />
                          <button type="submit" disabled={!question.trim() || isLoading}
                            className="absolute right-3 bottom-3 p-2 rounded-xl bg-accent text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-30">
                            <Send className="w-4 h-4" />
                          </button>
                        </form>
                      </div>

                      {/* Follow-up suggestions as quick chips */}
                      {followUps.length > 0 && (
                        <div>
                          <p className="text-xs tracking-[0.2em] uppercase text-accent font-body mb-3">{t("followup_label")}</p>
                          <div className="flex flex-wrap gap-2">
                            {followUps.map((q, i) => (
                              <button key={i} onClick={() => askQuestion(q)}
                                className="group flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-body text-foreground/70
                                           bg-card border border-border hover:border-accent/40 hover:text-foreground hover:bg-accent/[0.03]
                                           transition-all duration-200">
                                <span>{q}</span>
                                <ArrowRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-accent transition-colors flex-shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Accumulated sources */}
                      {allSources.length > 0 && (
                        <div className="pt-4 border-t border-border">
                          <p className="text-xs tracking-[0.2em] uppercase text-accent font-body mb-4">
                            {t("sources_label")} ({allSources.length})
                          </p>
                          <div className="space-y-2.5">
                            {allSources.map((source, i) => (
                              <div key={source.url} className="flex items-start gap-3 text-sm">
                                <span className="text-xs font-body text-accent/70 mt-0.5 flex-shrink-0">[{i + 1}]</span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-body font-medium text-foreground/80">
                                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors inline-flex items-center gap-1">
                                      {source.title}<ExternalLink className="w-3 h-3 flex-shrink-0" />
                                    </a>
                                  </p>
                                  <p className="text-muted-foreground/70 font-body text-xs mt-0.5">{source.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  <div ref={threadEndRef} />
                </div>
              </div>

              {/* Bottom consent bar */}
              <div className="bg-background border-t border-border px-6 py-2">
                <div className="max-w-2xl mx-auto flex items-center justify-center gap-2 text-[0.65rem] text-muted-foreground/40 font-body">
                  <span>{collectConsent ? t("consent_notice") : t("consent_opted_out")}</span>
                  <button onClick={toggleConsent} className="underline hover:text-muted-foreground transition-colors">{collectConsent ? t("consent_opt_out") : t("consent_opt_in")}</button>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
      {!inConversation && <Footer />}
    </main>
  );
};

export default Explore;

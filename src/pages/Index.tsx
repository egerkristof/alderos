import { useState, useRef, useCallback } from "react";
import HeroSection from "@/components/HeroSection";
import MethodologySection from "@/components/MethodologySection";
import LiveDemoSection from "@/components/LiveDemoSection";
import ChallengeSelector from "@/components/ChallengeSelector";
import ModeChooser from "@/components/ModeChooser";
import ReframingExperience from "@/components/ReframingExperience";
import TrainingMode from "@/components/TrainingMode";
import Footer from "@/components/Footer";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useLayoutEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type AppState = "home" | "select" | "choose-mode" | "reframe" | "training";

// Generate a stable session ID per browser tab
const SESSION_ID = crypto.randomUUID();

const Index = () => {
  const { lang, t } = useLanguage();
  const [state, setState] = useState<AppState>("home");
  const [challenge, setChallenge] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [collectConsent, setCollectConsent] = useState(() => {
    const stored = localStorage.getItem("alderos_collect_consent");
    return stored !== "false";
  });
  const demoRef = useRef<HTMLDivElement>(null);

  // Scroll to top on every state change (except "home" initial load)
  useLayoutEffect(() => {
    if (state !== "home") {
      window.scrollTo(0, 0);
    }
  }, [state]);

  const handleBegin = () => {
    demoRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleTryChallenge = (text: string, id?: string) => {
    if (text === "") {
      setState("select");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setChallenge(text);
    setChallengeId(id || null);
    setIsCustom(!id);
    setState("choose-mode");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelect = (text: string, id?: string) => {
    setChallenge(text);
    setChallengeId(id || null);
    setIsCustom(!id);
    setState("choose-mode");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleConsent = () => {
    const newVal = !collectConsent;
    setCollectConsent(newVal);
    localStorage.setItem("alderos_collect_consent", String(newVal));
  };

  const handleModeChoice = (mode: "ai" | "training") => {
    setState(mode === "ai" ? "reframe" : "training");
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Track usage event only if user consented
    if (collectConsent) {
      supabase.from("usage_events").insert({
        event_type: isCustom ? "custom" : "preselected",
        challenge_id: challengeId,
        challenge_text: challenge,
        language: lang,
        mode,
        session_id: SESSION_ID,
      } as any).then(() => {});
    }
  };

  const handleBack = () => {
    setState("home");
    setChallenge("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="bg-background min-h-screen flex flex-col">
      <div className="flex-1">
        {state === "home" && (
          <>
            <LanguageSelector />
            <HeroSection onBegin={handleBegin} />
            <div ref={demoRef}>
              <LiveDemoSection onTryChallenge={handleTryChallenge} />
            </div>
            <MethodologySection />
          </>
        )}

        {state === "select" && (
          <ChallengeSelector onSelect={handleSelect} />
        )}

        {state === "choose-mode" && (
          <section className="min-h-[70vh] flex flex-col items-center px-6 py-16 md:py-24">
            <div className="max-w-3xl w-full">
              <button onClick={handleBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-12 font-body">
                ← {t("back")}
              </button>
              <div className="mb-12 text-center">
                <p className="text-sm tracking-[0.25em] uppercase text-accent mb-4 font-body">{t("concern_label")}</p>
                <blockquote className="text-xl md:text-2xl font-heading italic text-foreground/80 max-w-2xl mx-auto leading-relaxed">"{challenge}"</blockquote>
              </div>
              <ModeChooser onChoose={handleModeChoice} />
              <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground/60 font-body">
                <span>{collectConsent ? t("consent_notice") : t("consent_opted_out")}</span>
                <button
                  onClick={toggleConsent}
                  className="underline hover:text-muted-foreground transition-colors"
                >
                  {collectConsent ? t("consent_opt_out") : t("consent_opt_in")}
                </button>
              </div>
            </div>
          </section>
        )}

        {state === "reframe" && (
          <ReframingExperience
            challenge={challenge}
            onBack={handleBack}
            onNewChallenge={(text) => {
              if (text === "") {
                setState("select");
                window.scrollTo({ top: 0, behavior: "smooth" });
                return;
              }
              setChallenge(text);
              setChallengeId(null);
              setIsCustom(true);
              setState("choose-mode");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        )}

        {state === "training" && (
          <TrainingReframeWrapper challenge={challenge} onBack={handleBack} lang={lang} />
        )}
      </div>
      <Footer />
    </main>
  );
};

const TrainingReframeWrapper = ({ challenge, onBack, lang }: { challenge: string; onBack: () => void; lang: string }) => {
  const { t } = useLanguage();
  const [aiData, setAiData] = useState<{ empathy: string; shared_value: string; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReframing = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const resp = await fetch(`${supabaseUrl}/functions/v1/reframe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseKey}` },
        body: JSON.stringify({ challenge, language: lang }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setAiData({ empathy: data.empathy || "", shared_value: data.shared_value || "", message: data.message || "" });
      }
    } catch { /* training mode still works */ } finally { setIsLoading(false); }
  }, [challenge, lang]);

  useEffect(() => { fetchReframing(); }, [fetchReframing]);

  return (
    <section className="min-h-screen flex flex-col items-center px-6 py-16 md:py-24">
      <div className="max-w-3xl w-full">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-12 font-body">
          ← {t("back_challenges")}
        </button>
        <div className="mb-12 text-center">
          <p className="text-sm tracking-[0.25em] uppercase text-accent mb-4 font-body">{t("training_label")}</p>
          <blockquote className="text-xl md:text-2xl font-heading italic text-foreground/80 max-w-2xl mx-auto leading-relaxed">"{challenge}"</blockquote>
        </div>
        <TrainingMode challenge={challenge} aiPhases={aiData} isAiLoading={isLoading} />
      </div>
    </section>
  );
};

export default Index;

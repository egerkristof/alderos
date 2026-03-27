import { useState, useRef } from "react";
import HeroSection from "@/components/HeroSection";
import MethodologySection from "@/components/MethodologySection";
import ChallengeSelector from "@/components/ChallengeSelector";
import ReframingExperience from "@/components/ReframingExperience";
import TrainingMode from "@/components/TrainingMode";
import Footer from "@/components/Footer";

type AppState = "home" | "select" | "reframe" | "training-select" | "training";

const Index = () => {
  const [state, setState] = useState<AppState>("home");
  const [challenge, setChallenge] = useState("");
  const selectorRef = useRef<HTMLDivElement>(null);

  const handleBegin = () => {
    setState("select");
    setTimeout(() => {
      selectorRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleTrainingBegin = () => {
    setState("training-select");
    setTimeout(() => {
      selectorRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSelect = (text: string) => {
    setChallenge(text);
    setState(state === "training-select" ? "training" : "reframe");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setState("select");
    setChallenge("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="bg-background min-h-screen">
      {state === "home" && (
        <>
          <HeroSection onBegin={handleBegin} onTraining={handleTrainingBegin} />
          <MethodologySection />
          <Footer />
        </>
      )}
      {(state === "select" || state === "training-select") && (
        <div ref={selectorRef}>
          <ChallengeSelector
            onSelect={handleSelect}
            trainingMode={state === "training-select"}
          />
        </div>
      )}
      {state === "reframe" && (
        <>
          <ReframingExperience challenge={challenge} onBack={handleBack} />
          <Footer />
        </>
      )}
      {state === "training" && (
        <>
          <TrainingReframeWrapper challenge={challenge} onBack={handleBack} />
          <Footer />
        </>
      )}
    </main>
  );
};

// Wrapper that fetches AI data and passes to training mode
import { useState as useStateImport, useEffect, useCallback } from "react";

const TrainingReframeWrapper = ({ challenge, onBack }: { challenge: string; onBack: () => void }) => {
  const [aiData, setAiData] = useStateImport<{ empathy: string; shared_value: string; message: string } | null>(null);
  const [isLoading, setIsLoading] = useStateImport(true);

  const fetchReframing = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const resp = await fetch(`${supabaseUrl}/functions/v1/reframe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ challenge }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setAiData({ empathy: data.empathy || "", shared_value: data.shared_value || "", message: data.message || "" });
      }
    } catch {
      // silently fail — training mode still works
    } finally {
      setIsLoading(false);
    }
  }, [challenge]);

  useEffect(() => {
    fetchReframing();
  }, [fetchReframing]);

  return (
    <section className="min-h-screen flex flex-col items-center px-6 py-16 md:py-24">
      <div className="max-w-3xl w-full">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground
                     transition-colors mb-12 font-body"
        >
          <span className="w-4 h-4">←</span>
          Back to challenges
        </button>

        <div className="mb-12 text-center">
          <p className="text-sm tracking-[0.25em] uppercase text-accent mb-4 font-body">
            Training Mode
          </p>
          <blockquote className="text-xl md:text-2xl font-heading italic text-foreground/80 max-w-2xl mx-auto leading-relaxed">
            "{challenge}"
          </blockquote>
        </div>

        <TrainingMode challenge={challenge} aiPhases={aiData} isAiLoading={isLoading} />
      </div>
    </section>
  );
};

export default Index;

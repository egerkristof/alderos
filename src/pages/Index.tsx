import { useState, useRef } from "react";
import HeroSection from "@/components/HeroSection";
import ChallengeSelector from "@/components/ChallengeSelector";
import ReframingExperience from "@/components/ReframingExperience";

type AppState = "hero" | "select" | "reframe";

const Index = () => {
  const [state, setState] = useState<AppState>("hero");
  const [challenge, setChallenge] = useState("");
  const selectorRef = useRef<HTMLDivElement>(null);

  const handleBegin = () => {
    setState("select");
    setTimeout(() => {
      selectorRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSelect = (text: string) => {
    setChallenge(text);
    setState("reframe");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setState("select");
    setChallenge("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="bg-background min-h-screen">
      {state === "hero" && <HeroSection onBegin={handleBegin} />}
      {state === "select" && (
        <div ref={selectorRef}>
          <ChallengeSelector onSelect={handleSelect} />
        </div>
      )}
      {state === "reframe" && (
        <ReframingExperience challenge={challenge} onBack={handleBack} />
      )}
    </main>
  );
};

export default Index;

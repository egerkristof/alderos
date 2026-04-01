import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp, ThumbsDown, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

interface ExploreFeedbackProps {
  question: string;
  sessionId: string;
}

const ExploreFeedback = ({ question, sessionId }: ExploreFeedbackProps) => {
  const { t, lang } = useLanguage();
  const [rating, setRating] = useState<"up" | "down" | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleRate = async (value: "up" | "down") => {
    setRating(value);

    if (value === "down") {
      setShowFeedback(true);
    } else {
      await saveFeedback(value, "");
      toast.success(t("feedback_thanks"));
      setSubmitted(true);
    }
  };

  const saveFeedback = async (r: "up" | "down", text: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      await fetch(`${supabaseUrl}/functions/v1/submit-feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          question,
          rating: r,
          feedback_text: text || null,
          language: lang,
        }),
      });
    } catch (err) {
      console.error("Failed to save feedback:", err);
    }
  };

  const handleSendFeedback = async () => {
    await saveFeedback("down", feedback);
    setShowFeedback(false);
    setSubmitted(true);
    toast.success(t("feedback_improve"));
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center mt-6"
      >
        <p className="text-xs text-muted-foreground/60 font-body">{t("feedback_thanks")}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="mt-8 flex flex-col items-center gap-3"
    >
      <p className="text-xs text-muted-foreground font-body">{t("explore_rate_question")}</p>
      <div className="flex gap-2">
        <button
          onClick={() => handleRate("up")}
          className={`p-2.5 rounded-full border transition-all ${
            rating === "up"
              ? "border-accent bg-accent/10 text-accent"
              : "border-border text-muted-foreground hover:border-accent/30"
          }`}
        >
          <ThumbsUp className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleRate("down")}
          className={`p-2.5 rounded-full border transition-all ${
            rating === "down"
              ? "border-accent bg-accent/10 text-accent"
              : "border-border text-muted-foreground hover:border-accent/30"
          }`}
        >
          <ThumbsDown className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full max-w-md overflow-hidden"
          >
            <div className="pt-3">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={t("feedback_placeholder")}
                className="w-full h-20 px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground/50 resize-none font-body text-xs focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleSendFeedback}
                  disabled={!feedback.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-full font-body text-xs disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  <Send className="w-3 h-3" /> {t("send_feedback")}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ExploreFeedback;

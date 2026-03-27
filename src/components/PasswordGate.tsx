import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, ArrowRight, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface PasswordGateProps {
  onAuthenticated: () => void;
}

const PasswordGate = ({ onAuthenticated }: PasswordGateProps) => {
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsLoading(true);
    setError(false);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const resp = await fetch(`${supabaseUrl}/functions/v1/verify-coach-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ password }),
      });

      const data = await resp.json();
      if (data.valid) {
        sessionStorage.setItem("alderos_coach_auth", "true");
        onAuthenticated();
      } else {
        setError(true);
        setPassword("");
      }
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="bg-background min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-sm w-full text-center"
      >
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Lock className="w-6 h-6 text-primary" />
        </div>

        <h1 className="text-2xl font-heading font-semibold text-foreground mb-2">
          {t("coach_gate_title")}
        </h1>
        <p className="text-sm text-muted-foreground font-body mb-8">
          {t("coach_gate_body")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            placeholder={t("coach_gate_placeholder")}
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground font-body
                       placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30
                       transition-all"
            autoFocus
          />

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-destructive font-body"
            >
              {t("coach_gate_error")}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={isLoading || !password.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                       bg-primary text-primary-foreground font-body text-sm
                       hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {t("coach_gate_enter")}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </main>
  );
};

export default PasswordGate;

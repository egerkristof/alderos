import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { Users } from "lucide-react";

interface LiveCounterProps {
  label?: string;
}

const LiveCounter = ({ label }: LiveCounterProps) => {
  const { t } = useLanguage();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      const { data, error } = await supabase.rpc("get_usage_count");
      if (!error && data !== null) setCount(Number(data));
    };

    fetchCount();

    // Poll every 30s instead of realtime (removed from publication for security)
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  if (count === null) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/50 backdrop-blur-sm"
      >
        <Users className="w-3.5 h-3.5 text-accent" />
        <span className="text-sm font-body text-muted-foreground">
          <motion.span
            key={count}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block font-semibold text-foreground tabular-nums"
          >
            {count.toLocaleString()}
          </motion.span>
          {" "}
          {label || t("counter_interactions")}
        </span>
      </motion.div>
    </AnimatePresence>
  );
};

export default LiveCounter;

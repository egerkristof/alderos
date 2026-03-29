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
      const { count: total } = await supabase
        .from("usage_events")
        .select("*", { count: "exact", head: true });
      if (total !== null) setCount(total);
    };

    fetchCount();

    const channel = supabase
      .channel("live-counter")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "usage_events" },
        () => {
          setCount((prev) => (prev !== null ? prev + 1 : prev));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

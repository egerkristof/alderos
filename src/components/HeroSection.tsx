import { motion } from "framer-motion";

const HeroSection = ({ onBegin }: { onBegin: () => void }) => {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      {/* Subtle decorative element */}
      <motion.div
        className="absolute top-20 right-20 w-64 h-64 rounded-full opacity-[0.04]"
        style={{ background: "hsl(var(--terracotta))" }}
        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-32 left-16 w-48 h-48 rounded-full opacity-[0.03]"
        style={{ background: "hsl(var(--olive-deep))" }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="max-w-2xl relative z-10"
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-8 font-body"
        >
          A bridge between questions and understanding
        </motion.p>

        <h1 className="text-6xl md:text-7xl lg:text-8xl font-heading font-semibold tracking-tight text-foreground mb-6">
          Alderos
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="text-xl md:text-2xl font-heading italic text-muted-foreground mb-4 leading-relaxed"
        >
          Every question deserves a thoughtful answer.
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="text-base text-muted-foreground/80 mb-12 max-w-lg mx-auto leading-relaxed font-body"
        >
          Explore the questions people ask about Opus Dei — and discover
          the shared values that connect us all.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={onBegin}
          className="px-10 py-4 bg-primary text-primary-foreground rounded-full font-body text-sm tracking-wide
                     hover:opacity-90 transition-opacity shadow-lg shadow-primary/10"
        >
          Begin the conversation
        </motion.button>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-12"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-5 h-8 border-2 border-muted-foreground/30 rounded-full flex justify-center pt-1.5"
        >
          <div className="w-1 h-2 bg-muted-foreground/40 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;

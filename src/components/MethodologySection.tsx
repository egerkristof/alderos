import { motion } from "framer-motion";
import { Heart, Handshake, Lightbulb } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const MethodologySection = () => {
  const { t } = useLanguage();

  const steps = [
    { icon: <Heart className="w-6 h-6" />, titleKey: "step1_title" as const, subtitleKey: "step1_subtitle" as const, descKey: "step1_desc" as const },
    { icon: <Handshake className="w-6 h-6" />, titleKey: "step2_title" as const, subtitleKey: "step2_subtitle" as const, descKey: "step2_desc" as const },
    { icon: <Lightbulb className="w-6 h-6" />, titleKey: "step3_title" as const, subtitleKey: "step3_subtitle" as const, descKey: "step3_desc" as const },
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-sm tracking-[0.25em] uppercase text-accent mb-4 font-body">
            {t("methodology_label")}
          </p>
          <h2 className="text-3xl md:text-4xl font-heading font-semibold text-foreground mb-4">
            {t("methodology_title")}
          </h2>
          <p className="text-muted-foreground font-body max-w-lg mx-auto">
            {t("methodology_body")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.titleKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              className="phase-card text-center"
            >
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center text-accent mx-auto mb-5">
                {step.icon}
              </div>
              <p className="text-xs tracking-[0.2em] uppercase text-accent font-body mb-1">
                {t("training_step")} {i + 1}
              </p>
              <h3 className="text-xl font-heading font-semibold text-foreground mb-1">
                {t(step.titleKey)}
              </h3>
              <p className="text-sm text-muted-foreground font-body italic mb-3">
                {t(step.subtitleKey)}
              </p>
              <p className="text-sm text-foreground/75 font-body leading-relaxed">
                {t(step.descKey)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MethodologySection;

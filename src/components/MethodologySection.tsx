import { motion } from "framer-motion";
import { Heart, Handshake, Lightbulb } from "lucide-react";

const steps = [
  {
    icon: <Heart className="w-6 h-6" />,
    title: "Acknowledge",
    subtitle: "Frame the concern",
    description:
      "We begin by truly hearing the concern — not dismissing it, but acknowledging the real feelings behind it.",
  },
  {
    icon: <Handshake className="w-6 h-6" />,
    title: "Connect",
    subtitle: "Find shared values",
    description:
      "We identify the values we share with the person asking — dignity, freedom, transparency, care for others.",
  },
  {
    icon: <Lightbulb className="w-6 h-6" />,
    title: "Illuminate",
    subtitle: "A truth-based message",
    description:
      "From that common ground, we offer a truthful, positive perspective that reframes the conversation.",
  },
];

const MethodologySection = () => {
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
            The approach
          </p>
          <h2 className="text-3xl md:text-4xl font-heading font-semibold text-foreground mb-4">
            How Alderos works
          </h2>
          <p className="text-muted-foreground font-body max-w-lg mx-auto">
            Built on the Catholic Voices reframing methodology — a proven
            approach to transforming difficult conversations into bridges of
            understanding.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
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
                Step {i + 1}
              </p>
              <h3 className="text-xl font-heading font-semibold text-foreground mb-1">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground font-body italic mb-3">
                {step.subtitle}
              </p>
              <p className="text-sm text-foreground/75 font-body leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MethodologySection;

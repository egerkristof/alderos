import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border py-16 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-sm font-body text-muted-foreground mb-3">
          Inspired by the work of{" "}
          <a
            href="https://www.catholicvoices.org.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground font-medium underline underline-offset-2 decoration-accent/40 hover:decoration-accent transition-colors"
          >
            Catholic Voices
          </a>
        </p>
        <p className="text-xs font-body text-muted-foreground/70 max-w-lg mx-auto leading-relaxed mb-6">
          {t("footer_body")}
        </p>
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs font-body text-muted-foreground/60">
            A project by{" "}
            <a
              href="https://www.linkedin.com/in/kristofeger/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/70 font-medium hover:text-accent transition-colors underline underline-offset-2 decoration-accent/30 hover:decoration-accent"
            >
              Kristof Eger
            </a>
          </p>
          <a
            href="mailto:kristof.eger@lizaos.ai"
            className="text-xs font-body text-accent hover:text-accent/80 transition-colors"
          >
            kristof.eger@lizaos.ai
          </a>
          <a
            href="/admin/login"
            className="text-xs font-body text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors mt-4"
          >
            Admin
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

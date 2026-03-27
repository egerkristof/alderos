import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border py-16 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-sm font-body text-muted-foreground mb-3">
          {t("footer_method")}{" "}
          <span className="text-foreground font-medium">{t("footer_method_name")}</span>{" "}
          {t("footer_method_suffix")}
        </p>
        <p className="text-xs font-body text-muted-foreground/70 max-w-lg mx-auto leading-relaxed mb-6">
          {t("footer_body")}
        </p>
        <div className="flex items-center justify-center gap-2">
          <div className="w-1 h-1 rounded-full bg-accent/40" />
          <p className="text-xs font-body text-muted-foreground/50 italic">
            {t("footer_credit")}
          </p>
          <div className="w-1 h-1 rounded-full bg-accent/40" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;

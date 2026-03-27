const Footer = () => {
  return (
    <footer className="border-t border-border py-16 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-sm font-body text-muted-foreground mb-3">
          Built with the{" "}
          <span className="text-foreground font-medium">Catholic Voices</span>{" "}
          reframing methodology
        </p>
        <p className="text-xs font-body text-muted-foreground/70 max-w-lg mx-auto leading-relaxed mb-6">
          Alderos explores how AI and strategic communication can serve the
          mission of building bridges. Designed to show that technology,
          when guided by clear thinking and genuine empathy, becomes a
          powerful tool for understanding.
        </p>
        <div className="flex items-center justify-center gap-2">
          <div className="w-1 h-1 rounded-full bg-accent/40" />
          <p className="text-xs font-body text-muted-foreground/50 italic">
            A project by Christoph — where strategy meets faith meets innovation
          </p>
          <div className="w-1 h-1 rounded-full bg-accent/40" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;

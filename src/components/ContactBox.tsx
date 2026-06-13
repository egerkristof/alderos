import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, ThumbsUp, ThumbsDown, Mail } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Kind = "contact" | "positive" | "negative";

const ContactBox = () => {
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("contact");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setKind("contact");
    setName("");
    setEmail("");
    setMessage("");
    setSent(false);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    setError("");
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/submit-contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          name: name.trim() || null,
          email: email.trim() || null,
          message: message.trim(),
          kind,
          language: lang,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to send");
      }
      setSent(true);
      setTimeout(() => {
        setOpen(false);
        setTimeout(reset, 300);
      }, 1800);
    } catch (err: any) {
      setError(err.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-accent text-accent-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center"
            aria-label={t("contact_open")}
          >
            <MessageSquare className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setTimeout(reset, 300); }}>
        <DialogContent className="sm:max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle className="font-heading text-foreground">{t("contact_title")}</DialogTitle>
            <DialogDescription className="font-body text-muted-foreground">
              {t("contact_desc")}
            </DialogDescription>
          </DialogHeader>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-8 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Send className="w-5 h-5 text-primary" />
              </div>
              <p className="font-heading text-foreground text-lg">{t("contact_sent")}</p>
              <p className="font-body text-muted-foreground text-sm mt-1">{t("contact_sent_body")}</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              {/* Kind selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-body text-muted-foreground uppercase tracking-wider">
                  {t("contact_kind")}
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setKind("contact")}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-body transition-all ${
                      kind === "contact"
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-muted-foreground hover:border-accent/30"
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    {t("contact_kind_contact")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setKind("positive")}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-body transition-all ${
                      kind === "positive"
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-muted-foreground hover:border-accent/30"
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    {t("contact_kind_positive")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setKind("negative")}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-body transition-all ${
                      kind === "negative"
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-muted-foreground hover:border-accent/30"
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4" />
                    {t("contact_kind_negative")}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="contact-name" className="text-xs font-body text-muted-foreground uppercase tracking-wider">
                    {t("contact_name")}
                  </Label>
                  <Input
                    id="contact-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("contact_name_placeholder")}
                    maxLength={120}
                    className="bg-card border-border font-body text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact-email" className="text-xs font-body text-muted-foreground uppercase tracking-wider">
                    {t("contact_email")}
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("contact_email_placeholder")}
                    maxLength={254}
                    className="bg-card border-border font-body text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-message" className="text-xs font-body text-muted-foreground uppercase tracking-wider">
                  {t("contact_message")}
                </Label>
                <Textarea
                  id="contact-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t("contact_message_placeholder")}
                  rows={4}
                  required
                  maxLength={2000}
                  className="bg-card border-border font-body text-sm resize-none"
                />
              </div>

              {error && (
                <p className="text-xs text-destructive font-body">{error}</p>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!message.trim() || sending}
                  className="bg-accent text-accent-foreground hover:bg-accent/90 font-body"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sending ? t("contact_sending") : t("contact_submit")}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ContactBox;

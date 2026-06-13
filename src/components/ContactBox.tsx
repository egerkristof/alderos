import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, X, Send, MessageSquare } from "lucide-react";
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

const ContactBox = () => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const subject = encodeURIComponent(`Alderos contact from ${name || "visitor"}`);
    const body = encodeURIComponent(
      `Name: ${name || "Not provided"}\nEmail: ${email || "Not provided"}\n\nMessage:\n${message}`
    );
    window.open(`mailto:kristof.eger@lizaos.ai?subject=${subject}&body=${body}`, "_blank");

    setSent(true);
    setTimeout(() => {
      setSent(false);
      setName("");
      setEmail("");
      setMessage("");
      setOpen(false);
    }, 2000);
  };

  return (
    <>
      {/* Floating trigger */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-accent text-accent-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center group"
            aria-label={t("contact_open")}
          >
            <Mail className="w-5 h-5 group-hover:hidden" />
            <MessageSquare className="w-5 h-5 hidden group-hover:block" />
          </motion.button>
        )}
      </AnimatePresence>

      <Dialog open={open} onOpenChange={setOpen}>
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
                  className="bg-card border-border font-body text-sm resize-none"
                />
              </div>
              <DialogFooter className="sm:justify-end">
                <Button
                  type="submit"
                  disabled={!message.trim()}
                  className="bg-accent text-accent-foreground hover:bg-accent/90 font-body"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {t("contact_submit")}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

/* DialogFooter isn't exported from dialog.tsx directly, so define inline */
const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className || ""}`} {...props} />
);

export default ContactBox;

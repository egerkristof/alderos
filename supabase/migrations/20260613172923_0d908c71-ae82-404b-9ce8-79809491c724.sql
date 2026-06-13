
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT,
  message TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'contact',
  language TEXT DEFAULT 'en',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read contact messages"
  ON public.contact_messages FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update contact messages"
  ON public.contact_messages FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete contact messages"
  ON public.contact_messages FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_contact_messages_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_contact_messages_updated_at
BEFORE UPDATE ON public.contact_messages
FOR EACH ROW EXECUTE FUNCTION public.update_contact_messages_updated_at();

CREATE INDEX idx_contact_messages_created_at ON public.contact_messages (created_at DESC);
CREATE INDEX idx_contact_messages_is_read ON public.contact_messages (is_read);

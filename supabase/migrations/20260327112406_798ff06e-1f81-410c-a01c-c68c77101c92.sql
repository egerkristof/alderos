-- Table to store editable system prompts
CREATE TABLE public.system_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  prompt_text text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.system_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read prompts"
  ON public.system_prompts FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update prompts"
  ON public.system_prompts FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

-- Table to track usage analytics
CREATE TABLE public.usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  challenge_id text,
  challenge_text text NOT NULL,
  language text DEFAULT 'en',
  mode text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert usage events"
  ON public.usage_events FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read usage events"
  ON public.usage_events FOR SELECT TO authenticated
  USING (true);
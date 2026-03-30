
CREATE TABLE public.explore_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  session_id text,
  question text NOT NULL,
  rating text NOT NULL CHECK (rating IN ('up', 'down')),
  feedback_text text,
  language text DEFAULT 'en'
);

ALTER TABLE public.explore_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert feedback" ON public.explore_feedback
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can read feedback" ON public.explore_feedback
  FOR SELECT TO authenticated USING (true);

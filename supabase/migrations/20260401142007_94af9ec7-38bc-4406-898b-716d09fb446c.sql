-- Remove anonymous INSERT on explore_feedback; edge function uses service role
DROP POLICY "Anyone can insert feedback" ON public.explore_feedback;
CREATE POLICY "Authenticated users can insert feedback" ON public.explore_feedback FOR INSERT TO authenticated WITH CHECK (true);
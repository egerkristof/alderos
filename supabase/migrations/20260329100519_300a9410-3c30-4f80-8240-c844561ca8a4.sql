CREATE POLICY "Anyone can count usage events"
ON public.usage_events
FOR SELECT
TO anon
USING (true);
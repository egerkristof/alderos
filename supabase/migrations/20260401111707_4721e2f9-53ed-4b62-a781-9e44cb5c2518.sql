CREATE OR REPLACE FUNCTION public.get_usage_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT count(*) FROM public.usage_events;
$$;
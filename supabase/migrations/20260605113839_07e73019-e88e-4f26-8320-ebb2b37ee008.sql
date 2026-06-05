-- Revoke EXECUTE on SECURITY DEFINER functions from public (covers all roles)
REVOKE ALL ON FUNCTION public.get_usage_count() FROM public;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM public;

-- Also explicitly revoke from anon and authenticated
REVOKE ALL ON FUNCTION public.get_usage_count() FROM anon;
REVOKE ALL ON FUNCTION public.get_usage_count() FROM authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM authenticated;

-- Grant back to service_role only
GRANT EXECUTE ON FUNCTION public.get_usage_count() TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;
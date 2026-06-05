-- Restore EXECUTE on has_role for authenticated so admin RLS policies work.
-- has_role is a SECURITY DEFINER function used inside RLS policies;
-- authenticated must be able to call it for policy evaluation.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
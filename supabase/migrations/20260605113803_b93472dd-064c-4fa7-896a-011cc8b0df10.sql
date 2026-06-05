-- Fix security scan findings
-- 1. Remove overly permissive INSERT/SELECT policies on usage_events and explore_feedback
-- 2. Add admin-only SELECT policies
-- 3. Revoke EXECUTE on SECURITY DEFINER functions from public/anon/authenticated
-- 4. Add UPDATE policy on user_roles for admins only

-- ============================================
-- usage_events: remove old policies, add admin-only SELECT
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can insert usage events" ON public.usage_events;
DROP POLICY IF EXISTS "Authenticated users can read usage events" ON public.usage_events;

CREATE POLICY "Admins can read usage events"
  ON public.usage_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- explore_feedback: remove old policies, add admin-only SELECT
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can insert feedback" ON public.explore_feedback;
DROP POLICY IF EXISTS "Authenticated users can read feedback" ON public.explore_feedback;

CREATE POLICY "Admins can read feedback"
  ON public.explore_feedback
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- user_roles: add UPDATE policy for admins only
-- ============================================
CREATE POLICY "Only admins can update user_roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- Revoke EXECUTE on SECURITY DEFINER functions from public users
-- ============================================
REVOKE EXECUTE ON FUNCTION public.get_usage_count() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_usage_count() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM authenticated;

-- ============================================
-- Ensure service_role retains all privileges
-- ============================================
GRANT ALL ON public.usage_events TO service_role;
GRANT ALL ON public.explore_feedback TO service_role;
GRANT ALL ON public.user_roles TO service_role;
GRANT ALL ON public.system_prompts TO service_role;
GRANT EXECUTE ON FUNCTION public.get_usage_count() TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;

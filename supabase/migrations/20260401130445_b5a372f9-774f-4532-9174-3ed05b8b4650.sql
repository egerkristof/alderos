
-- Fix 1: Remove anonymous SELECT on usage_events (public counter uses get_usage_count SECURITY DEFINER)
DROP POLICY "Anyone can count usage events" ON public.usage_events;

-- Fix 2: Restrict usage_events anon INSERT to prevent direct writes (edge functions use service role)
DROP POLICY "Anyone can insert usage events" ON public.usage_events;
CREATE POLICY "Authenticated users can insert usage events" ON public.usage_events FOR INSERT TO authenticated WITH CHECK (true);

-- Fix 3: Add explicit admin-only INSERT policy on user_roles to prevent privilege escalation
CREATE POLICY "Only admins can insert user_roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix 4: Add explicit admin-only DELETE policy on user_roles
CREATE POLICY "Only admins can delete user_roles" ON public.user_roles FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

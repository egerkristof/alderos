-- 1. Create app_role enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Create security definer function to check roles (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3. RLS on user_roles: only admins can read, no direct inserts
CREATE POLICY "Admins can read user_roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Drop the overly permissive UPDATE policy on system_prompts
DROP POLICY IF EXISTS "Authenticated users can update prompts" ON public.system_prompts;

-- 5. Create restricted UPDATE policy on system_prompts (admin only)
CREATE POLICY "Admins can update prompts"
  ON public.system_prompts FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Also restrict SELECT on system_prompts to admins (prompts are fetched server-side via service role)
DROP POLICY IF EXISTS "Authenticated users can read prompts" ON public.system_prompts;

CREATE POLICY "Admins can read prompts"
  ON public.system_prompts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 7. Seed the admin role for the existing admin user by email
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'kristof.eger@me.com'
ON CONFLICT DO NOTHING;

-- 8. Add validation trigger on usage_events for input constraints
CREATE OR REPLACE FUNCTION public.validate_usage_event()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate event_type
  IF NEW.event_type NOT IN ('preselected', 'custom', 'ai-generated', 'withheld', 'explore') THEN
    RAISE EXCEPTION 'Invalid event_type: %', NEW.event_type;
  END IF;

  -- Validate mode
  IF NEW.mode IS NOT NULL AND NEW.mode NOT IN ('ai', 'training', 'explore') THEN
    RAISE EXCEPTION 'Invalid mode: %', NEW.mode;
  END IF;

  -- Validate challenge_text length
  IF length(NEW.challenge_text) > 2000 THEN
    RAISE EXCEPTION 'challenge_text exceeds maximum length';
  END IF;

  -- Validate language
  IF NEW.language IS NOT NULL AND NEW.language NOT IN ('en', 'de', 'es', 'fr', 'it', 'hu') THEN
    RAISE EXCEPTION 'Invalid language: %', NEW.language;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_usage_event_trigger
  BEFORE INSERT ON public.usage_events
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_usage_event();

-- 9. Add validation trigger on explore_feedback
CREATE OR REPLACE FUNCTION public.validate_explore_feedback()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.rating NOT IN ('up', 'down') THEN
    RAISE EXCEPTION 'Invalid rating: %', NEW.rating;
  END IF;

  IF NEW.feedback_text IS NOT NULL AND length(NEW.feedback_text) > 2000 THEN
    RAISE EXCEPTION 'feedback_text exceeds maximum length';
  END IF;

  IF length(NEW.question) > 2000 THEN
    RAISE EXCEPTION 'question exceeds maximum length';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_explore_feedback_trigger
  BEFORE INSERT ON public.explore_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_explore_feedback();
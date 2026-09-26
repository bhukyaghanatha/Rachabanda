-- ==============================================================================
-- Migration: 20260926000001_profile_privacy_hardening.sql
-- Description: Trust & Safety Security Hardening:
--              1. Hardens public.profiles RLS to stop anonymous personal data exposure
--              2. Creates public-safe view (public.public_profiles) for author display
--              3. Enforces authenticated user identity matching on comment INSERT
--              4. Enforces submission author identity matching on submission INSERT
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PROFILES PRIVACY (P0)
-- ------------------------------------------------------------------------------

-- Ensure Row Level Security is active on public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop insecure blanket public read policy and previous variants
DROP POLICY IF EXISTS "Public profiles are readable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;

-- 1.1 Allow users to view their own full profile (including phone, district, mandal, bio)
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- 1.2 Allow administrators and editors to view profiles for user management and review
CREATE POLICY "Staff can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin_or_editor());

-- 1.3 Ensure profile UPDATE policy allows owners to edit their profile (subject to trg_protect_profile_role)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 1.4 Minimal public-safe view containing strictly non-sensitive fields
--     Never exposes phone, district, mandal, bio, or private data
CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT
    id,
    full_name,
    avatar_url,
    role
  FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 2. COMMENT IDENTITY RLS (P1)
-- ------------------------------------------------------------------------------

-- Drop loose insert policy
DROP POLICY IF EXISTS "Authenticated users can post comments" ON public.comments;

-- Enforce that authenticated users can only insert comments where user_id matches auth.uid()
CREATE POLICY "Authenticated users can post comments"
  ON public.comments FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
  );

-- ------------------------------------------------------------------------------
-- 3. SUBMISSION IDENTITY RLS (P1)
-- ------------------------------------------------------------------------------

-- Drop unconstrained insert policy
DROP POLICY IF EXISTS "Anyone can submit news" ON public.submissions;

-- Enforce that anonymous citizens must submit with user_id = NULL,
-- and authenticated users must submit with user_id = auth.uid()
CREATE POLICY "Anyone can submit news"
  ON public.submissions FOR INSERT
  WITH CHECK (
    (auth.uid() IS NULL AND user_id IS NULL)
    OR
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );

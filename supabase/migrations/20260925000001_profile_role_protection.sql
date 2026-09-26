-- ==============================================================================
-- Migration: 20260925000001_profile_role_protection.sql
-- Description: Protects public.profiles role column from unauthorized self-escalation
-- ==============================================================================

-- 1. Security Function to Prevent Self-Role Escalation
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- If role is being changed
  IF (OLD.role IS DISTINCT FROM NEW.role) THEN
    -- Only existing admins or editors can alter user roles
    IF NOT public.is_admin_or_editor() THEN
      RAISE EXCEPTION 'Access denied: You cannot modify your own user role'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  -- Maintain updated_at timestamp
  NEW.updated_at := now();

  RETURN NEW;
END;
$$;

-- 2. Attach Trigger to public.profiles
DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();

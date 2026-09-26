-- ==============================================================================
-- Migration: 20260925000005_user_management.sql
-- Description: User management indexes, hardened role protection, and secure admin_set_user_role RPC
-- ==============================================================================

-- 1. Performance Indexes for User Management
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);

-- 2. Harden Existing Profile Role Protection Trigger
--    Ensure ONLY authenticated administrators (NOT editors, reporters, or readers)
--    can modify roles, and prevent self-demotion by administrators.
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- If role is being changed
  IF (OLD.role IS DISTINCT FROM NEW.role) THEN
    -- Only existing admins can alter user roles (editors, reporters, and readers are rejected)
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Access denied: Only administrators can modify user roles'
        USING ERRCODE = '42501';
    END IF;

    -- Prevent self-demotion: an admin cannot demote themselves
    IF (OLD.id = auth.uid() AND NEW.role != 'admin') THEN
      RAISE EXCEPTION 'Access denied: Administrators cannot demote themselves'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  -- Maintain updated_at timestamp
  NEW.updated_at := now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();

-- 3. Secure RPC for Admin Role Assignment
--    Enforces:
--    - Caller must be authenticated
--    - Caller must have role = 'admin' in public.profiles (evaluated server-side)
--    - Self-demotion is rejected
--    - Target user must exist
--    - Updates ONLY role and updated_at (all other columns untouched)
--    - Returns safe JSON object (no secrets or auth.users data)
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  p_user_id uuid,
  p_new_role public.user_role
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id uuid;
  v_caller_role public.user_role;
  v_updated_row record;
BEGIN
  -- 1. Verify caller authentication
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: You must be logged in to change user roles'
      USING ERRCODE = '42501';
  END IF;

  -- 2. Verify caller role is strictly 'admin' in public.profiles
  SELECT role INTO v_caller_role
  FROM public.profiles
  WHERE id = v_caller_id;

  IF v_caller_role IS NULL OR v_caller_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Only administrators can assign user roles'
      USING ERRCODE = '42501';
  END IF;

  -- 3. Prevent self-demotion
  IF p_user_id = v_caller_id AND p_new_role != 'admin' THEN
    RAISE EXCEPTION 'Action rejected: Administrators cannot demote themselves'
      USING ERRCODE = '42501';
  END IF;

  -- 4. Verify target user exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Target user not found'
      USING ERRCODE = 'P0002';
  END IF;

  -- 5. Update strictly role and updated_at
  UPDATE public.profiles
  SET
    role = p_new_role,
    updated_at = now()
  WHERE id = p_user_id
  RETURNING id, full_name, role, updated_at INTO v_updated_row;

  -- 6. Return safe JSON result
  RETURN jsonb_build_object(
    'id', v_updated_row.id,
    'full_name', v_updated_row.full_name,
    'role', v_updated_row.role,
    'updated_at', v_updated_row.updated_at
  );
END;
$$;

-- 4. Function Permissions
--    Revoke public and anonymous execution; allow only authenticated users
REVOKE EXECUTE ON FUNCTION public.admin_set_user_role(uuid, public.user_role) FROM public;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_role(uuid, public.user_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, public.user_role) TO authenticated;

-- ==============================================================================
-- Migration: 20260926000003_content_report_cascade_fix.sql
-- Description: Trust & Safety #8E Task 1: Fix P0 Content Report Deletion Cascade Conflict
--              - Replaces public.protect_content_report_fields() trigger function
--              - Allows database ON DELETE SET NULL referential action when referenced profile is deleted
--              - Blocks any ordinary client/staff modification of reporter_id
--              - Preserves strict immutability of report content, reason, details, and timestamps
--              - Re-attaches trigger trg_protect_content_report_fields idempotently
-- ==============================================================================

-- 1. Replace the immutable fields trigger function with referential-action awareness
CREATE OR REPLACE FUNCTION public.protect_content_report_fields()
RETURNS trigger AS $$
BEGIN
  -- 1. Protect immutable fields: id, content_type, content_id, reason, details, created_at
  IF (NEW.id IS DISTINCT FROM OLD.id)
     OR (NEW.content_type IS DISTINCT FROM OLD.content_type)
     OR (NEW.content_id IS DISTINCT FROM OLD.content_id)
     OR (NEW.reason IS DISTINCT FROM OLD.reason)
     OR (NEW.details IS DISTINCT FROM OLD.details)
     OR (NEW.created_at IS DISTINCT FROM OLD.created_at) THEN
    RAISE EXCEPTION 'Cannot modify immutable content report fields (target content, reason, details, or timestamp)'
      USING ERRCODE = '42501'; -- insufficient_privilege
  END IF;

  -- 2. Protect reporter_id:
  -- reporter_id is strictly immutable EXCEPT when set to NULL by the database's
  -- ON DELETE SET NULL referential action when the referenced profile is deleted.
  IF (NEW.reporter_id IS DISTINCT FROM OLD.reporter_id) THEN
    -- Allow transition ONLY IF:
    -- (a) NEW.reporter_id is NULL, AND
    -- (b) OLD.reporter_id was NOT NULL, AND
    -- (c) No moderation fields were modified in this statement, AND
    -- (d) The referenced profile row no longer exists in public.profiles (confirming it was deleted)
    IF (NEW.reporter_id IS NULL)
       AND (OLD.reporter_id IS NOT NULL)
       AND (NEW.status IS NOT DISTINCT FROM OLD.status)
       AND (NEW.reviewed_by IS NOT DISTINCT FROM OLD.reviewed_by)
       AND (NEW.reviewed_at IS NOT DISTINCT FROM OLD.reviewed_at)
       AND (NEW.updated_at IS NOT DISTINCT FROM OLD.updated_at)
       AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = OLD.reporter_id) THEN
      -- Permitted: pure ON DELETE SET NULL cascade triggered by profile deletion
      NULL;
    ELSE
      RAISE EXCEPTION 'Cannot modify immutable content report fields (reporter_id cannot be modified)'
        USING ERRCODE = '42501'; -- insufficient_privilege
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- 2. Ensure trigger is attached to public.content_reports
DROP TRIGGER IF EXISTS trg_protect_content_report_fields ON public.content_reports;
CREATE TRIGGER trg_protect_content_report_fields
  BEFORE UPDATE ON public.content_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_content_report_fields();

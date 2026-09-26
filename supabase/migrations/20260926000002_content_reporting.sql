-- ==============================================================================
-- Migration: 20260926000002_content_reporting.sql
-- Description: Trust & Safety #8D-1: Content Reporting Database Schema & RLS
--              - Creates public.content_reports table with strict CHECK constraints
--              - Enforces reporter privacy: anonymous blocked, reporters see only their own
--              - Enforces partial unique index to block duplicate pending reports
--              - Implements BEFORE INSERT/UPDATE trigger for target existence validation
--              - Implements BEFORE UPDATE trigger to protect immutable report fields
--              - Configures Row Level Security (RLS) for authenticated INSERT and
--                owner/staff SELECT, staff UPDATE only (destructive DELETE strictly prohibited)
-- ==============================================================================

-- 1. Create content_reports table
CREATE TABLE IF NOT EXISTS public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_content_reports_type CHECK (content_type IN ('news', 'comment')),
  CONSTRAINT chk_content_reports_reason CHECK (reason IN ('misinformation', 'hate_speech', 'harassment', 'spam', 'inappropriate', 'copyright', 'other')),
  CONSTRAINT chk_content_reports_status CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned'))
);

-- 2. Indexes
-- 2.1 Duplicate pending report prevention (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_reports_unique_pending
  ON public.content_reports (reporter_id, content_type, content_id)
  WHERE status = 'pending';

-- 2.2 Performance and moderation filtering indexes
CREATE INDEX IF NOT EXISTS idx_content_reports_status_created
  ON public.content_reports (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_reports_reporter
  ON public.content_reports (reporter_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_reports_content
  ON public.content_reports (content_type, content_id);

-- 3. Content Target Existence Validation Trigger
-- Ensures reports cannot be filed against non-existent news or comment UUIDs
CREATE OR REPLACE FUNCTION public.validate_content_report_target()
RETURNS trigger AS $$
BEGIN
  IF NEW.content_type = 'news' THEN
    IF NOT EXISTS (SELECT 1 FROM public.news WHERE id = NEW.content_id) THEN
      RAISE EXCEPTION 'Report target not found: news item % does not exist', NEW.content_id
        USING ERRCODE = '23503'; -- foreign_key_violation
    END IF;
  ELSIF NEW.content_type = 'comment' THEN
    IF NOT EXISTS (SELECT 1 FROM public.comments WHERE id = NEW.content_id) THEN
      RAISE EXCEPTION 'Report target not found: comment % does not exist', NEW.content_id
        USING ERRCODE = '23503'; -- foreign_key_violation
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid content_type: %', NEW.content_type
      USING ERRCODE = '22023'; -- invalid_parameter_value
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_validate_content_report_target ON public.content_reports;
CREATE TRIGGER trg_validate_content_report_target
  BEFORE INSERT OR UPDATE OF content_type, content_id ON public.content_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_content_report_target();

-- 4. Immutable Report Fields Protection Trigger
-- Ensures moderators/staff can ONLY update moderation fields:
-- (status, reviewed_by, reviewed_at, updated_at).
-- Any attempt to alter id, reporter_id, content_type, content_id, reason, details, or created_at
-- is rejected with SQLSTATE 42501 (insufficient_privilege).
CREATE OR REPLACE FUNCTION public.protect_content_report_fields()
RETURNS trigger AS $$
BEGIN
  IF (NEW.id IS DISTINCT FROM OLD.id)
     OR (NEW.reporter_id IS DISTINCT FROM OLD.reporter_id)
     OR (NEW.content_type IS DISTINCT FROM OLD.content_type)
     OR (NEW.content_id IS DISTINCT FROM OLD.content_id)
     OR (NEW.reason IS DISTINCT FROM OLD.reason)
     OR (NEW.details IS DISTINCT FROM OLD.details)
     OR (NEW.created_at IS DISTINCT FROM OLD.created_at) THEN
    RAISE EXCEPTION 'Cannot modify immutable content report fields (reporter, target content, reason, details, or timestamp)'
      USING ERRCODE = '42501'; -- insufficient_privilege
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_protect_content_report_fields ON public.content_reports;
CREATE TRIGGER trg_protect_content_report_fields
  BEFORE UPDATE ON public.content_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_content_report_fields();

-- 5. Row Level Security (RLS)
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

-- 5.1 INSERT: Authenticated users can only insert reports for themselves with status = 'pending'
DROP POLICY IF EXISTS "Authenticated users can create content reports" ON public.content_reports;
CREATE POLICY "Authenticated users can create content reports"
  ON public.content_reports
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND reporter_id = auth.uid()
    AND status = 'pending'
  );

-- 5.2 SELECT: Reporters can only view their own reports; Admins/Editors can view all
DROP POLICY IF EXISTS "Users can view own reports and staff can view all" ON public.content_reports;
CREATE POLICY "Users can view own reports and staff can view all"
  ON public.content_reports
  FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND reporter_id = auth.uid())
    OR public.is_admin_or_editor()
  );

-- 5.3 UPDATE: Only Admins and Editors can update reports (status, reviewed_by, reviewed_at)
DROP POLICY IF EXISTS "Staff can update content reports" ON public.content_reports;
CREATE POLICY "Staff can update content reports"
  ON public.content_reports
  FOR UPDATE
  USING (public.is_admin_or_editor())
  WITH CHECK (public.is_admin_or_editor());

-- 5.4 DELETE: Destructive DELETE is strictly prohibited for all roles (audit trail preservation)
-- Explicitly drop any existing DELETE policy so no one can delete reports via PostgREST
DROP POLICY IF EXISTS "Staff can delete content reports" ON public.content_reports;

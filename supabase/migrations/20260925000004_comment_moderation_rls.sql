-- ==============================================================================
-- Migration: 20260925000004_comment_moderation_rls.sql
-- Description: Enables comment moderation RLS for admins and editors
-- ==============================================================================

-- 1. Ensure Row Level Security is enabled on public.comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 2. Staff SELECT Policy: Allow admins and editors to view ALL comments
--    including approved (is_approved = true) and hidden/unapproved (is_approved = false)
DROP POLICY IF EXISTS "Staff can view all comments" ON public.comments;
CREATE POLICY "Staff can view all comments"
  ON public.comments FOR SELECT
  USING (public.is_admin_or_editor());

-- 3. Staff UPDATE Policy: Allow admins and editors to moderate comments (toggle is_approved)
DROP POLICY IF EXISTS "Staff can moderate comments" ON public.comments;
CREATE POLICY "Staff can moderate comments"
  ON public.comments FOR UPDATE
  USING (public.is_admin_or_editor())
  WITH CHECK (public.is_admin_or_editor());

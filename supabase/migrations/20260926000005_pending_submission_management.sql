-- ==============================================================================
-- Migration: 20260926000005_pending_submission_management.sql
-- Description: Trust & Safety #8F: Pending Submission Management
--              - Adds public.withdraw_own_submission() RPC:
--                * Strictly self-only: derives caller from auth.uid()
--                * Row lock with FOR UPDATE to prevent race conditions
--                * Restricts withdrawal strictly to status = 'pending'
--                * Collects image_url, audio_url, video_url BEFORE deletion
--                * Deletes only the pending submission row (no 'withdrawn' enum needed)
--                * Returns media URLs for safe client storage cleanup
--              - Adds atomic public.reject_submission() RPC:
--                * Restricts execution strictly to admins/editors
--                * Enforces reviewer identity matches auth.uid()
--                * Row lock with FOR UPDATE to eliminate approve/reject race conditions
--                * Rejects already approved or rejected submissions
--                * Validates and trims explicit rejection reason (max 500 chars)
--                * Sets status = 'rejected', reviewed_by, reviewed_at, rejection_reason
--                * Returns media URLs for non-fatal background cleanup
--              - Enforces SECURITY DEFINER with safe search_path
--              - Revokes execute from public/anon, grants only to authenticated
-- ==============================================================================

-- 1. PENDING SUBMISSION WITHDRAWAL RPC
CREATE OR REPLACE FUNCTION public.withdraw_own_submission(
  p_submission_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_submission record;
  v_media_urls jsonb := '[]'::jsonb;
BEGIN
  -- 1. Security Check: Caller must be authenticated
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: You must be logged in to withdraw a submission'
      USING ERRCODE = '42501'; -- insufficient_privilege
  END IF;

  -- 2. Lock & Retrieve Submission (Row-level lock to prevent concurrent review/approval race conditions)
  SELECT *
  INTO v_submission
  FROM public.submissions
  WHERE id = p_submission_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission with id % not found', p_submission_id
      USING ERRCODE = 'P0002'; -- no_data_found
  END IF;

  -- 3. Security Check: Caller must be the genuine author/owner of the submission
  IF v_submission.user_id IS NULL OR v_submission.user_id != v_user_id THEN
    RAISE EXCEPTION 'Access denied: You can only withdraw your own submissions'
      USING ERRCODE = '42501'; -- insufficient_privilege
  END IF;

  -- 4. Status Check: Only pending submissions can be withdrawn
  -- Once approved or rejected, a submission cannot be withdrawn by the reporter
  IF v_submission.status != 'pending' THEN
    RAISE EXCEPTION 'Action rejected: Only pending submissions can be withdrawn. Current status is % (id: %)',
      v_submission.status, p_submission_id
      USING ERRCODE = '22023'; -- invalid_parameter_value
  END IF;

  -- 5. Collect media URLs BEFORE deleting the row
  -- Captures non-empty media paths so the caller can perform storage cleanup
  SELECT COALESCE(
    jsonb_agg(DISTINCT url),
    '[]'::jsonb
  ) INTO v_media_urls
  FROM (
    SELECT v_submission.image_url AS url
    WHERE v_submission.image_url IS NOT NULL AND trim(v_submission.image_url) != ''
    UNION ALL
    SELECT v_submission.audio_url AS url
    WHERE v_submission.audio_url IS NOT NULL AND trim(v_submission.audio_url) != ''
    UNION ALL
    SELECT v_submission.video_url AS url
    WHERE v_submission.video_url IS NOT NULL AND trim(v_submission.video_url) != ''
  ) sub_urls;

  -- 6. Atomically delete the pending submission row
  DELETE FROM public.submissions
  WHERE id = p_submission_id
    AND user_id = v_user_id
    AND status = 'pending';

  -- 7. Return confirmation with collected media URLs for cleanup
  RETURN jsonb_build_object(
    'success', true,
    'submission_id', p_submission_id,
    'media_urls', v_media_urls
  );
END;
$$;

-- Permissions for withdraw_own_submission
REVOKE ALL ON FUNCTION public.withdraw_own_submission(uuid) FROM public;
REVOKE ALL ON FUNCTION public.withdraw_own_submission(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.withdraw_own_submission(uuid) TO authenticated;


-- 2. HARDENED ATOMIC SUBMISSION REJECTION RPC
CREATE OR REPLACE FUNCTION public.reject_submission(
  p_submission_id uuid,
  p_reason text,
  p_reviewer_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_caller_id uuid;
  v_reviewer_id uuid;
  v_reason text;
  v_submission record;
  v_media_urls jsonb := '[]'::jsonb;
BEGIN
  -- 1. Security Check: Caller must be authenticated
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: You must be logged in to reject submissions'
      USING ERRCODE = '42501'; -- insufficient_privilege
  END IF;

  -- 2. Security Check: Caller must be an admin or editor
  IF NOT public.is_admin_or_editor() THEN
    RAISE EXCEPTION 'Access denied: Only administrators and editors can reject submissions'
      USING ERRCODE = '42501'; -- insufficient_privilege
  END IF;

  -- 3. Reviewer Identity Verification
  -- Must match caller identity to prevent impersonation
  v_reviewer_id := v_caller_id;
  IF p_reviewer_id IS NOT NULL AND p_reviewer_id != v_caller_id THEN
    RAISE EXCEPTION 'Security violation: Reviewer ID (%) does not match authenticated caller (%)',
      p_reviewer_id, v_caller_id
      USING ERRCODE = '42501'; -- insufficient_privilege
  END IF;

  -- 4. Reason Validation
  v_reason := trim(p_reason);
  IF v_reason IS NULL OR v_reason = '' THEN
    RAISE EXCEPTION 'Rejection reason is required. Please provide a clear editorial reason.'
      USING ERRCODE = '22023'; -- invalid_parameter_value
  END IF;

  IF length(v_reason) > 500 THEN
    RAISE EXCEPTION 'Rejection reason exceeds maximum allowed length of 500 characters'
      USING ERRCODE = '22023'; -- invalid_parameter_value
  END IF;

  -- 5. Lock & Retrieve Submission (Row-level lock prevents approve/reject race condition)
  SELECT *
  INTO v_submission
  FROM public.submissions
  WHERE id = p_submission_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission with id % not found', p_submission_id
      USING ERRCODE = 'P0002'; -- no_data_found
  END IF;

  -- 6. Verify Submission Status is Pending
  IF v_submission.status != 'pending' THEN
    RAISE EXCEPTION 'Submission is already % (id: %)', v_submission.status, p_submission_id
      USING ERRCODE = '22023'; -- invalid_parameter_value
  END IF;

  -- 7. Collect associated media URLs for post-transaction storage cleanup
  SELECT COALESCE(
    jsonb_agg(DISTINCT url),
    '[]'::jsonb
  ) INTO v_media_urls
  FROM (
    SELECT v_submission.image_url AS url
    WHERE v_submission.image_url IS NOT NULL AND trim(v_submission.image_url) != ''
    UNION ALL
    SELECT v_submission.audio_url AS url
    WHERE v_submission.audio_url IS NOT NULL AND trim(v_submission.audio_url) != ''
    UNION ALL
    SELECT v_submission.video_url AS url
    WHERE v_submission.video_url IS NOT NULL AND trim(v_submission.video_url) != ''
  ) sub_urls;

  -- 8. Atomically update submission status to rejected
  UPDATE public.submissions
  SET
    status = 'rejected',
    reviewed_by = v_reviewer_id,
    reviewed_at = now(),
    rejection_reason = v_reason,
    updated_at = now()
  WHERE id = p_submission_id;

  -- 9. Return confirmation with collected media URLs and status details
  RETURN jsonb_build_object(
    'success', true,
    'submission_id', p_submission_id,
    'status', 'rejected',
    'rejection_reason', v_reason,
    'reviewed_by', v_reviewer_id,
    'reviewed_at', now(),
    'media_urls', v_media_urls
  );
END;
$$;

-- Permissions for reject_submission
REVOKE ALL ON FUNCTION public.reject_submission(uuid, text, uuid) FROM public;
REVOKE ALL ON FUNCTION public.reject_submission(uuid, text, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.reject_submission(uuid, text, uuid) TO authenticated;

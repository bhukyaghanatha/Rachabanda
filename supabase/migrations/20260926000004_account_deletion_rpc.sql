-- ==============================================================================
-- Migration: 20260926000004_account_deletion_rpc.sql
-- Description: Trust & Safety #8E Task 2: Secure Self-Account Deletion RPC
--              - Creates public.delete_own_account() function
--              - Strictly self-only: derives caller exclusively from auth.uid()
--              - Prevents sole administrator account deletion (lockout protection)
--              - Collects pending submission media URLs before deletion
--              - Automatically withdraws and removes pending submissions
--              - Anonymizes retained submissions (reporter_name -> 'రచ్చబండ పౌరుడు', phone -> NULL)
--              - Anonymizes user comments (user_name -> 'రచ్చబండ పాఠకుడు')
--              - Deletes auth.users row which cascades to public.profiles, reactions,
--                bookmarks, follows, notifications, and nullifies FKs on news & reports
--              - Revokes execution from public and anon, grants only to authenticated
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_role public.user_role;
  v_admin_count int;
  v_pending_count int;
  v_retained_sub_count int;
  v_comment_count int;
  v_pending_media_urls jsonb := '[]'::jsonb;
  v_avatar_prefix text;
BEGIN
  -- 1. Security Check: Caller must be authenticated
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: You must be logged in to delete your account'
      USING ERRCODE = '42501'; -- insufficient_privilege
  END IF;

  -- 2. Security Check: Prevent sole administrator deletion to avoid system lockout
  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_role = 'admin' THEN
    SELECT count(*) INTO v_admin_count
    FROM public.profiles
    WHERE role = 'admin';

    IF v_admin_count <= 1 THEN
      RAISE EXCEPTION 'Action rejected: Cannot delete the sole administrator account. Another administrator must exist before this account can be deleted.'
        USING ERRCODE = '42501'; -- insufficient_privilege
    END IF;
  END IF;

  -- 3. Before deleting pending submissions, collect their media URLs
  -- Only collect non-empty URLs belonging strictly to pending submissions owned by auth.uid()
  -- (Approved submission media and news media are retained to protect published stories)
  SELECT COALESCE(
    jsonb_agg(DISTINCT url),
    '[]'::jsonb
  ) INTO v_pending_media_urls
  FROM (
    SELECT image_url AS url
    FROM public.submissions
    WHERE user_id = v_user_id
      AND status = 'pending'
      AND image_url IS NOT NULL
      AND trim(image_url) != ''
    UNION ALL
    SELECT audio_url AS url
    FROM public.submissions
    WHERE user_id = v_user_id
      AND status = 'pending'
      AND audio_url IS NOT NULL
      AND trim(audio_url) != ''
    UNION ALL
    SELECT video_url AS url
    FROM public.submissions
    WHERE user_id = v_user_id
      AND status = 'pending'
      AND video_url IS NOT NULL
      AND trim(video_url) != ''
  ) sub_urls;

  -- 4. Prepare avatar folder prefix for client-side / background best-effort cleanup
  v_avatar_prefix := 'avatars/' || v_user_id::text;

  -- 5. Automatically withdraw and delete pending submissions belonging to this user
  -- (Approved submissions with published news and rejected historical submissions are retained)
  DELETE FROM public.submissions
  WHERE user_id = v_user_id
    AND status = 'pending';
  GET DIAGNOSTICS v_pending_count = ROW_COUNT;

  -- 6. Anonymize retained historical submissions (approved and rejected)
  -- Strips personal information (reporter_name and reporter_phone)
  UPDATE public.submissions
  SET
    reporter_name = 'రచ్చబండ పౌరుడు',
    reporter_phone = NULL,
    updated_at = now()
  WHERE user_id = v_user_id;
  GET DIAGNOSTICS v_retained_sub_count = ROW_COUNT;

  -- 7. Anonymize user comments
  -- Keeps comment text intact for article discussion continuity, but anonymizes author name
  UPDATE public.comments
  SET
    user_name = 'రచ్చబండ పాఠకుడు'
  WHERE user_id = v_user_id;
  GET DIAGNOSTICS v_comment_count = ROW_COUNT;

  -- 8. Delete from auth.users
  -- Foreign key cascades will automatically:
  --   a) Delete public.profiles row (CASCADE)
  --   b) Delete public.reactions rows (CASCADE)
  --   c) Delete public.bookmarks rows (CASCADE)
  --   d) Delete public.follows rows (CASCADE)
  --   e) Delete public.notifications rows (CASCADE)
  --   f) Set public.news.author_id to NULL (SET NULL)
  --   g) Set public.submissions.user_id to NULL (SET NULL)
  --   h) Set public.comments.user_id to NULL (SET NULL)
  --   i) Set public.content_reports.reporter_id to NULL (SET NULL, handled by trg_protect_content_report_fields)
  DELETE FROM auth.users
  WHERE id = v_user_id;

  -- 9. Return summary result
  RETURN jsonb_build_object(
    'success', true,
    'deleted_user_id', v_user_id,
    'pending_media_urls', v_pending_media_urls,
    'avatar_prefix', v_avatar_prefix,
    'withdrawn_pending_submissions', v_pending_count,
    'anonymized_submissions', v_retained_sub_count,
    'anonymized_comments', v_comment_count
  );
END;
$$;

-- Revoke all permissions from public and anonymous users
REVOKE ALL ON FUNCTION public.delete_own_account() FROM public;
REVOKE ALL ON FUNCTION public.delete_own_account() FROM anon;

-- Grant execution strictly to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;

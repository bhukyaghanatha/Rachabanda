-- ==============================================================================
-- Migration: 20260923000001_approve_submission_rpc.sql
-- Description: Transactional & atomic submission approval function for Admins/Editors
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.approve_submission(
  p_submission_id uuid,
  p_custom_slug text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_caller_id uuid;
  v_submission record;
  v_slug text;
  v_news_id uuid;
  v_short_summary text;
  v_author_id uuid;
  v_cover_image text;
  v_reporter_name text;
  v_has_video boolean;
BEGIN
  -- 1. Security Check: Authenticated Caller
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to approve submissions'
      USING ERRCODE = '42501';
  END IF;

  -- 2. Security Check: Admin or Editor Role
  IF NOT public.is_admin_or_editor() THEN
    RAISE EXCEPTION 'Access denied: Caller must have admin or editor role'
      USING ERRCODE = '42501';
  END IF;

  -- 3. Lock & Retrieve Submission (Row-level lock to prevent concurrent approval race conditions)
  SELECT *
  INTO v_submission
  FROM public.submissions
  WHERE id = p_submission_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission with id % not found', p_submission_id
      USING ERRCODE = 'P0002';
  END IF;

  -- 4. Verify Submission Status is Pending
  IF v_submission.status != 'pending' THEN
    RAISE EXCEPTION 'Submission is already % (id: %)', v_submission.status, p_submission_id
      USING ERRCODE = '22023';
  END IF;

  -- 5. Generate Unique Slug
  IF p_custom_slug IS NOT NULL AND trim(p_custom_slug) != '' THEN
    v_slug := trim(p_custom_slug);
    -- Check if slug already exists
    IF EXISTS (SELECT 1 FROM public.news WHERE slug = v_slug) THEN
      v_slug := v_slug || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 6);
    END IF;
  ELSE
    -- Generate slug from Telugu/English title with clean URL-friendly chars and unique suffix
    v_slug := lower(regexp_replace(v_submission.title, '[^a-zA-Z0-9\u0C00-\u0C7F]+', '-', 'g'));
    v_slug := trim(both '-' from v_slug);
    IF length(v_slug) > 50 THEN
      v_slug := substr(v_slug, 1, 50);
    END IF;
    IF v_slug IS NULL OR v_slug = '' THEN
      v_slug := 'news';
    END IF;
    v_slug := v_slug || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 8);
  END IF;

  -- 6. Prepare News Attributes
  IF length(v_submission.details) > 180 THEN
    v_short_summary := substr(v_submission.details, 1, 177) || '...';
  ELSE
    v_short_summary := v_submission.details;
  END IF;

  v_author_id := COALESCE(v_submission.user_id, v_caller_id);
  v_cover_image := COALESCE(
    v_submission.image_url,
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80'
  );
  v_reporter_name := COALESCE(v_submission.reporter_name, 'రచ్చ బండ పౌర రిపోర్టర్');
  v_has_video := (v_submission.video_url IS NOT NULL AND trim(v_submission.video_url) != '');

  -- 7. Insert into public.news
  INSERT INTO public.news (
    title,
    slug,
    short_summary,
    content,
    language,
    author_id,
    status,
    cover_image,
    audio_url,
    audio_duration,
    video_url,
    is_breaking,
    is_video,
    fact_checked,
    source,
    published_at,
    created_at,
    updated_at
  ) VALUES (
    v_submission.title,
    v_slug,
    v_short_summary,
    v_submission.details,
    'te',
    v_author_id,
    'published',
    v_cover_image,
    v_submission.audio_url,
    '1:00',
    v_submission.video_url,
    false,
    v_has_video,
    true,
    v_reporter_name,
    now(),
    now(),
    now()
  )
  RETURNING id INTO v_news_id;

  -- 8. Insert into public.news_categories
  IF v_submission.category_id IS NOT NULL THEN
    INSERT INTO public.news_categories (news_id, category_id)
    VALUES (v_news_id, v_submission.category_id)
    ON CONFLICT (news_id, category_id) DO NOTHING;
  END IF;

  -- 9. Insert into public.news_locations
  IF v_submission.location_id IS NOT NULL THEN
    INSERT INTO public.news_locations (news_id, location_id)
    VALUES (v_news_id, v_submission.location_id)
    ON CONFLICT (news_id, location_id) DO NOTHING;
  END IF;

  -- 10. Update public.submissions
  UPDATE public.submissions
  SET
    status = 'approved',
    reviewed_by = v_caller_id,
    reviewed_at = now(),
    published_news_id = v_news_id,
    updated_at = now()
  WHERE id = p_submission_id;

  -- 11. Return confirmation json
  RETURN jsonb_build_object(
    'success', true,
    'submission_id', p_submission_id,
    'news_id', v_news_id,
    'slug', v_slug
  );
END;
$$;

-- Function Execution Permissions
REVOKE EXECUTE ON FUNCTION public.approve_submission(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_submission(uuid, text) TO authenticated;

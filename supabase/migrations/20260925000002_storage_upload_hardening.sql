-- ==============================================================================
-- Migration: 20260925000002_storage_upload_hardening.sql
-- Description: Hardens Supabase storage upload authorization on submissions-media bucket.
--              - Removes blanket public upload policy
--              - Allows authenticated users to upload only their own avatar (avatars/<user-id>/...)
--              - Allows citizen submission media uploads strictly to designated folders ('images', 'audio', 'videos')
--              - Replaces DELETE policy to enforce proper path indexing for avatar owners and staff
--              - Adds UPDATE policy with ownership verification for avatar updates
-- ==============================================================================

-- A. Remove the blanket submissions-media INSERT policy
DROP POLICY IF EXISTS "Allow public uploads to submissions-media"
ON storage.objects;

-- B. Add authenticated own-avatar INSERT policy
CREATE POLICY "Allow authenticated users to upload own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'submissions-media'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = 'avatars'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- C. Add designated citizen-submission media INSERT policy
CREATE POLICY "Allow submission media uploads to designated folders"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'submissions-media'
  AND (storage.foldername(name))[1] IN ('images', 'audio', 'videos')
);

-- D. Replace the submissions-media DELETE policy
DROP POLICY IF EXISTS "Allow delete on submissions-media"
ON storage.objects;

CREATE POLICY "Allow delete on submissions-media"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'submissions-media'
  AND (
    (
      auth.uid() IS NOT NULL
      AND (storage.foldername(name))[1] = 'avatars'
      AND (storage.foldername(name))[2] = auth.uid()::text
    )
    OR public.is_admin_or_editor()
  )
);

-- E. Add/fix avatar UPDATE policy for authenticated owners and admins/editors
DROP POLICY IF EXISTS "Allow users to update own avatar"
ON storage.objects;

CREATE POLICY "Allow users to update own avatar"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'submissions-media'
  AND (
    (
      auth.uid() IS NOT NULL
      AND (storage.foldername(name))[1] = 'avatars'
      AND (storage.foldername(name))[2] = auth.uid()::text
    )
    OR public.is_admin_or_editor()
  )
)
WITH CHECK (
  bucket_id = 'submissions-media'
  AND (
    (
      auth.uid() IS NOT NULL
      AND (storage.foldername(name))[1] = 'avatars'
      AND (storage.foldername(name))[2] = auth.uid()::text
    )
    OR public.is_admin_or_editor()
  )
);

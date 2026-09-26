/**
 * @file userService.ts
 * @description Service layer for user profile, preferences, and Supabase bookmarks management.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  UserProfile,
  UpdateUserProfileInput,
  UserRole,
  AdminUserFilters,
  AdminUserProfile,
  AdminSetUserRoleResult,
} from '../types';
import {
  validateMediaFile,
  SUBMISSIONS_BUCKET,
  extractSafeStoragePath,
  deleteMediaFile,
  cleanupSubmissionMedia,
} from './storageService';

/**
 * Fetch all bookmarked news article IDs for a specific user.
 * Respects Supabase RLS: auth.uid() = user_id.
 */
export async function fetchUserBookmarks(
  userId: string
): Promise<{ data: string[]; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { data: [], error: null };
  }

  if (!userId) {
    return { data: [], error: new Error('User ID is required to fetch bookmarks') };
  }

  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('news_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: [], error: new Error(error.message) };
    }

    const newsIds = (data || []).map((row: any) => row.news_id);
    return { data: newsIds, error: null };
  } catch (err: any) {
    return {
      data: [],
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Check if a specific news article is bookmarked by a user.
 */
export async function isNewsBookmarked(
  userId: string,
  newsId: string
): Promise<boolean> {
  if (!isSupabaseConfigured || !userId || !newsId) {
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('news_id', newsId)
      .maybeSingle();

    if (error) {
      console.warn('isNewsBookmarked error:', error.message);
      return false;
    }

    return Boolean(data);
  } catch (err) {
    console.warn('isNewsBookmarked exception:', err);
    return false;
  }
}

/**
 * Add a news article to a user's bookmarks in Supabase.
 * Respects UNIQUE(user_id, news_id) constraint and RLS.
 */
export async function addBookmark(
  userId: string,
  newsId: string
): Promise<{ success: boolean; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: new Error('Supabase is not configured') };
  }

  if (!userId || !newsId) {
    return {
      success: false,
      error: new Error('User ID and News ID are required to add bookmark'),
    };
  }

  try {
    const { error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: userId,
        news_id: newsId,
      });

    if (error) {
      // Postgres error code 23505 = unique_violation (already bookmarked)
      if (error.code === '23505') {
        return { success: true, error: null };
      }
      return { success: false, error: new Error(error.message) };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Remove a news article from a user's bookmarks in Supabase.
 * Strictly scoped to the specified user and news article.
 */
export async function removeBookmark(
  userId: string,
  newsId: string
): Promise<{ success: boolean; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: new Error('Supabase is not configured') };
  }

  if (!userId || !newsId) {
    return {
      success: false,
      error: new Error('User ID and News ID are required to remove bookmark'),
    };
  }

  try {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('news_id', newsId);

    if (error) {
      return { success: false, error: new Error(error.message) };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Toggle a news article bookmark for a user.
 * If currently bookmarked, removes it; otherwise adds it.
 */
export async function toggleBookmark(
  userId: string,
  newsId: string,
  currentlySaved?: boolean
): Promise<{ isSaved: boolean; error: Error | null }> {
  const isSavedState =
    currentlySaved !== undefined
      ? currentlySaved
      : await isNewsBookmarked(userId, newsId);

  if (isSavedState) {
    const { success, error } = await removeBookmark(userId, newsId);
    return { isSaved: !success, error };
  } else {
    const { success, error } = await addBookmark(userId, newsId);
    return { isSaved: success, error };
  }
}

/**
 * Update the authenticated caller's profile.
 * Derives user ID strictly from supabase.auth.getUser() to prevent unauthorized access.
 * Strictly whitelists only allowed fields: full_name, bio, district, mandal, phone, avatar_url.
 */
export async function updateUserProfile(
  updates: UpdateUserProfileInput
): Promise<{ data: UserProfile | null; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured') };
  }

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: new Error('లాగిన్ అవ్వండి / Authentication required to update profile'),
      };
    }

    // Explicitly whitelist only allowed fields (never send role or id)
    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.full_name !== undefined) payload.full_name = updates.full_name.trim();
    if (updates.bio !== undefined) payload.bio = updates.bio !== null ? updates.bio.trim() : null;
    if (updates.district !== undefined) payload.district = updates.district !== null ? updates.district.trim() : null;
    if (updates.mandal !== undefined) payload.mandal = updates.mandal !== null ? updates.mandal.trim() : null;
    if (updates.phone !== undefined) payload.phone = updates.phone !== null ? updates.phone.trim() : null;
    if (updates.avatar_url !== undefined) payload.avatar_url = updates.avatar_url;

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user.id)
      .select('*')
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as UserProfile, error: null };
  } catch (err: any) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Upload a user avatar image to Supabase Storage and update public.profiles.
 * Validates file type and size.
 * Saves to submissions-media bucket under: avatars/${userId}/${safeFilename}
 */
export async function uploadUserAvatar(
  file: File
): Promise<{ url: string | null; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { url: null, error: new Error('Supabase is not configured') };
  }

  // 1. Client-side media validation
  const validation = validateMediaFile(file, 'image');
  if (!validation.valid) {
    return {
      url: null,
      error: new Error(validation.error || 'చెల్లని చిత్రం ఫైల్. / Invalid image file.'),
    };
  }

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        url: null,
        error: new Error('లాగిన్ అవ్వండి / Authentication required to upload avatar'),
      };
    }

    // Capture previous avatar_url to clean up orphaned storage file after successful update
    let oldAvatarUrl: string | null = null;
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .maybeSingle();

    if (currentProfile?.avatar_url) {
      oldAvatarUrl = currentProfile.avatar_url;
    }

    // 2. Generate safe unique file path
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${extension}`;
    const filePath = `avatars/${user.id}/${safeFilename}`;

    // 3. Upload to storage
    const { error: uploadError } = await supabase.storage
      .from(SUBMISSIONS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      return { url: null, error: new Error(uploadError.message) };
    }

    // 4. Retrieve public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(SUBMISSIONS_BUCKET).getPublicUrl(filePath);

    // 5. Update avatar_url in public.profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileError) {
      console.warn('Could not update avatar_url in profiles table:', profileError.message);
      return { url: publicUrl, error: new Error(profileError.message) };
    }

    // 6. Safely remove previous avatar from storage if it belonged to this user's avatar path
    // Ensures cleanup happens ONLY AFTER upload and profile update have safely succeeded.
    // Handles missing files gracefully and never deletes external or other users' URLs.
    if (oldAvatarUrl && oldAvatarUrl !== publicUrl) {
      try {
        const allowedPrefixes = [`avatars/${user.id}/`];
        const oldPath = extractSafeStoragePath(oldAvatarUrl, SUBMISSIONS_BUCKET, allowedPrefixes);
        if (oldPath) {
          console.log(`[UserService] Cleaning up previous avatar file: ${oldPath}`);
          await deleteMediaFile(SUBMISSIONS_BUCKET, oldPath);
        } else {
          console.log('[UserService] Previous avatar is not in user avatar storage; skipping deletion.');
        }
      } catch (cleanupErr) {
        // Non-blocking: if cleanup fails, do not break a successful profile update
        console.warn('[UserService] Could not delete old avatar (non-fatal):', cleanupErr);
      }
    }

    return { url: publicUrl, error: null };
  } catch (err: any) {
    return {
      url: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Fetch all user profiles for admin management.
 * Queries public.profiles with optional role filtering, search, and limit.
 * Sorts newest users first by created_at DESC.
 * Does NOT expose auth.users data, passwords, emails, tokens, or require service_role.
 */
export async function fetchAllUsersForAdmin(
  options?: AdminUserFilters
): Promise<{ data: AdminUserProfile[]; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { data: [], error: new Error('Supabase is not configured') };
  }

  try {
    const limit = options?.limit && options.limit > 0 ? options.limit : 100;

    let query = supabase
      .from('profiles')
      .select('id, full_name, phone, role, avatar_url, district, mandal, bio, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by role if specified and not 'all'
    if (options?.role && options.role !== 'all') {
      query = query.eq('role', options.role);
    }

    // Search by full_name, district, mandal, or user ID (if UUID)
    if (options?.search && options.search.trim()) {
      const term = options.search.trim();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(term);

      if (isUuid) {
        query = query.or(
          `id.eq.${term},full_name.ilike.%${term}%,district.ilike.%${term}%,mandal.ilike.%${term}%`
        );
      } else {
        query = query.or(
          `full_name.ilike.%${term}%,district.ilike.%${term}%,mandal.ilike.%${term}%`
        );
      }
    }

    const { data, error } = await query;

    if (error) {
      return { data: [], error: new Error(error.message) };
    }

    return { data: (data as AdminUserProfile[]) || [], error: null };
  } catch (err: any) {
    return {
      data: [],
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Set a user's role via the secure admin_set_user_role RPC.
 * Only authenticated administrators can successfully execute this RPC.
 * Database RPC/RLS enforces admin authorization and self-demotion prevention.
 * Never directly updates profiles.role from the frontend.
 */
export async function adminSetUserRole(
  userId: string,
  newRole: UserRole
): Promise<{ data: AdminSetUserRoleResult | null; success: boolean; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { data: null, success: false, error: new Error('Supabase is not configured') };
  }

  if (!userId) {
    return { data: null, success: false, error: new Error('User ID is required to set role') };
  }

  const validRoles: UserRole[] = ['reader', 'citizen_reporter', 'reporter', 'editor', 'admin'];
  if (!validRoles.includes(newRole)) {
    return { data: null, success: false, error: new Error(`Invalid role: ${newRole}`) };
  }

  try {
    // Lightweight current-session check for better UX (database RPC remains the true security boundary)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        success: false,
        error: new Error('లాగిన్ అవ్వండి / Authentication required to manage user roles'),
      };
    }

    // Call ONLY the secure RPC function. Never directly update profiles.role!
    const { data, error } = await supabase.rpc('admin_set_user_role', {
      p_user_id: userId,
      p_new_role: newRole,
    });

    if (error) {
      return { data: null, success: false, error: new Error(error.message) };
    }

    return {
      data: data as AdminSetUserRoleResult,
      success: true,
      error: null,
    };
  } catch (err: any) {
    return {
      data: null,
      success: false,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Result returned by the delete_own_account database RPC.
 */
export interface DeleteOwnAccountRpcResult {
  success: boolean;
  deleted_user_id?: string;
  pending_media_urls?: string[];
  avatar_prefix?: string;
  withdrawn_pending_submissions?: number;
  anonymized_submissions?: number;
  anonymized_comments?: number;
}

/**
 * Permanently delete the authenticated user's own account using the Database-First architecture.
 *
 * Sequence:
 * 1. Verify caller authentication via supabase.auth.getUser().
 * 2. Execute database RPC public.delete_own_account() FIRST.
 *    - Derives identity exclusively from auth.uid().
 *    - Enforces sole-admin protection.
 *    - Collects pending submission media URLs BEFORE deleting submission rows.
 *    - Deletes pending submissions atomically.
 *    - Anonymizes retained submissions (reporter_name = 'రచ్చబండ పౌరుడు', reporter_phone = NULL).
 *    - Anonymizes comments (user_name = 'రచ్చబండ పాఠకుడు').
 *    - Deletes auth.users row which cascades through foreign keys.
 *    - Returns execution summary with pending_media_urls and avatar_prefix.
 * 3. If RPC fails:
 *    - Returns failure immediately.
 *    - DOES NOT touch Storage.
 *    - Preserves current session and active account.
 * 4. If RPC succeeds:
 *    - Performs best-effort cleanup of pending submission media returned by the RPC using cleanupSubmissionMedia().
 *    - Performs best-effort cleanup of user avatar storage strictly within avatars/${userId}/.
 *    - Any storage cleanup warnings/failures are logged as non-fatal warnings and MUST NOT fail account deletion.
 *    - Note: Once auth.users is deleted, client storage RLS may prevent client-side deletion.
 *      RLS is never weakened; any unremoved media is treated as best-effort orphan cleanup
 *      suitable for future privileged/cron cleanup.
 * 5. Finally invalidates/signs out the local Supabase session.
 */
export async function deleteOwnAccount(): Promise<{
  success: boolean;
  error: Error | null;
  data?: DeleteOwnAccountRpcResult | null;
}> {
  if (!isSupabaseConfigured) {
    return { success: false, error: new Error('Supabase is not configured') };
  }

  try {
    // 1. Verify caller authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: new Error('లాగిన్ అవ్వండి / Authentication required to delete account'),
      };
    }

    // 2. Call the secure database RPC: delete_own_account() FIRST
    // Database-First architecture: zero storage mutation occurs before DB deletion succeeds.
    // Zero user ID passed from client; database derives identity strictly from auth.uid().
    const { data: rpcData, error: rpcError } = await supabase.rpc('delete_own_account');

    if (rpcError) {
      console.error('[UserService] Account deletion RPC rejected by database:', rpcError.message);
      return {
        success: false,
        error: new Error(rpcError.message || 'ఖాతా తొలగింపు విఫలమైంది / Failed to delete account'),
      };
    }

    const deletionSummary = rpcData as DeleteOwnAccountRpcResult | null;

    // 3. Post-RPC Best-Effort Cleanup: Pending submission media returned by the RPC
    // Approved submission media was never collected by the RPC, preserving published news integrity.
    try {
      const pendingUrls = Array.isArray(deletionSummary?.pending_media_urls)
        ? deletionSummary.pending_media_urls
        : [];

      if (pendingUrls.length > 0) {
        for (const mediaUrl of pendingUrls) {
          if (typeof mediaUrl === 'string' && mediaUrl.trim()) {
            const cleanupRes = await cleanupSubmissionMedia({ imageUrl: mediaUrl });
            if (cleanupRes.errors && cleanupRes.errors.length > 0) {
              console.warn(
                '[UserService] Non-fatal warning cleaning pending submission media post-deletion:',
                cleanupRes.errors
              );
            }
          }
        }
      }
    } catch (pendingMediaErr) {
      console.warn(
        '[UserService] Non-fatal exception cleaning pending submission media post-deletion:',
        pendingMediaErr
      );
    }

    // 4. Post-RPC Best-Effort Cleanup: User avatar storage strictly in submissions-media/avatars/${userId}/
    // Note: Once auth.users row is deleted in the RPC, client storage RLS may prevent client-side deletion.
    // We attempt deletion on a best-effort basis without weakening Storage RLS or using service_role.
    try {
      const avatarPrefix = deletionSummary?.avatar_prefix || `avatars/${user.id}`;
      // Verify prefix strictly belongs to this user
      if (avatarPrefix.startsWith(`avatars/${user.id}`)) {
        const { data: fileList, error: listErr } = await supabase.storage
          .from(SUBMISSIONS_BUCKET)
          .list(avatarPrefix);

        if (listErr) {
          console.warn(
            '[UserService] Non-fatal warning listing user avatar storage post-deletion (may require privileged cleanup):',
            listErr.message
          );
        } else if (fileList && fileList.length > 0) {
          const allowedAvatarPrefix = [`avatars/${user.id}/`];
          for (const file of fileList) {
            const candidatePath = `${avatarPrefix}/${file.name}`;
            const safePath = extractSafeStoragePath(candidatePath, SUBMISSIONS_BUCKET, allowedAvatarPrefix);
            if (safePath) {
              const { error: removeErr } = await deleteMediaFile(SUBMISSIONS_BUCKET, safePath);
              if (removeErr) {
                console.warn(
                  '[UserService] Non-fatal warning removing user avatar file post-deletion (may require privileged cleanup):',
                  removeErr.message
                );
              }
            }
          }
        }
      }
    } catch (avatarErr) {
      console.warn(
        '[UserService] Non-fatal exception cleaning user avatar storage post-deletion:',
        avatarErr
      );
    }

    // 5. Invalidate/sign out local Supabase session
    try {
      await supabase.auth.signOut();
    } catch (signOutErr) {
      console.warn('[UserService] Non-fatal warning signing out local session post-deletion:', signOutErr);
    }

    return {
      success: true,
      error: null,
      data: deletionSummary,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}




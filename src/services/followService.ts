/**
 * @file followService.ts
 * @description Service layer for managing user follows (categories & locations) with Supabase.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { FollowType, FollowItem } from '../types';

export const VALID_FOLLOW_TYPES: FollowType[] = ['category', 'location'];

/**
 * Fetch all followed targets for the authenticated user.
 * Returns an array of FollowItem objects.
 */
export async function fetchUserFollows(): Promise<{
  data: FollowItem[];
  error: Error | null;
}> {
  if (!isSupabaseConfigured) {
    return { data: [], error: null };
  }

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('follows')
      .select('id, user_id, follow_type, target_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: [], error: new Error(error.message) };
    }

    const items: FollowItem[] = (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      followType: row.follow_type as FollowType,
      targetId: row.target_id,
      createdAt: row.created_at,
    }));

    return { data: items, error: null };
  } catch (err: any) {
    return {
      data: [],
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Check whether the authenticated user is currently following a specific target.
 */
export async function isFollowing(
  followType: FollowType,
  targetId: string
): Promise<boolean> {
  if (!isSupabaseConfigured || !targetId) {
    return false;
  }

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return false;
    }

    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('user_id', user.id)
      .eq('follow_type', followType)
      .eq('target_id', targetId)
      .maybeSingle();

    if (error || !data) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Follow a category or location.
 * Derives user_id strictly from supabase.auth.getUser() to prevent identity spoofing.
 * Idempotently handles duplicates using onConflict.
 */
export async function followTarget(
  followType: FollowType,
  targetId: string
): Promise<{ data: FollowItem | null; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured') };
  }

  if (!VALID_FOLLOW_TYPES.includes(followType)) {
    return {
      data: null,
      error: new Error(`Invalid follow_type '${followType}'. Allowed: ${VALID_FOLLOW_TYPES.join(', ')}`),
    };
  }

  if (!targetId) {
    return { data: null, error: new Error('Target ID is required') };
  }

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: new Error('ఫాలో చేయడానికి లాగిన్ అవ్వండి / Please sign in to follow'),
      };
    }

    const { data, error } = await supabase
      .from('follows')
      .upsert(
        {
          user_id: user.id,
          follow_type: followType,
          target_id: targetId,
        },
        { onConflict: 'user_id,follow_type,target_id' }
      )
      .select('id, user_id, follow_type, target_id, created_at')
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    const item: FollowItem = {
      id: data.id,
      userId: data.user_id,
      followType: data.follow_type as FollowType,
      targetId: data.target_id,
      createdAt: data.created_at,
    };

    return { data: item, error: null };
  } catch (err: any) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Unfollow a category or location.
 */
export async function unfollowTarget(
  followType: FollowType,
  targetId: string
): Promise<{ success: boolean; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: new Error('Supabase is not configured') };
  }

  if (!targetId) {
    return { success: false, error: new Error('Target ID is required') };
  }

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: new Error('దయచేసి లాగిన్ అవ్వండి / Authentication required to unfollow'),
      };
    }

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('user_id', user.id)
      .eq('follow_type', followType)
      .eq('target_id', targetId);

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
 * Toggle follow status for a target (follow if not following, unfollow if following).
 */
export async function toggleFollow(
  followType: FollowType,
  targetId: string
): Promise<{ following: boolean; error: Error | null }> {
  const currentlyFollowing = await isFollowing(followType, targetId);

  if (currentlyFollowing) {
    const { success, error } = await unfollowTarget(followType, targetId);
    return { following: !success, error };
  } else {
    const { data, error } = await followTarget(followType, targetId);
    return { following: Boolean(data), error };
  }
}

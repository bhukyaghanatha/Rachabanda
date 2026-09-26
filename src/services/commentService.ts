/**
 * @file commentService.ts
 * @description Service layer for news comments and user engagement with Supabase.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { NewsComment } from '../types';
import { formatTimeAgo } from './newsService';

export interface PostCommentInput {
  newsId: string;
  comment: string;
  userName?: string;
  userLocation?: string;
}

/**
 * Fetch approved comments for a specific news article from Supabase.
 * Respects RLS: Public can view approved comments (is_approved = true).
 */
export async function fetchCommentsByNewsId(
  newsId: string
): Promise<{ data: NewsComment[]; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { data: [], error: null };
  }

  if (!newsId) {
    return { data: [], error: new Error('News ID is required') };
  }

  try {
    const { data, error } = await supabase
      .from('comments')
      .select('id, news_id, user_id, user_name, user_location, comment, likes_count, is_approved, created_at')
      .eq('news_id', newsId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: [], error: new Error(error.message) };
    }

    const comments: NewsComment[] = (data || []).map((row: any) => ({
      id: row.id,
      newsId: row.news_id,
      userId: row.user_id,
      userName: row.user_name || 'రచ్చబండ పాఠకుడు',
      userLocation: row.user_location || 'తెలంగాణ',
      comment: row.comment,
      likes: row.likes_count ?? 0,
      timeAgo: formatTimeAgo(row.created_at),
      createdAt: row.created_at,
      isApproved: row.is_approved,
    }));

    return { data: comments, error: null };
  } catch (err: any) {
    return {
      data: [],
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Post a new comment for an article.
 * Enforces authenticated user identity (cannot impersonate another user).
 */
export async function postComment(
  input: PostCommentInput
): Promise<{ data: NewsComment | null; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured') };
  }

  if (!input.newsId || !input.comment.trim()) {
    return { data: null, error: new Error('News ID and comment text are required') };
  }

  try {
    // 1. Verify authenticated user identity directly with Supabase
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: new Error('కామెంట్ చేయడానికి లాగిన్ అవ్వండి / Authentication required to post comments'),
      };
    }

    const displayName =
      input.userName ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'రచ్చబండ పాఠకుడు';

    const locationName = input.userLocation || 'తెలంగాణ';

    // 2. Insert comment with verified user_id (prevents client spoofing)
    const { data, error } = await supabase
      .from('comments')
      .insert({
        news_id: input.newsId,
        user_id: user.id, // Authenticated user ID only
        user_name: displayName,
        user_location: locationName,
        comment: input.comment.trim(),
        likes_count: 0,
        is_approved: true, // Auto-approved by default in schema
      })
      .select('id, news_id, user_id, user_name, user_location, comment, likes_count, is_approved, created_at')
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    const createdComment: NewsComment = {
      id: data.id,
      newsId: data.news_id,
      userId: data.user_id,
      userName: data.user_name,
      userLocation: data.user_location,
      comment: data.comment,
      likes: data.likes_count ?? 0,
      timeAgo: 'ఇప్పుడే',
      createdAt: data.created_at,
      isApproved: data.is_approved,
    };

    return { data: createdComment, error: null };
  } catch (err: any) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Delete a comment.
 * Respects RLS: auth.uid() = user_id OR public.is_admin_or_editor()
 */
export async function deleteComment(
  commentId: string
): Promise<{ success: boolean; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: new Error('Supabase is not configured') };
  }

  if (!commentId) {
    return { success: false, error: new Error('Comment ID is required') };
  }

  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

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

export interface ModerationComment extends NewsComment {
  newsTitle?: string;
}

export interface FetchModerationCommentsOptions {
  isApproved?: boolean;
  limit?: number;
}

/**
 * Fetch comments across all articles for admin/editor moderation.
 * Respects RLS: staff (admin/editor) can view all comments (both approved and hidden).
 * Includes the joined news article title via foreign-key relationship news:news_id(id, title).
 */
export async function fetchAllCommentsForModeration(
  options?: FetchModerationCommentsOptions
): Promise<{ data: ModerationComment[]; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { data: [], error: null };
  }

  try {
    const limit = options?.limit ?? 100;
    let query = supabase
      .from('comments')
      .select('id, news_id, user_id, user_name, user_location, comment, likes_count, is_approved, created_at, news:news_id(id, title)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (options?.isApproved !== undefined) {
      query = query.eq('is_approved', options.isApproved);
    }

    const { data, error } = await query;

    if (error) {
      return { data: [], error: new Error(error.message) };
    }

    const comments: ModerationComment[] = (data || []).map((row: any) => {
      const newsObj = Array.isArray(row.news) ? row.news[0] : row.news;
      return {
        id: row.id,
        newsId: row.news_id,
        newsTitle: newsObj?.title || undefined,
        userId: row.user_id,
        userName: row.user_name || 'రచ్చబండ పాఠకుడు',
        userLocation: row.user_location || 'తెలంగాణ',
        comment: row.comment,
        likes: row.likes_count ?? 0,
        timeAgo: formatTimeAgo(row.created_at),
        createdAt: row.created_at,
        isApproved: row.is_approved,
      };
    });

    return { data: comments, error: null };
  } catch (err: any) {
    return {
      data: [],
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Update a comment's approval status (Approve or Hide) for moderation.
 * Respects RLS: staff (admin/editor) only.
 * Updates ONLY the is_approved field.
 */
export async function updateCommentApproval(
  commentId: string,
  isApproved: boolean
): Promise<{ data: ModerationComment | null; success: boolean; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { data: null, success: false, error: new Error('Supabase is not configured') };
  }

  if (!commentId) {
    return { data: null, success: false, error: new Error('Comment ID is required') };
  }

  try {
    // 1. Verify authenticated user identity with Supabase
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        success: false,
        error: new Error('కామెంట్ మోడరేట్ చేయడానికి లాగిన్ అవ్వండి / Authentication required to moderate comments'),
      };
    }

    // 2. Update ONLY the is_approved field (caller cannot modify any other column)
    const { data, error } = await supabase
      .from('comments')
      .update({ is_approved: Boolean(isApproved) })
      .eq('id', commentId)
      .select('id, news_id, user_id, user_name, user_location, comment, likes_count, is_approved, created_at, news:news_id(id, title)')
      .single();

    if (error) {
      return { data: null, success: false, error: new Error(error.message) };
    }

    const newsObj = Array.isArray(data.news) ? data.news[0] : data.news;
    const updatedComment: ModerationComment = {
      id: data.id,
      newsId: data.news_id,
      newsTitle: newsObj?.title || undefined,
      userId: data.user_id,
      userName: data.user_name,
      userLocation: data.user_location,
      comment: data.comment,
      likes: data.likes_count ?? 0,
      timeAgo: formatTimeAgo(data.created_at),
      createdAt: data.created_at,
      isApproved: data.is_approved,
    };

    return { data: updatedComment, success: true, error: null };
  } catch (err: any) {
    return {
      data: null,
      success: false,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}


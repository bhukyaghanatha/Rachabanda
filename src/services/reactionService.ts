/**
 * @file reactionService.ts
 * @description Service layer for news reactions (like, love, support, angry) with Supabase.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ReactionType, ReactionItem, ReactionCounts } from '../types';

export const VALID_REACTIONS: ReactionType[] = ['like', 'love', 'support', 'angry'];

/**
 * Fetch the authenticated user's reaction for a specific news article.
 * If user is not authenticated or has not reacted, returns null.
 */
export async function fetchUserReaction(
  newsId: string
): Promise<{ reaction: ReactionType | null; data: ReactionItem | null; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { reaction: null, data: null, error: null };
  }

  if (!newsId) {
    return { reaction: null, data: null, error: new Error('News ID is required') };
  }

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { reaction: null, data: null, error: null };
    }

    const { data, error } = await supabase
      .from('reactions')
      .select('id, news_id, user_id, reaction, created_at')
      .eq('news_id', newsId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      return { reaction: null, data: null, error: new Error(error.message) };
    }

    if (!data) {
      return { reaction: null, data: null, error: null };
    }

    return {
      reaction: data.reaction as ReactionType,
      data: {
        id: data.id,
        newsId: data.news_id,
        userId: data.user_id,
        reaction: data.reaction as ReactionType,
        createdAt: data.created_at,
      },
      error: null,
    };
  } catch (err: any) {
    return {
      reaction: null,
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Bulk fetch authenticated user's reactions for a list of news IDs.
 * Returns a map of newsId -> ReactionType.
 */
export async function fetchUserReactions(
  newsIds: string[]
): Promise<{ data: Record<string, ReactionType>; error: Error | null }> {
  if (!isSupabaseConfigured || !newsIds.length) {
    return { data: {}, error: null };
  }

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: {}, error: null };
    }

    const { data, error } = await supabase
      .from('reactions')
      .select('news_id, reaction')
      .in('news_id', newsIds)
      .eq('user_id', user.id);

    if (error) {
      return { data: {}, error: new Error(error.message) };
    }

    const map: Record<string, ReactionType> = {};
    if (data) {
      for (const row of data) {
        map[row.news_id] = row.reaction as ReactionType;
      }
    }

    return { data: map, error: null };
  } catch (err: any) {
    return {
      data: {},
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Set (create or update) a reaction for the authenticated user on a news article.
 * Enforces authenticated identity: user_id is derived strictly from auth.getUser().
 */
export async function setReaction(
  newsId: string,
  reaction: ReactionType
): Promise<{ data: ReactionItem | null; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured') };
  }

  if (!newsId) {
    return { data: null, error: new Error('News ID is required') };
  }

  if (!VALID_REACTIONS.includes(reaction)) {
    return {
      data: null,
      error: new Error(`Invalid reaction '${reaction}'. Allowed values: ${VALID_REACTIONS.join(', ')}`),
    };
  }

  try {
    // 1. Verify authenticated user identity
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: new Error('దయచేసి లాగిన్ అవ్వండి / Authentication required to react to articles'),
      };
    }

    // 2. Upsert reaction row with strictly authenticated user_id
    const { data, error } = await supabase
      .from('reactions')
      .upsert(
        {
          news_id: newsId,
          user_id: user.id,
          reaction: reaction,
        },
        { onConflict: 'news_id,user_id' }
      )
      .select('id, news_id, user_id, reaction, created_at')
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    const item: ReactionItem = {
      id: data.id,
      newsId: data.news_id,
      userId: data.user_id,
      reaction: data.reaction as ReactionType,
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
 * Remove a user's reaction from a news article.
 */
export async function removeReaction(
  newsId: string
): Promise<{ success: boolean; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: new Error('Supabase is not configured') };
  }

  if (!newsId) {
    return { success: false, error: new Error('News ID is required') };
  }

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: new Error('దయచేసి లాగిన్ అవ్వండి / Authentication required to remove reactions'),
      };
    }

    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('news_id', newsId)
      .eq('user_id', user.id);

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
 * Fetch reaction counts for a news article from public.reactions.
 * Note: Under the existing RLS policy (USING auth.uid() = user_id),
 * only rows visible to the caller are aggregated.
 */
export async function fetchReactionCounts(
  newsId: string
): Promise<{ counts: ReactionCounts; error: Error | null }> {
  const counts: ReactionCounts = {
    like: 0,
    love: 0,
    support: 0,
    angry: 0,
    total: 0,
  };

  if (!isSupabaseConfigured || !newsId) {
    return { counts, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('reactions')
      .select('reaction')
      .eq('news_id', newsId);

    if (error) {
      return { counts, error: new Error(error.message) };
    }

    if (data) {
      for (const row of data) {
        if (row.reaction && row.reaction in counts) {
          counts[row.reaction as ReactionType]++;
          counts.total++;
        }
      }
    }

    return { counts, error: null };
  } catch (err: any) {
    return {
      counts,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

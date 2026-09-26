/**
 * @file notificationService.ts
 * @description Service layer for querying and managing user notifications from Supabase.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { NotificationItem } from '../types';

/**
 * Fetch all notifications for the authenticated caller.
 * Derives user_id strictly from supabase.auth.getUser().
 */
export async function fetchUserNotifications(): Promise<{
  data: NotificationItem[];
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
      .from('notifications')
      .select('id, user_id, title, message, type, link, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return { data: [], error: new Error(error.message) };
    }

    const items: NotificationItem[] = (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      message: row.message,
      type: row.type,
      link: row.link,
      isRead: Boolean(row.is_read),
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
 * Get count of unread notifications for the authenticated caller.
 */
export async function getUnreadNotificationCount(): Promise<number> {
  if (!isSupabaseConfigured) {
    return 0;
  }

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return 0;
    }

    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      console.warn('Could not count unread notifications:', error.message);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.warn('Error fetching unread notification count:', err);
    return 0;
  }
}

/**
 * Mark a single notification as read for the authenticated caller.
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<{ success: boolean; error: Error | null }> {
  if (!isSupabaseConfigured || !notificationId) {
    return { success: false, error: new Error('Invalid arguments or Supabase unconfigured') };
  }

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: new Error('లాగిన్ అవ్వండి / Authentication required to update notification'),
      };
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
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
 * Mark all unread notifications as read for the authenticated caller.
 */
export async function markAllNotificationsAsRead(): Promise<{
  success: boolean;
  error: Error | null;
}> {
  if (!isSupabaseConfigured) {
    return { success: false, error: new Error('Supabase is not configured') };
  }

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: new Error('లాగిన్ అవ్వండి / Authentication required to update notifications'),
      };
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

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
 * Create a notification for the authenticated user.
 * Derived user_id strictly equals supabase.auth.getUser().
 * Arbitrary user_id injection is prevented by database RLS and local validation.
 */
export async function createNotification(params: {
  title: string;
  message: string;
  type?: string;
  link?: string | null;
}): Promise<{ data: NotificationItem | null; error: Error | null }> {
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
        error: new Error('లాగిన్ అవ్వండి / Authentication required to create notification'),
      };
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        title: params.title.trim(),
        message: params.message.trim(),
        type: params.type || 'system',
        link: params.link || null,
        is_read: false,
      })
      .select('id, user_id, title, message, type, link, is_read, created_at')
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    const item: NotificationItem = {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      message: data.message,
      type: data.type,
      link: data.link,
      isRead: Boolean(data.is_read),
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

/**
 * @file reportService.ts
 * @description Service layer for user content reporting and staff moderation (#8D-1).
 * Enforces authenticated reporter identity from session, RLS boundaries, and duplicate protection.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  ContentReport,
  ContentReportType,
  ContentReportReason,
  ContentReportStatus,
  CreateContentReportInput,
  ModerationContentReport,
} from '../types';

export const ALLOWED_REPORT_REASONS: ContentReportReason[] = [
  'misinformation',
  'hate_speech',
  'harassment',
  'spam',
  'inappropriate',
  'copyright',
  'other',
];

export const ALLOWED_REPORT_STATUSES: ContentReportStatus[] = [
  'pending',
  'reviewed',
  'dismissed',
  'actioned',
];

/**
 * Maps database row from public.content_reports to strongly-typed ContentReport object.
 */
function mapDatabaseReportToContentReport(row: any): ContentReport {
  return {
    id: row.id,
    reporterId: row.reporter_id || null,
    contentType: row.content_type,
    contentId: row.content_id,
    reason: row.reason,
    details: row.details || null,
    status: row.status,
    reviewedBy: row.reviewed_by || null,
    reviewedAt: row.reviewed_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Submit a content report (for a news article or user comment).
 * Security guarantees:
 * - Requires active authenticated session
 * - Derives reporter_id exclusively from auth.uid() (blocks caller spoofing)
 * - Validates content type, ID, and reason
 * - Enforces database-level duplicate pending report prevention (409 Conflict / 23505)
 * - Enforces target existence validation via database trigger (23503)
 */
export async function createContentReport(
  input: CreateContentReportInput
): Promise<{ data: ContentReport | null; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }

  // 1. Session verification: strictly derive reporter_id from authenticated session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      data: null,
      error: new Error('లాగిన్ అవ్వండి / Authentication required to submit a report'),
    };
  }

  // 2. Client-side input validation
  const { contentType, contentId, reason, details } = input;

  if (contentType !== 'news' && contentType !== 'comment') {
    return {
      data: null,
      error: new Error('చెల్లని కంటెంట్ రకం. / Invalid content type (must be news or comment).'),
    };
  }

  if (!contentId || typeof contentId !== 'string' || !contentId.trim()) {
    return {
      data: null,
      error: new Error('కంటెంట్ ID అవసరం. / Content ID is required.'),
    };
  }

  if (!ALLOWED_REPORT_REASONS.includes(reason)) {
    return {
      data: null,
      error: new Error('చెల్లని రిపోర్ట్ కారణం. / Invalid report reason.'),
    };
  }

  try {
    const { data, error } = await supabase
      .from('content_reports')
      .insert({
        reporter_id: user.id,
        content_type: contentType,
        content_id: contentId.trim(),
        reason,
        details: details?.trim() || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      // Postgres error 23505: partial unique index violation (duplicate pending report)
      if (error.code === '23505') {
        return {
          data: null,
          error: new Error(
            'మీరు ఇప్పటికే ఈ కంటెంట్‌పై రిపోర్ట్ సమర్పించారు. మా బృందం పరిశీలిస్తోంది. / You have already submitted a pending report for this item.'
          ),
        };
      }

      // Postgres error 23503: target validation trigger violation (content doesn't exist)
      if (error.code === '23503') {
        return {
          data: null,
          error: new Error(
            'రిపోర్ట్ చేయబడిన కంటెంట్ కనుగొనబడలేదు లేదా తీసివేయబడింది. / The reported content does not exist.'
          ),
        };
      }

      return { data: null, error: new Error(error.message) };
    }

    return { data: mapDatabaseReportToContentReport(data), error: null };
  } catch (err: any) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Fetch reports submitted by the current authenticated user.
 * Protected by database RLS: auth.uid() = reporter_id.
 */
export async function fetchMyReports(): Promise<{
  data: ContentReport[];
  error: Error | null;
}> {
  if (!isSupabaseConfigured) {
    return { data: [], error: null };
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      data: [],
      error: new Error('లాగిన్ అవ్వండి / Authentication required to view your reports'),
    };
  }

  try {
    const { data, error } = await supabase
      .from('content_reports')
      .select('*')
      .eq('reporter_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: [], error: new Error(error.message) };
    }

    const items = (data || []).map(mapDatabaseReportToContentReport);
    return { data: items, error: null };
  } catch (err: any) {
    return {
      data: [],
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Fetch reports for staff moderation (admin or editor only).
 * Protected by database Row Level Security: public.is_admin_or_editor().
 */
export async function fetchReportsForModeration(filters?: {
  status?: ContentReportStatus;
  contentType?: ContentReportType;
  limit?: number;
}): Promise<{ data: ModerationContentReport[]; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { data: [], error: null };
  }

  try {
    let query = supabase
      .from('content_reports')
      .select(`
        *,
        reporter:reporter_id(id, full_name)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.contentType) {
      query = query.eq('content_type', filters.contentType);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      return { data: [], error: new Error(error.message) };
    }

    const rawRows = data || [];
    const moderationReports: ModerationContentReport[] = [];

    // Gather content IDs to enrich moderation view with target context
    const newsIds = rawRows.filter((r) => r.content_type === 'news').map((r) => r.content_id);
    const commentIds = rawRows.filter((r) => r.content_type === 'comment').map((r) => r.content_id);

    let newsMap: Record<string, { title: string; short_summary?: string; author_name?: string }> = {};
    let commentMap: Record<string, { comment: string; user_name?: string }> = {};

    if (newsIds.length > 0) {
      const { data: newsItems } = await supabase
        .from('news')
        .select('id, title, short_summary, source')
        .in('id', newsIds);

      (newsItems || []).forEach((n: any) => {
        newsMap[n.id] = {
          title: n.title,
          short_summary: n.short_summary,
          author_name: n.source,
        };
      });
    }

    if (commentIds.length > 0) {
      const { data: commentItems } = await supabase
        .from('comments')
        .select('id, comment, user_name')
        .in('id', commentIds);

      (commentItems || []).forEach((c: any) => {
        commentMap[c.id] = {
          comment: c.comment,
          user_name: c.user_name,
        };
      });
    }

    for (const row of rawRows) {
      const baseReport = mapDatabaseReportToContentReport(row);
      const reporterObj = Array.isArray(row.reporter) ? row.reporter[0] : row.reporter;

      let targetTitle: string | undefined;
      let targetSnippet: string | undefined;
      let targetAuthorName: string | undefined;

      if (row.content_type === 'news') {
        const news = newsMap[row.content_id];
        targetTitle = news?.title;
        targetSnippet = news?.short_summary;
        targetAuthorName = news?.author_name;
      } else if (row.content_type === 'comment') {
        const comm = commentMap[row.content_id];
        targetSnippet = comm?.comment;
        targetAuthorName = comm?.user_name;
      }

      moderationReports.push({
        ...baseReport,
        reporterName: reporterObj?.full_name || 'రచ్చబండ యూజర్',
        targetTitle,
        targetSnippet,
        targetAuthorName,
      });
    }

    return { data: moderationReports, error: null };
  } catch (err: any) {
    return {
      data: [],
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Update report status during editorial moderation (reviewed, dismissed, actioned).
 * Protected by database Row Level Security: public.is_admin_or_editor().
 */
export async function updateReportStatus(
  reportId: string,
  status: ContentReportStatus
): Promise<{ data: ContentReport | null; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }

  if (!ALLOWED_REPORT_STATUSES.includes(status)) {
    return { data: null, error: new Error(`Invalid status '${status}'`) };
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      data: null,
      error: new Error('మోడరేషన్ కోసం లాగిన్ అవ్వండి / Authentication required to moderate reports'),
    };
  }

  try {
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from('content_reports')
      .update({
        status,
        reviewed_by: user.id,
        reviewed_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', reportId)
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: mapDatabaseReportToContentReport(data), error: null };
  } catch (err: any) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

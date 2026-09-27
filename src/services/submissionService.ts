/**
 * @file submissionService.ts
 * @description Service layer for citizen news submissions and editorial approval workflow using Supabase.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { NewsSubmission, CreateSubmissionInput } from '../types';
import { formatTimeAgo } from './newsService';
import { cleanupSubmissionMedia } from './storageService';

/**
 * Generate a URL-friendly and unique slug for news articles.
 */
function generateNewsSlug(title: string): string {
  // Transliterate or clean non-ASCII characters, with timestamp suffix for uniqueness
  const clean = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u0C00-\u0C7F-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50);

  const uniqueSuffix = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  return clean ? `${clean}-${uniqueSuffix}` : `news-${uniqueSuffix}`;
}

/**
 * Maps a raw Supabase submissions table row into the frontend NewsSubmission model.
 */
export function mapDatabaseSubmissionToNewsSubmission(row: any): NewsSubmission {
  const createdAt = row.created_at || new Date().toISOString();
  return {
    id: row.id,
    userId: row.user_id || null,
    reporterName: row.reporter_name || 'పౌర రిపోర్టర్',
    reporterPhone: row.reporter_phone || null,
    title: row.title || '',
    details: row.details || '',
    locationId: row.location_id || null,
    locationText: row.location_text || 'ఖమ్మం',
    categoryId: row.category_id || null,
    categoryText: row.category_text || 'స్థానిక',
    imageUrl: row.image_url || null,
    audioUrl: row.audio_url || null,
    videoUrl: row.video_url || null,
    status: row.status || 'pending',
    rejectionReason: row.rejection_reason || null,
    reviewedBy: row.reviewed_by || null,
    reviewedAt: row.reviewed_at || null,
    publishedNewsId: row.published_news_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // UI compatibility fields
    location: row.location_text || 'ఖమ్మం',
    category: row.category_text || 'స్థానిక',
    timeAgo: formatTimeAgo(createdAt),
    timestamp: new Date(createdAt).getTime(),
    hasVoice: Boolean(row.audio_url),
    hasVideo: Boolean(row.video_url),
  };
}

/**
 * Submit a citizen news report to Supabase `public.submissions`.
 * Accessible to both authenticated users and anonymous citizens.
 * Default status is always enforced as 'pending'.
 */
export async function createSubmission(
  input: CreateSubmissionInput,
  userId?: string | null
): Promise<{ data: NewsSubmission | null; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: new Error('Supabase is not configured. Please check your .env.local file.'),
    };
  }

  try {
    const payload = {
      user_id: userId || null,
      reporter_name: input.reporterName.trim() || 'పౌర రిపోర్టర్',
      reporter_phone: input.reporterPhone?.trim() || null,
      title: input.title.trim(),
      details: input.details.trim(),
      category_id: input.categoryId || null,
      category_text: input.categoryText.trim() || 'స్థానిక',
      location_id: input.locationId || null,
      location_text: input.locationText.trim() || 'తెలంగాణ',
      image_url: input.imageUrl || null,
      audio_url: input.audioUrl || null,
      video_url: input.videoUrl || null,
      status: 'pending' as const, // Never allow direct publication from client
    };

    if (userId) {
      const { data, error } = await supabase
        .from('submissions')
        .insert(payload)
        .select()
        .single();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: mapDatabaseSubmissionToNewsSubmission(data), error: null };
    } else {
      // Anonymous submission: RLS policy allows INSERT with check(true),
      // but SELECT is restricted to auth.uid() = user_id or staff.
      // Do not append .select() for anonymous inserts so RLS select check is avoided.
      const { error } = await supabase
        .from('submissions')
        .insert(payload);

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return {
        data: mapDatabaseSubmissionToNewsSubmission({
          ...payload,
          id: `sub-${Date.now()}`,
          created_at: new Date().toISOString(),
        }),
        error: null,
      };
    }
  } catch (err: any) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Fetch all submissions for the Admin/Editor Dashboard.
 * Protected by database Row Level Security (RLS) - requires role = 'admin' | 'editor'.
 */
export async function fetchSubmissions(): Promise<{ data: NewsSubmission[]; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { data: [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: [], error: new Error(error.message) };
    }

    const items = (data || []).map(mapDatabaseSubmissionToNewsSubmission);
    return { data: items, error: null };
  } catch (err: any) {
    return {
      data: [],
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Fetch only the submissions authored by the current authenticated user.
 * Protected by database Row Level Security (auth.uid() = user_id).
 */
export async function fetchMySubmissions(
  userId: string
): Promise<{ data: NewsSubmission[]; error: Error | null }> {
  if (!isSupabaseConfigured || !userId) {
    return { data: [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: [], error: new Error(error.message) };
    }

    const items = (data || []).map(mapDatabaseSubmissionToNewsSubmission);
    return { data: items, error: null };
  } catch (err: any) {
    return {
      data: [],
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Backward compatibility alias for fetchMySubmissions.
 */
export const fetchUserSubmissions = fetchMySubmissions;

/**
 * Editorial Approval Workflow:
 * 1. Verifies the submission exists and is in 'pending' status.
 * 2. Creates a published news record in `public.news`.
 * 3. Associates categories in `public.news_categories`.
 * 4. Associates locations in `public.news_locations`.
 * 5. Updates `public.submissions` (status='approved', reviewed_by, reviewed_at, published_news_id).
 */
export async function approveSubmission(
  submissionId: string,
  reviewerId: string
): Promise<{ data: { submission: NewsSubmission; newsId: string } | null; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }

  try {
    // 1. Primary: Execute atomic transactional approval via PostgreSQL RPC function
    const { data: rpcResult, error: rpcError } = await supabase.rpc('approve_submission', {
      p_submission_id: submissionId,
    });

    if (!rpcError && rpcResult && (rpcResult as any).success) {
      const createdNewsId = (rpcResult as any).news_id;
      const { data: updatedSub } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      return {
        data: {
          submission: updatedSub
            ? mapDatabaseSubmissionToNewsSubmission(updatedSub)
            : ({ id: submissionId, status: 'approved', publishedNewsId: createdNewsId } as any),
          newsId: createdNewsId,
        },
        error: null,
      };
    }

    // If RPC returned a security or validation error, return it immediately
    if (rpcError && rpcError.code !== 'PGRST202') {
      return { data: null, error: new Error(rpcError.message) };
    }

    // 2. Fallback (if RPC not yet created in Supabase SQL editor):
    // Step 1: Verify submission is pending
    const { data: subRow, error: fetchErr } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchErr || !subRow) {
      return { data: null, error: new Error(fetchErr?.message || 'Submission not found.') };
    }

    if (subRow.status !== 'pending') {
      return {
        data: null,
        error: new Error(`ఈ వార్త ఇప్పటికే '${subRow.status}' స్థితిలో ఉంది. / Submission is already ${subRow.status}.`),
      };
    }

    // Step 2: Create published news record in public.news
    const newsSlug = generateNewsSlug(subRow.title);
    const shortSummary =
      subRow.details.length > 180 ? `${subRow.details.slice(0, 177)}...` : subRow.details;

    const newsPayload = {
      title: subRow.title,
      slug: newsSlug,
      short_summary: shortSummary,
      content: subRow.details,
      language: 'te',
      author_id: subRow.user_id || reviewerId,
      status: 'published' as const,
      cover_image:
        subRow.image_url ||
        'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
      audio_url: subRow.audio_url || null,
      audio_duration: '1:00',
      video_url: subRow.video_url || null,
      is_breaking: false,
      is_video: Boolean(subRow.video_url),
      fact_checked: true,
      source: subRow.reporter_name || 'రచ్చ బండ పౌర రిపోర్టర్',
      published_at: new Date().toISOString(),
    };

    const { data: newsData, error: newsErr } = await supabase
      .from('news')
      .insert(newsPayload)
      .select()
      .single();

    if (newsErr || !newsData) {
      return { data: null, error: new Error(`News creation failed: ${newsErr?.message}`) };
    }

    const createdNewsId = newsData.id;

    // Step 3: Link Category
    if (subRow.category_id) {
      const { error: catRelErr } = await supabase
        .from('news_categories')
        .insert({
          news_id: createdNewsId,
          category_id: subRow.category_id,
        });

      if (catRelErr) {
        console.warn('Could not link news_categories:', catRelErr.message);
      }
    }

    // Step 4: Link Location
    if (subRow.location_id) {
      const { error: locRelErr } = await supabase
        .from('news_locations')
        .insert({
          news_id: createdNewsId,
          location_id: subRow.location_id,
        });

      if (locRelErr) {
        console.warn('Could not link news_locations:', locRelErr.message);
      }
    }

    // Step 4b: Insert uploaded media into public.news_media
    const mediaRecords: Array<{
      news_id: string;
      media_type: 'image' | 'video' | 'audio';
      media_url: string;
      caption?: string;
      display_order: number;
    }> = [];

    if (subRow.image_url && subRow.image_url.trim()) {
      mediaRecords.push({
        news_id: createdNewsId,
        media_type: 'image',
        media_url: subRow.image_url,
        caption: subRow.title,
        display_order: 1,
      });
    }

    if (subRow.audio_url && subRow.audio_url.trim()) {
      mediaRecords.push({
        news_id: createdNewsId,
        media_type: 'audio',
        media_url: subRow.audio_url,
        caption: 'వాయిస్ రిపోర్ట్ (Voice Report)',
        display_order: 2,
      });
    }

    if (subRow.video_url && subRow.video_url.trim()) {
      mediaRecords.push({
        news_id: createdNewsId,
        media_type: 'video',
        media_url: subRow.video_url,
        caption: 'వీడియో కవరేజ్ (Video Coverage)',
        display_order: 3,
      });
    }

    if (mediaRecords.length > 0) {
      const { error: mediaErr } = await supabase
        .from('news_media')
        .insert(mediaRecords);

      if (mediaErr) {
        console.warn('Could not insert news_media records:', mediaErr.message);
      }
    }

    // Step 5: Update submission to approved
    const nowIso = new Date().toISOString();
    const { data: updatedSub, error: updateErr } = await supabase
      .from('submissions')
      .update({
        status: 'approved',
        reviewed_by: reviewerId,
        reviewed_at: nowIso,
        published_news_id: createdNewsId,
        updated_at: nowIso,
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (updateErr) {
      return {
        data: null,
        error: new Error(`Submission update failed: ${updateErr.message}`),
      };
    }

    return {
      data: {
        submission: mapDatabaseSubmissionToNewsSubmission(updatedSub),
        newsId: createdNewsId,
      },
      error: null,
    };
  } catch (err: any) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Editorial Rejection Workflow:
 * Atomically rejects a pending submission using the SECURITY DEFINER RPC `public.reject_submission`.
 * Enforces:
 * - admin/editor role
 * - reviewer_id matches auth.uid()
 * - FOR UPDATE row lock (prevents approve/reject race)
 * - requires status = 'pending'
 * - validates reason length (1-500 chars)
 * - sets reviewed_by, reviewed_at, rejection_reason, status = 'rejected'
 * 
 * After the database update succeeds, best-effort media cleanup is performed in storage.
 * If media cleanup fails, rejection remains successful and the failure is nonfatal.
 * Preserves the rejected submission history in the database.
 */
export async function rejectSubmission(
  submissionId: string,
  reviewerId: string,
  reason?: string
): Promise<{ data: NewsSubmission | null; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }

  const trimmedReason = reason?.trim() || 'సంపాదక విభాగం మార్గదర్శకాలకు అనుగుణంగా లేదు.';
  if (trimmedReason.length > 500) {
    return {
      data: null,
      error: new Error('తిరస్కరణ కారణం 500 అక్షరాల కంటే తక్కువగా ఉండాలి. / Rejection reason must be under 500 characters.'),
    };
  }

  try {
    // 1. Primary: Execute atomic transactional rejection via PostgreSQL RPC function
    const { data: rpcResult, error: rpcError } = await supabase.rpc('reject_submission', {
      p_submission_id: submissionId,
      p_reason: trimmedReason,
      p_reviewer_id: reviewerId,
    });

    if (!rpcError && rpcResult && (rpcResult as any).success) {
      // Fetch updated submission record to return full mapped object
      const { data: updatedSub } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      // Best-effort storage cleanup after database transaction succeeds
      if (Array.isArray((rpcResult as any).media_urls) && (rpcResult as any).media_urls.length > 0) {
        try {
          await cleanupSubmissionMedia({
            mediaUrls: (rpcResult as any).media_urls,
          });
        } catch (cleanupErr) {
          console.warn('[SubmissionService] Non-fatal cleanup error for rejected submission media:', cleanupErr);
        }
      }

      return {
        data: updatedSub
          ? mapDatabaseSubmissionToNewsSubmission(updatedSub)
          : ({
              id: submissionId,
              status: 'rejected',
              rejectionReason: trimmedReason,
              reviewedBy: reviewerId,
            } as any),
        error: null,
      };
    }

    // If RPC returned a validation or permission error, surface it immediately
    if (rpcError && rpcError.code !== 'PGRST202') {
      return { data: null, error: new Error(rpcError.message) };
    }

    // 2. Fallback (if RPC not yet created in local/remote environment):
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from('submissions')
      .update({
        status: 'rejected',
        reviewed_by: reviewerId,
        reviewed_at: nowIso,
        rejection_reason: trimmedReason,
        updated_at: nowIso,
      })
      .eq('id', submissionId)
      .eq('status', 'pending') // Defense: only reject pending rows
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    // Safely remove associated media from public storage upon rejection.
    // Handles missing files gracefully and never fails the rejection.
    if (data) {
      try {
        await cleanupSubmissionMedia({
          imageUrl: data.image_url,
          audioUrl: data.audio_url,
          videoUrl: data.video_url,
        });
      } catch (cleanupErr) {
        console.warn('[SubmissionService] Non-fatal cleanup error for rejected submission media:', cleanupErr);
      }
    }

    return { data: mapDatabaseSubmissionToNewsSubmission(data), error: null };
  } catch (err: any) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Withdraw an authenticated user's own pending submission.
 * Calls the atomic SECURITY DEFINER RPC `public.withdraw_own_submission(p_submission_id)`.
 * The RPC enforces:
 * - auth.uid() IS NOT NULL
 * - caller is genuine owner (user_id = auth.uid())
 * - status = 'pending'
 * - FOR UPDATE row lock
 * - collects media URLs before row deletion
 * - deletes the row
 * 
 * After the database RPC succeeds, best-effort media cleanup is performed in storage.
 * Cleanup failures are non-fatal.
 */
export async function withdrawOwnSubmission(
  submissionId: string
): Promise<{ success: boolean; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: new Error('Supabase is not configured.') };
  }

  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc('withdraw_own_submission', {
      p_submission_id: submissionId,
    });

    if (rpcError) {
      return { success: false, error: new Error(rpcError.message) };
    }

    // Best-effort storage cleanup after successful DB deletion
    if (rpcResult && Array.isArray((rpcResult as any).media_urls)) {
      try {
        await cleanupSubmissionMedia({
          mediaUrls: (rpcResult as any).media_urls,
        });
      } catch (cleanErr) {
        console.warn('[SubmissionService] Non-fatal cleanup warning for withdrawn submission:', cleanErr);
      }
    }

    return { success: true, error: null };
  } catch (err: any) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

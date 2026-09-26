/**
 * @file newsService.ts
 * @description Service layer for querying published news, categories, and locations from Supabase.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { NewsItem, CategoryInfo } from '../types';

export interface LocationInfo {
  id: string;
  name: string;
  english_name: string;
  slug: string;
  type: string;
  parent_id?: string | null;
}

/**
 * Format an ISO date string into a user-friendly Telugu relative time string.
 */
export function formatTimeAgo(dateString?: string | null): string {
  if (!dateString) return 'ఇప్పుడే';
  const now = Date.now();
  const publishedTime = new Date(dateString).getTime();
  if (isNaN(publishedTime)) return 'ఇప్పుడే';

  const diffMs = now - publishedTime;
  if (diffMs < 0) return 'ఇప్పుడే';

  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return 'ఇప్పుడే';
  if (minutes < 60) return `${minutes} నిమిషాల క్రితం`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} గంటల క్రితం`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'నిన్న';
  if (days < 30) return `${days} రోజుల క్రితం`;

  const months = Math.floor(days / 30);
  return `${months} నెలల క్రితం`;
}

/**
 * Format an ISO date string into a formal Telugu date representation.
 */
export function formatTeluguDate(dateString?: string | null): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';

  const day = d.getDate();
  const months = [
    'జనవరి',
    'ఫిబ్రవరి',
    'మార్చి',
    'ఏప్రిల్',
    'మే',
    'జూన్',
    'జూలై',
    'ఆగస్టు',
    'సెప్టెంబర్',
    'అక్టోబర్',
    'నవంబర్',
    'డిసెంబర్',
  ];
  const monthName = months[d.getMonth()];
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;

  return `${day} ${monthName} ${year}, ${hours}:${minutes} ${ampm}`;
}

/**
 * Maps a Supabase news row and its joined relations into the frontend NewsItem model.
 */
export function mapDatabaseNewsToNewsItem(row: any): NewsItem {
  // Extract primary category name and slug from joined news_categories
  let categoryName = 'సాధారణ';
  let categorySlug = 'general';
  if (row.news_categories && Array.isArray(row.news_categories) && row.news_categories.length > 0) {
    const primaryCat = row.news_categories[0]?.categories;
    if (primaryCat) {
      if (primaryCat.name) categoryName = primaryCat.name;
      if (primaryCat.slug) categorySlug = primaryCat.slug;
    }
  }

  // Extract primary location name and slug from joined news_locations
  let locationName = 'తెలంగాణ';
  let locationSlug = 'telangana';
  if (row.news_locations && Array.isArray(row.news_locations) && row.news_locations.length > 0) {
    const primaryLoc = row.news_locations[0]?.locations;
    if (primaryLoc) {
      if (primaryLoc.name) locationName = primaryLoc.name;
      if (primaryLoc.slug) locationSlug = primaryLoc.slug;
    }
  }

  // Extract author / reporter details
  let reporterName = row.source || 'రచ్చ బండ డెస్క్';
  let reporterId = 'RBV-DESK';
  if (row.profiles) {
    if (row.profiles.full_name) {
      reporterName = row.profiles.full_name;
    }
    if (row.profiles.id) {
      reporterId = `RB-${row.profiles.id.slice(0, 6).toUpperCase()}`;
    }
  } else if (row.author_id) {
    reporterId = `RB-${row.author_id.slice(0, 6).toUpperCase()}`;
  }

  // Extract media items if joined
  const mediaItems =
    row.news_media && Array.isArray(row.news_media)
      ? row.news_media.map((m: any) => ({
          id: m.id,
          newsId: m.news_id,
          mediaType: m.media_type,
          mediaUrl: m.media_url,
          caption: m.caption,
          displayOrder: m.display_order ?? 0,
          createdAt: m.created_at,
        }))
      : undefined;

  return {
    id: row.id,
    title: row.title || '',
    shortSummary: row.short_summary || '',
    content: row.content || '',
    location: locationName,
    category: categoryName,
    categorySlug,
    locationSlug,
    imageUrl:
      row.cover_image ||
      'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
    timeAgo: formatTimeAgo(row.published_at || row.created_at),
    publishedDate: formatTeluguDate(row.published_at || row.created_at),
    reporterName,
    reporterId,
    audioDuration: row.audio_duration || '1:00',
    likes: row.likes_count ?? 0,
    commentsCount: row.comments_count ?? 0,
    isBreaking: Boolean(row.is_breaking),
    isVideo: Boolean(row.is_video || row.video_url),
    videoDuration: row.video_duration || undefined,
    factChecked: Boolean(row.fact_checked),
    audioNarratedText: row.audio_narrated_text || undefined,
    audioUrl: row.audio_url || null,
    videoUrl: row.video_url || null,
    media: mediaItems,
  };
}

/**
 * Fetch all published news articles from Supabase with joined relations.
 */
export async function fetchPublishedNews(): Promise<{ data: NewsItem[]; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { data: [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from('news')
      .select(
        '*, news_categories(categories(id, name, english_name, slug, color, icon_name)), news_locations(locations(id, name, english_name, slug, type)), profiles:author_id(id, full_name, avatar_url, role), news_media(id, news_id, media_type, media_url, caption, display_order, created_at)'
      )
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) {
      return { data: [], error: new Error(error.message) };
    }

    const items: NewsItem[] = (data || []).map(mapDatabaseNewsToNewsItem);
    return { data: items, error: null };
  } catch (err: any) {
    return {
      data: [],
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Fetch active news categories from Supabase.
 */
export async function fetchCategories(): Promise<{ data: CategoryInfo[]; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { data: [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, english_name, slug, color, icon_name, display_order')
      .order('display_order', { ascending: true });

    if (error) {
      return { data: [], error: new Error(error.message) };
    }

    const categories: CategoryInfo[] = (data || []).map((row) => ({
      id: row.slug || row.id,
      uuid: row.id,
      name: row.name,
      englishName: row.english_name,
      color: row.color || '#E41E26',
      iconName: row.icon_name || 'MapPin',
    }));

    return { data: categories, error: null };
  } catch (err: any) {
    return {
      data: [],
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Fetch districts and mandals from Supabase.
 */
export async function fetchLocations(): Promise<{ data: LocationInfo[]; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { data: [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from('locations')
      .select('id, name, english_name, slug, type, parent_id')
      .order('name', { ascending: true });

    if (error) {
      return { data: [], error: new Error(error.message) };
    }

    return { data: data || [], error: null };
  } catch (err: any) {
    return {
      data: [],
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Search published news articles in Supabase.
 * Searches across title, short_summary, content, category, and location.
 * Strictly filters by status = 'published'.
 */
export async function searchPublishedNews(
  query: string,
  limit: number = 25
): Promise<{ data: NewsItem[]; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { data: [], error: null };
  }

  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return { data: [], error: null };
  }

  const relationSelect =
    '*, news_categories(categories(id, name, english_name, slug, color, icon_name)), news_locations(locations(id, name, english_name, slug, type)), profiles:author_id(id, full_name, avatar_url, role), news_media(id, news_id, media_type, media_url, caption, display_order, created_at)';

  try {
    // 1. Primary Strategy: Call PostgreSQL Full-Text Search (FTS) RPC with GIN index
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('search_published_news', {
        p_query: cleanQuery,
        p_limit: limit,
      })
      .select(relationSelect);

    if (!rpcError && Array.isArray(rpcData)) {
      const items: NewsItem[] = rpcData.map(mapDatabaseNewsToNewsItem);
      return { data: items, error: null };
    }

    // 2. Fallback Strategy: If RPC is not yet deployed, seamlessly fall back to relation query
    const [catRes, locRes] = await Promise.all([
      supabase
        .from('categories')
        .select('id')
        .or(`name.ilike.%${cleanQuery}%,english_name.ilike.%${cleanQuery}%,slug.ilike.%${cleanQuery}%`),
      supabase
        .from('locations')
        .select('id')
        .or(`name.ilike.%${cleanQuery}%,english_name.ilike.%${cleanQuery}%,slug.ilike.%${cleanQuery}%`),
    ]);

    const matchingCatIds = (catRes.data || []).map((c: any) => c.id);
    const matchingLocIds = (locRes.data || []).map((l: any) => l.id);

    const relatedNewsIdSet = new Set<string>();
    if (matchingCatIds.length > 0 || matchingLocIds.length > 0) {
      const [newsCatRes, newsLocRes] = await Promise.all([
        matchingCatIds.length > 0
          ? supabase.from('news_categories').select('news_id').in('category_id', matchingCatIds)
          : Promise.resolve({ data: [] }),
        matchingLocIds.length > 0
          ? supabase.from('news_locations').select('news_id').in('location_id', matchingLocIds)
          : Promise.resolve({ data: [] }),
      ]);

      (newsCatRes.data || []).forEach((r: any) => relatedNewsIdSet.add(r.news_id));
      (newsLocRes.data || []).forEach((r: any) => relatedNewsIdSet.add(r.news_id));
    }

    const orClauses = [
      `title.ilike.%${cleanQuery}%`,
      `short_summary.ilike.%${cleanQuery}%`,
      `content.ilike.%${cleanQuery}%`,
    ];

    if (relatedNewsIdSet.size > 0) {
      orClauses.push(`id.in.(${Array.from(relatedNewsIdSet).join(',')})`);
    }

    const { data: fallbackData, error: fallbackError } = await supabase
      .from('news')
      .select(relationSelect)
      .eq('status', 'published')
      .or(orClauses.join(','))
      .order('published_at', { ascending: false })
      .limit(limit);

    if (fallbackError) {
      return { data: [], error: new Error(fallbackError.message) };
    }

    const items: NewsItem[] = (fallbackData || []).map(mapDatabaseNewsToNewsItem);
    return { data: items, error: null };
  } catch (err: any) {
    return {
      data: [],
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

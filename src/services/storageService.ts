/**
 * @file storageService.ts
 * @description Supabase Storage service for uploading, validating, and retrieving media assets.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const SUBMISSIONS_BUCKET = 'submissions-media';
export const NEWS_BUCKET = 'news-media';

// Timeout limits for Supabase Storage uploads by media type
export const STORAGE_IMAGE_TIMEOUT_MS = 30000;  // 30 seconds
export const STORAGE_AUDIO_TIMEOUT_MS = 30000;  // 30 seconds
export const STORAGE_VIDEO_TIMEOUT_MS = 120000; // 120 seconds (2 minutes for up to 50MB videos)

// Default / fallback upload timeout
export const STORAGE_UPLOAD_TIMEOUT_MS = 30000;

// Maximum size limits in bytes
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_AUDIO_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
export const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

// Allowed MIME types
export const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

export const ALLOWED_AUDIO_MIMES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
  'audio/x-m4a',
  'audio/m4a',
];

export const ALLOWED_VIDEO_MIMES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

export type MediaType = 'image' | 'audio' | 'video';

export interface MediaValidationResult {
  valid: boolean;
  error?: string;
}

export interface UploadMediaResult {
  url: string | null;
  path: string | null;
  error: Error | null;
}

/**
 * Validates file type and size on client-side before initiating network upload.
 */
export function validateMediaFile(
  file: File | Blob,
  type: MediaType
): MediaValidationResult {
  const mimeType = file.type || '';
  const size = file.size;

  if (type === 'image') {
    if (size > MAX_IMAGE_SIZE_BYTES) {
      return {
        valid: false,
        error: `చిత్రం పరిమాణం 10MB కంటే తక్కువగా ఉండాలి (ప్రస్తుతం: ${(size / (1024 * 1024)).toFixed(1)}MB). / Image must be under 10MB.`,
      };
    }
    // Allow if type matches or if it's an image
    const isImage = ALLOWED_IMAGE_MIMES.includes(mimeType) || mimeType.startsWith('image/');
    if (mimeType && !isImage) {
      return {
        valid: false,
        error: 'సరైన చిత్ర ఫార్మాట్ ఎంచుకోండి (JPEG, PNG, WEBP, GIF). / Invalid image format.',
      };
    }
  } else if (type === 'audio') {
    if (size > MAX_AUDIO_SIZE_BYTES) {
      return {
        valid: false,
        error: `ఆడియో పరిమాణం 15MB కంటే తక్కువగా ఉండాలి (ప్రస్తుతం: ${(size / (1024 * 1024)).toFixed(1)}MB). / Audio must be under 15MB.`,
      };
    }
    const isAudio = ALLOWED_AUDIO_MIMES.includes(mimeType) || mimeType.startsWith('audio/');
    if (mimeType && !isAudio) {
      return {
        valid: false,
        error: 'సరైన ఆడియో ఫార్మాట్ ఎంచుకోండి (MP3, WAV, WEBM, OGG, M4A). / Invalid audio format.',
      };
    }
  } else if (type === 'video') {
    if (size > MAX_VIDEO_SIZE_BYTES) {
      return {
        valid: false,
        error: `వీడియో పరిమాణం 50MB కంటే తక్కువగా ఉండాలి (ప్రస్తుతం: ${(size / (1024 * 1024)).toFixed(1)}MB). / Video must be under 50MB.`,
      };
    }
    const isVideo = ALLOWED_VIDEO_MIMES.includes(mimeType) || mimeType.startsWith('video/');
    if (mimeType && !isVideo) {
      return {
        valid: false,
        error: 'సరైన వీడియో ఫార్మాట్ ఎంచుకోండి (MP4, WEBM, MOV). / Invalid video format.',
      };
    }
  }

  return { valid: true };
}

/**
 * Derives a clean, collision-free storage path.
 */
function createStoragePath(
  folder: string,
  originalFilename?: string,
  type?: MediaType
): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);

  let ext = 'bin';
  if (originalFilename && originalFilename.includes('.')) {
    ext = originalFilename.split('.').pop()?.toLowerCase() || ext;
  } else if (type === 'image') {
    ext = 'webp';
  } else if (type === 'audio') {
    ext = 'webm';
  } else if (type === 'video') {
    ext = 'mp4';
  }

  return `${folder}/${timestamp}_${randomSuffix}.${ext}`;
}

/**
 * Returns the public URL for a given bucket and path.
 */
export function getPublicMediaUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Resolves the default timeout for a given media type:
 * - Image: 30 seconds
 * - Audio: 30 seconds
 * - Video: 120 seconds
 */
export function getDefaultTimeoutForMediaType(type: MediaType): number {
  switch (type) {
    case 'video':
      return STORAGE_VIDEO_TIMEOUT_MS;
    case 'audio':
      return STORAGE_AUDIO_TIMEOUT_MS;
    case 'image':
    default:
      return STORAGE_IMAGE_TIMEOUT_MS;
  }
}

/**
 * Generic upload function with validation, media-specific timeout, and error handling.
 */
export async function uploadMediaFile(options: {
  file: File | Blob;
  bucket: string;
  folder: 'images' | 'audio' | 'videos';
  type: MediaType;
  customFilename?: string;
  timeoutMs?: number;
}): Promise<UploadMediaResult> {
  const {
    file,
    bucket,
    folder,
    type,
    customFilename,
    timeoutMs = getDefaultTimeoutForMediaType(options.type),
  } = options;

  if (!isSupabaseConfigured) {
    return {
      url: null,
      path: null,
      error: new Error('Supabase is not configured. Media storage requires active configuration.'),
    };
  }

  // 1. Client-side Validation
  const validation = validateMediaFile(file, type);
  if (!validation.valid) {
    return {
      url: null,
      path: null,
      error: new Error(validation.error || 'Invalid file'),
    };
  }

  let timerId: ReturnType<typeof setTimeout> | undefined;

  try {
    const filename = customFilename || (file instanceof File ? file.name : undefined);
    const storagePath = createStoragePath(folder, filename, type);

    console.log('[StorageService] Prepared upload:', {
      bucket,
      storagePath,
      folder,
      type,
      size: file.size,
      mimeType: file.type,
      filename,
    });

    // 2. Perform Supabase Storage Upload with timeout guard (30s for images/audio, 120s for video)
    console.log(`[StorageService] Calling supabase.storage.from(bucket).upload() with ${timeoutMs}ms timeout...`);
    const uploadStartTime = Date.now();

    const uploadPromise = supabase.storage
      .from(bucket)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || undefined,
      });

    const timeoutSec = Math.round(timeoutMs / 1000);
    const timeoutPromise = new Promise<never>((_, reject) => {
      timerId = setTimeout(() => {
        reject(
          new Error(
            `అప్‌లోడ్ గడువు ముగిసింది (${timeoutSec} సెకన్లు). దయచేసి నెట్‌వర్క్ కనెక్షన్ తనిఖీ చేసి మళ్ళీ ప్రయత్నించండి. / Media upload timed out (${timeoutSec}s). Please check your internet connection and try again.`
          )
        );
      }, timeoutMs);
    });

    const { data: uploadData, error: uploadError } = await Promise.race([
      uploadPromise,
      timeoutPromise,
    ]);

    console.log(`[StorageService] Upload completed in ${Date.now() - uploadStartTime}ms:`, {
      uploadData,
      uploadError,
    });

    if (uploadError) {
      return {
        url: null,
        path: null,
        error: new Error(`Upload failed: ${uploadError.message}`),
      };
    }

    // 3. Resolve Public URL
    const publicUrl = getPublicMediaUrl(bucket, storagePath);
    console.log('[StorageService] Resolved public URL:', publicUrl);

    return {
      url: publicUrl,
      path: storagePath,
      error: null,
    };
  } catch (err: any) {
    console.error('[StorageService] Exception caught in uploadMediaFile:', err);
    return {
      url: null,
      path: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  } finally {
    if (timerId) {
      clearTimeout(timerId);
    }
  }
}

/**
 * Convenience helper to upload citizen submission media (photo, voice, or video).
 * Automatically applies media-specific timeout (30s for images/audio, 120s for video).
 */
export async function uploadSubmissionMedia(
  file: File | Blob,
  type: MediaType,
  customFilename?: string,
  timeoutMs?: number
): Promise<UploadMediaResult> {
  const folderMap: Record<MediaType, 'images' | 'audio' | 'videos'> = {
    image: 'images',
    audio: 'audio',
    video: 'videos',
  };

  const effectiveTimeout = timeoutMs ?? getDefaultTimeoutForMediaType(type);

  return uploadMediaFile({
    file,
    bucket: SUBMISSIONS_BUCKET,
    folder: folderMap[type],
    type,
    customFilename,
    timeoutMs: effectiveTimeout,
  });
}

/**
 * Convenience helper to upload editorial/news media.
 * Automatically applies media-specific timeout (30s for images/audio, 120s for video).
 */
export async function uploadNewsMedia(
  file: File | Blob,
  type: MediaType,
  customFilename?: string,
  timeoutMs?: number
): Promise<UploadMediaResult> {
  const folderMap: Record<MediaType, 'images' | 'audio' | 'videos'> = {
    image: 'images',
    audio: 'audio',
    video: 'videos',
  };

  const effectiveTimeout = timeoutMs ?? getDefaultTimeoutForMediaType(type);

  return uploadMediaFile({
    file,
    bucket: NEWS_BUCKET,
    folder: folderMap[type],
    type,
    customFilename,
    timeoutMs: effectiveTimeout,
  });
}

/**
 * Safely extracts and validates a relative storage path from a full public URL or relative path.
 * Security enforcement:
 * - Must belong to expected bucket
 * - Must reside in specified allowedPrefixes
 * - Strips and normalizes URLs and path characters
 * - Strictly rejects path traversal (..), backslashes, leading slashes
 * - Rejects arbitrary external URLs (Unsplash, YouTube, external buckets)
 *
 * @param urlOrPath The raw URL or storage path to check
 * @param expectedBucket The bucket this path must belong to (e.g. SUBMISSIONS_BUCKET)
 * @param allowedPrefixes List of permitted folder prefixes (e.g. ['images/', 'audio/', 'videos/'] or [`avatars/${userId}/`])
 * @returns The relative storage path within the bucket, or null if invalid/disallowed.
 */
export function extractSafeStoragePath(
  urlOrPath: string | null | undefined,
  expectedBucket: string,
  allowedPrefixes: string[]
): string | null {
  if (!urlOrPath || typeof urlOrPath !== 'string') {
    return null;
  }

  const trimmed = urlOrPath.trim();
  if (!trimmed) {
    return null;
  }

  // Defend against URL-encoded and direct directory traversal
  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    return null;
  }

  if (decoded.includes('..') || decoded.includes('\\')) {
    return null;
  }

  let relativePath: string | null = null;

  // Case 1: Full URL (HTTP/HTTPS)
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsedUrl = new URL(trimmed);
      const pathname = decodeURIComponent(parsedUrl.pathname);

      // Standard Supabase public URL structure:
      // .../storage/v1/object/public/<expectedBucket>/<filePath>
      const marker = `/storage/v1/object/public/${expectedBucket}/`;
      const markerIdx = pathname.indexOf(marker);

      if (markerIdx !== -1) {
        relativePath = pathname.slice(markerIdx + marker.length);
      } else {
        // Also support authenticated or sign markers if ever used
        const altMarker = `/storage/v1/object/authenticated/${expectedBucket}/`;
        const altIdx = pathname.indexOf(altMarker);
        if (altIdx !== -1) {
          relativePath = pathname.slice(altIdx + altMarker.length);
        } else {
          // Reject external domains / unrecognized URLs
          return null;
        }
      }
    } catch {
      return null;
    }
  } else {
    // Case 2: Relative storage path
    const bucketPrefix = `${expectedBucket}/`;
    if (trimmed.startsWith(bucketPrefix)) {
      relativePath = trimmed.slice(bucketPrefix.length);
    } else {
      relativePath = trimmed;
    }
  }

  if (!relativePath) {
    return null;
  }

  // Strip any leading slashes
  relativePath = relativePath.replace(/^\/+/, '');

  // Secondary traversal check on relative path
  if (relativePath.includes('..') || relativePath.includes('\\') || relativePath.startsWith('/')) {
    return null;
  }

  // Validate that relativePath begins with one of the allowedPrefixes
  const matchesPrefix = allowedPrefixes.some((prefix) => {
    const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
    return relativePath!.startsWith(normalizedPrefix);
  });

  if (!matchesPrefix) {
    return null;
  }

  return relativePath;
}

/**
 * Delete a media file from Supabase Storage with strict defense-in-depth validation.
 * Rejects invalid buckets, path traversal, or paths outside allowed application directories.
 */
export async function deleteMediaFile(
  bucket: string,
  path: string
): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { error: null };
  }

  // Security validation: bucket must be an allowed app bucket
  const allowedBuckets = [SUBMISSIONS_BUCKET, NEWS_BUCKET];
  if (!allowedBuckets.includes(bucket)) {
    return { error: new Error(`Security violation: Invalid storage bucket '${bucket}'`) };
  }

  // Security validation: path traversal defense
  if (!path || typeof path !== 'string' || path.includes('..') || path.includes('\\') || path.startsWith('/')) {
    return { error: new Error('Security violation: Invalid or unsafe storage path') };
  }

  // Security validation: path must reside in known application directories
  const allowedPrefixes = ['images/', 'audio/', 'videos/', 'avatars/'];
  const hasValidPrefix = allowedPrefixes.some((prefix) => path.startsWith(prefix));
  if (!hasValidPrefix) {
    return { error: new Error(`Security violation: Path '${path}' is outside permitted storage directories`) };
  }

  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      return { error: new Error(error.message) };
    }
    return { error: null };
  } catch (err: any) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Safely removes media files belonging to a submission from public storage.
 * Only targets files in the `submissions-media` bucket within allowed folders ('images/', 'audio/', 'videos/').
 * Never deletes external URLs (Unsplash, YouTube, etc.) or paths outside allowed prefixes.
 * Handles missing files gracefully and never throws errors.
 */
export async function cleanupSubmissionMedia(media: {
  imageUrl?: string | null;
  audioUrl?: string | null;
  videoUrl?: string | null;
  mediaUrls?: (string | null | undefined)[];
}): Promise<{ deleted: string[]; errors: string[] }> {
  const result: { deleted: string[]; errors: string[] } = {
    deleted: [],
    errors: [],
  };

  if (!isSupabaseConfigured) {
    return result;
  }

  const allowedPrefixes = ['images/', 'audio/', 'videos/'];
  const pathsToDelete: string[] = [];

  const candidates: Array<{ url?: string | null }> = [
    { url: media.imageUrl },
    { url: media.audioUrl },
    { url: media.videoUrl },
    ...((media.mediaUrls || []).map((u) => ({ url: u }))),
  ];

  for (const item of candidates) {
    if (!item.url) continue;
    const safePath = extractSafeStoragePath(item.url, SUBMISSIONS_BUCKET, allowedPrefixes);
    if (safePath) {
      pathsToDelete.push(safePath);
    } else {
      console.log(`[StorageService] Skipping non-storage or external URL for cleanup: ${item.url}`);
    }
  }

  if (pathsToDelete.length === 0) {
    return result;
  }

  try {
    const { data, error } = await supabase.storage
      .from(SUBMISSIONS_BUCKET)
      .remove(pathsToDelete);

    if (error) {
      console.warn('[StorageService] Error removing submission media:', error.message);
      result.errors.push(error.message);
    } else if (data) {
      result.deleted = data.map((d) => d.name);
      console.log(`[StorageService] Cleaned up ${result.deleted.length} media file(s) for rejected submission:`, pathsToDelete);
    }
  } catch (err: any) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.warn('[StorageService] Exception in cleanupSubmissionMedia:', errMsg);
    result.errors.push(errMsg);
  }

  return result;
}

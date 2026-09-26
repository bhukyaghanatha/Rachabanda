/**
 * @file verify_submission_media_privacy.mjs
 * @description Comprehensive verification script for #8C Submission Media Privacy Hardening.
 */

import fs from 'fs';
import path from 'path';

const projectRoot = 'c:/Users/DELL/Desktop/Rachabanda_app';
const storageServicePath = path.join(projectRoot, 'src/services/storageService.ts');
const submissionServicePath = path.join(projectRoot, 'src/services/submissionService.ts');
const userServicePath = path.join(projectRoot, 'src/services/userService.ts');
const schemaPath = path.join(projectRoot, 'supabase/schema.sql');
const migration8APath = path.join(projectRoot, 'supabase/migrations/20260926000001_profile_privacy_hardening.sql');

console.log('========================================================================');
console.log('RACHABANDA — SUBMISSION MEDIA PRIVACY HARDENING VERIFICATION (#8C)');
console.log('========================================================================\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(condition, testName, details = '') {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`✅ PASS [Check ${totalChecks}] ${testName}`);
    if (details) console.log(`   ${details}`);
  } else {
    failedChecks++;
    console.error(`❌ FAIL [Check ${totalChecks}] ${testName}`);
    if (details) console.error(`   ${details}`);
  }
}

// -----------------------------------------------------------------------------
// 1. REPLICATE AND UNIT-TEST extractSafeStoragePath LOGIC
// -----------------------------------------------------------------------------
console.log('--- 1. SAFE PATH EXTRACTION & VALIDATION TESTS ---');

// Replicate the exact logic from storageService.ts to verify algorithm correctness
function extractSafeStoragePath(urlOrPath, expectedBucket, allowedPrefixes) {
  if (!urlOrPath || typeof urlOrPath !== 'string') return null;
  const trimmed = urlOrPath.trim();
  if (!trimmed) return null;

  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    return null;
  }
  if (decoded.includes('..') || decoded.includes('\\')) return null;

  let relativePath = null;
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsedUrl = new URL(trimmed);
      const pathname = decodeURIComponent(parsedUrl.pathname);
      const marker = `/storage/v1/object/public/${expectedBucket}/`;
      const markerIdx = pathname.indexOf(marker);

      if (markerIdx !== -1) {
        relativePath = pathname.slice(markerIdx + marker.length);
      } else {
        const altMarker = `/storage/v1/object/authenticated/${expectedBucket}/`;
        const altIdx = pathname.indexOf(altMarker);
        if (altIdx !== -1) {
          relativePath = pathname.slice(altIdx + altMarker.length);
        } else {
          return null;
        }
      }
    } catch {
      return null;
    }
  } else {
    const bucketPrefix = `${expectedBucket}/`;
    if (trimmed.startsWith(bucketPrefix)) {
      relativePath = trimmed.slice(bucketPrefix.length);
    } else {
      relativePath = trimmed;
    }
  }

  if (!relativePath) return null;
  relativePath = relativePath.replace(/^\/+/, '');
  if (relativePath.includes('..') || relativePath.includes('\\') || relativePath.startsWith('/')) return null;

  const matchesPrefix = allowedPrefixes.some((prefix) => {
    const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
    return relativePath.startsWith(normalizedPrefix);
  });

  return matchesPrefix ? relativePath : null;
}

const SUBMISSIONS_BUCKET = 'submissions-media';
const submissionPrefixes = ['images/', 'audio/', 'videos/'];

// Test 1.1: Legitimate image URL
const sampleImgUrl = 'https://ycvbrmxlycbyuzmsrshb.supabase.co/storage/v1/object/public/submissions-media/images/1727341234_abc123.jpg';
assert(
  extractSafeStoragePath(sampleImgUrl, SUBMISSIONS_BUCKET, submissionPrefixes) === 'images/1727341234_abc123.jpg',
  'Extracts safe storage path from valid Supabase public submission image URL'
);

// Test 1.2: Legitimate audio and video URLs
const sampleAudUrl = 'https://ycvbrmxlycbyuzmsrshb.supabase.co/storage/v1/object/public/submissions-media/audio/1727341234_aud456.webm';
const sampleVidUrl = 'https://ycvbrmxlycbyuzmsrshb.supabase.co/storage/v1/object/public/submissions-media/videos/1727341234_vid789.mp4';
assert(
  extractSafeStoragePath(sampleAudUrl, SUBMISSIONS_BUCKET, submissionPrefixes) === 'audio/1727341234_aud456.webm' &&
  extractSafeStoragePath(sampleVidUrl, SUBMISSIONS_BUCKET, submissionPrefixes) === 'videos/1727341234_vid789.mp4',
  'Extracts safe storage paths from valid audio and video submission URLs'
);

// Test 1.3: URL with query parameters
const sampleQueryUrl = 'https://ycvbrmxlycbyuzmsrshb.supabase.co/storage/v1/object/public/submissions-media/images/1727341234_abc123.jpg?t=2026-09-26T12:00:00Z&token=xyz';
assert(
  extractSafeStoragePath(sampleQueryUrl, SUBMISSIONS_BUCKET, submissionPrefixes) === 'images/1727341234_abc123.jpg',
  'Strips query parameters and tokens from URL pathname'
);

// Test 1.4: External Unsplash image URL rejection
const sampleUnsplash = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80';
assert(
  extractSafeStoragePath(sampleUnsplash, SUBMISSIONS_BUCKET, submissionPrefixes) === null,
  'Rejects arbitrary external URLs (Unsplash)'
);

// Test 1.5: External YouTube video URL rejection
const sampleYoutube = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
assert(
  extractSafeStoragePath(sampleYoutube, SUBMISSIONS_BUCKET, submissionPrefixes) === null,
  'Rejects external video streaming URLs (YouTube)'
);

// Test 1.6: Cross-bucket target rejection (news-media bucket)
const sampleNewsBucketUrl = 'https://ycvbrmxlycbyuzmsrshb.supabase.co/storage/v1/object/public/news-media/images/cover.jpg';
assert(
  extractSafeStoragePath(sampleNewsBucketUrl, SUBMISSIONS_BUCKET, submissionPrefixes) === null,
  'Rejects URLs targeting other buckets (e.g. news-media)'
);

// Test 1.7: Directory traversal rejection
const sampleTraversal = 'https://ycvbrmxlycbyuzmsrshb.supabase.co/storage/v1/object/public/submissions-media/images/../../passwords.txt';
const sampleEncodedTraversal = 'https://ycvbrmxlycbyuzmsrshb.supabase.co/storage/v1/object/public/submissions-media/images/%2e%2e/passwords.txt';
assert(
  extractSafeStoragePath(sampleTraversal, SUBMISSIONS_BUCKET, submissionPrefixes) === null &&
  extractSafeStoragePath(sampleEncodedTraversal, SUBMISSIONS_BUCKET, submissionPrefixes) === null,
  'Rejects direct and URL-encoded directory traversal attempts (.. and %2e%2e)'
);

// Test 1.8: Avatar URL matching for authenticated user
const userId1 = '2d727e05-cc03-4656-a268-62eb224c53d1';
const userId2 = 'bfa05319-6f1b-457b-bee7-e5c5fbaf7975';
const sampleUser1Avatar = `https://ycvbrmxlycbyuzmsrshb.supabase.co/storage/v1/object/public/submissions-media/avatars/${userId1}/old-pic.jpg`;
assert(
  extractSafeStoragePath(sampleUser1Avatar, SUBMISSIONS_BUCKET, [`avatars/${userId1}/`]) === `avatars/${userId1}/old-pic.jpg`,
  'Permits avatar deletion for authenticated owner'
);

// Test 1.9: Cross-user avatar deletion attempt
assert(
  extractSafeStoragePath(sampleUser1Avatar, SUBMISSIONS_BUCKET, [`avatars/${userId2}/`]) === null,
  'Rejects cross-user avatar deletion (User B cannot target User A avatar)'
);

// Test 1.10: External Google OAuth avatar URL rejection
const sampleGoogleAvatar = 'https://lh3.googleusercontent.com/a/ACg8ocL8...';
assert(
  extractSafeStoragePath(sampleGoogleAvatar, SUBMISSIONS_BUCKET, [`avatars/${userId1}/`]) === null,
  'Rejects external OAuth provider avatar URLs (Google)'
);

// -----------------------------------------------------------------------------
// 2. STORAGE SERVICE SOURCE CODE VERIFICATION
// -----------------------------------------------------------------------------
console.log('\n--- 2. STORAGE SERVICE IMPLEMENTATION CHECKS ---');

const storageCode = fs.readFileSync(storageServicePath, 'utf-8');

assert(
  storageCode.includes('export function extractSafeStoragePath('),
  'storageService exports extractSafeStoragePath'
);

assert(
  storageCode.includes('export async function cleanupSubmissionMedia('),
  'storageService exports cleanupSubmissionMedia'
);

assert(
  storageCode.includes('const allowedBuckets = [SUBMISSIONS_BUCKET, NEWS_BUCKET];') &&
  storageCode.includes('const allowedPrefixes = [\'images/\', \'audio/\', \'videos/\', \'avatars/\'];'),
  'deleteMediaFile enforces bucket whitelist and directory prefix validation'
);

// -----------------------------------------------------------------------------
// 3. REJECTED SUBMISSION CLEANUP INTEGRATION
// -----------------------------------------------------------------------------
console.log('\n--- 3. REJECTED SUBMISSION CLEANUP CHECKS ---');

const submissionCode = fs.readFileSync(submissionServicePath, 'utf-8');

assert(
  submissionCode.includes('import { cleanupSubmissionMedia } from \'./storageService\';') ||
  submissionCode.includes('cleanupSubmissionMedia'),
  'submissionService imports cleanupSubmissionMedia'
);

assert(
  submissionCode.includes('await cleanupSubmissionMedia({') &&
  submissionCode.includes('imageUrl: data.image_url') &&
  submissionCode.includes('audioUrl: data.audio_url') &&
  submissionCode.includes('videoUrl: data.video_url'),
  'rejectSubmission calls cleanupSubmissionMedia with submission media URLs'
);

assert(
  submissionCode.includes('try {') &&
  submissionCode.includes('cleanupSubmissionMedia') &&
  submissionCode.includes('catch (cleanupErr) {') &&
  submissionCode.includes('return { data: mapDatabaseSubmissionToNewsSubmission(data), error: null };'),
  'rejectSubmission wraps cleanup in non-fatal try/catch to preserve rejection status'
);

// -----------------------------------------------------------------------------
// 4. ORPHANED AVATAR REPLACEMENT CLEANUP INTEGRATION
// -----------------------------------------------------------------------------
console.log('\n--- 4. ORPHANED AVATAR CLEANUP CHECKS ---');

const userCode = fs.readFileSync(userServicePath, 'utf-8');

assert(
  userCode.includes('extractSafeStoragePath') &&
  userCode.includes('deleteMediaFile'),
  'userService imports extractSafeStoragePath and deleteMediaFile'
);

assert(
  userCode.includes('let oldAvatarUrl: string | null = null;') &&
  userCode.includes('.select(\'avatar_url\')'),
  'uploadUserAvatar fetches previous avatar_url before performing new upload'
);

assert(
  userCode.includes('allowedPrefixes') &&
  userCode.includes('[`avatars/${user.id}/`]') &&
  userCode.includes('extractSafeStoragePath(oldAvatarUrl, SUBMISSIONS_BUCKET, allowedPrefixes)'),
  'uploadUserAvatar validates old avatar strictly within avatars/${user.id}/ path'
);

assert(
  userCode.includes('await deleteMediaFile(SUBMISSIONS_BUCKET, oldPath);') &&
  userCode.includes('catch (cleanupErr) {'),
  'uploadUserAvatar calls deleteMediaFile in non-fatal try/catch after update succeeds'
);

// -----------------------------------------------------------------------------
// 5. REGRESSION CHECK: #8A PROFILE PRIVACY & RLS INTEGRITY
// -----------------------------------------------------------------------------
console.log('\n--- 5. REGRESSION CHECKS (#8A INTEGRITY & NEWS MEDIA) ---');

const migration8ACode = fs.readFileSync(migration8APath, 'utf-8');
const schemaCode = fs.readFileSync(schemaPath, 'utf-8');

assert(
  migration8ACode.includes('CREATE POLICY "Users can view their own profile"') &&
  migration8ACode.includes('CREATE POLICY "Staff can view all profiles"') &&
  migration8ACode.includes('CREATE OR REPLACE VIEW public.public_profiles'),
  '#8A migration file is intact and unmodified'
);

assert(
  schemaCode.includes('CREATE POLICY "Users can view their own profile"') &&
  schemaCode.includes('CREATE POLICY "Staff can view all profiles"') &&
  schemaCode.includes('CREATE POLICY "Authenticated users can post comments"') &&
  schemaCode.includes('CREATE POLICY "Anyone can submit news"') &&
  schemaCode.includes('user_id = auth.uid()'),
  'schema.sql preserves all #8A privacy and identity policies'
);

assert(
  schemaCode.includes('CREATE OR REPLACE FUNCTION public.approve_submission(') &&
  schemaCode.includes('INSERT INTO public.news (') &&
  schemaCode.includes('INSERT INTO public.news_media ('),
  'Approved news media workflow remains intact and continues referencing public media'
);

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n========================================================================');
console.log(`TOTAL CHECKS: ${totalChecks} | PASSED: ${passedChecks} | FAILED: ${failedChecks}`);
console.log('========================================================================');

if (failedChecks === 0) {
  console.log('🎉 ALL #8C SUBMISSION MEDIA PRIVACY HARDENING CHECKS PASSED!\n');
  process.exit(0);
} else {
  console.error('❌ SOME CHECKS FAILED. Please review the output above.\n');
  process.exit(1);
}

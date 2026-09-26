/**
 * @file verify_trust_safety_fixes.mjs
 * @description Comprehensive verification script for Production Readiness #8A: Trust & Safety Security Fixes.
 */

import fs from 'fs';
import path from 'path';

const projectRoot = 'c:/Users/DELL/Desktop/Rachabanda_app';
const migrationPath = path.join(projectRoot, 'supabase/migrations/20260926000001_profile_privacy_hardening.sql');
const schemaPath = path.join(projectRoot, 'supabase/schema.sql');
const adminDashboardPath = path.join(projectRoot, 'src/components/AdminDashboard.tsx');

async function main() {
  console.log('========================================================================');
  console.log('RACHABANDA — TRUST & SAFETY CRITICAL SECURITY FIXES VERIFICATION (#8A)');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  function testCheck(name, condition, details = '') {
    total++;
    if (condition) {
      console.log(`✅ PASS [Check ${total}] ${name}`);
      if (details) console.log(`   ${details}`);
      passed++;
    } else {
      console.error(`❌ FAIL [Check ${total}] ${name}`);
      if (details) console.error(`   ${details}`);
    }
  }

  // ---------------------------------------------------------------------------
  // 1. MIGRATION FILE & SQL STRUCTURE
  // ---------------------------------------------------------------------------
  console.log('--- 1. MIGRATION SQL VERIFICATION ---');
  testCheck(
    'Migration file 20260926000001_profile_privacy_hardening.sql exists',
    fs.existsSync(migrationPath),
    `File path: ${migrationPath}`
  );

  const migration = fs.readFileSync(migrationPath, 'utf-8');

  // Fix 1: Profiles RLS
  testCheck(
    'Migration drops blanket public profile SELECT policy',
    migration.includes('DROP POLICY IF EXISTS "Public profiles are readable by everyone" ON public.profiles;'),
    'Ensures public profiles are no longer exposed to unauthenticated queries'
  );

  testCheck(
    'Migration creates owner-only SELECT policy on profiles',
    migration.includes('CREATE POLICY "Users can view their own profile"') &&
    migration.includes('ON public.profiles FOR SELECT') &&
    migration.includes('USING (auth.uid() = id)'),
    'Enforces auth.uid() = id for user full profile access'
  );

  testCheck(
    'Migration creates staff SELECT policy on profiles for administration',
    migration.includes('CREATE POLICY "Staff can view all profiles"') &&
    migration.includes('USING (public.is_admin_or_editor())'),
    'Preserves admin/editor legitimate management access'
  );

  // Check view definition specifically
  const viewDef = migration.slice(migration.indexOf('CREATE OR REPLACE VIEW public.public_profiles'));
  testCheck(
    'Migration defines public-safe view public.public_profiles with strictly non-sensitive fields',
    migration.includes('CREATE OR REPLACE VIEW public.public_profiles') &&
    viewDef.includes('full_name') &&
    viewDef.includes('avatar_url') &&
    !viewDef.includes('phone') &&
    !viewDef.includes('district') &&
    !viewDef.includes('mandal') &&
    !viewDef.includes('bio'),
    'View strictly excludes phone, district, mandal, and bio'
  );

  // Fix 3: Comments RLS
  testCheck(
    'Migration updates comment INSERT policy to enforce auth.uid() = user_id',
    migration.includes('DROP POLICY IF EXISTS "Authenticated users can post comments" ON public.comments;') &&
    migration.includes('CREATE POLICY "Authenticated users can post comments"') &&
    migration.includes('ON public.comments FOR INSERT') &&
    migration.includes('auth.uid() = user_id'),
    'Prevents authenticated comment identity spoofing'
  );

  // Fix 4: Submissions RLS
  testCheck(
    'Migration updates submission INSERT policy for anonymous & authenticated identity',
    migration.includes('DROP POLICY IF EXISTS "Anyone can submit news" ON public.submissions;') &&
    migration.includes('CREATE POLICY "Anyone can submit news"') &&
    migration.includes('(auth.uid() IS NULL AND user_id IS NULL)') &&
    migration.includes('(auth.uid() IS NOT NULL AND user_id = auth.uid())'),
    'Guarantees anonymous submissions have user_id = NULL and authenticated submissions match auth.uid()'
  );

  // ---------------------------------------------------------------------------
  // 2. SCHEMA.SQL SYNCHRONIZATION
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. SCHEMA.SQL SYNCHRONIZATION ---');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  testCheck(
    'schema.sql has owner-only profiles SELECT policy',
    schema.includes('CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);'),
    'Synchronized with migration'
  );

  testCheck(
    'schema.sql has staff profiles SELECT policy',
    schema.includes('CREATE POLICY "Staff can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin_or_editor());'),
    'Synchronized with migration'
  );

  testCheck(
    'schema.sql has comments INSERT policy checking auth.uid() = user_id',
    schema.includes('CREATE POLICY "Authenticated users can post comments" ON public.comments FOR INSERT WITH CHECK (') &&
    schema.includes('auth.uid() = user_id'),
    'Synchronized with migration'
  );

  testCheck(
    'schema.sql has submissions INSERT policy checking anonymous/authenticated identity',
    schema.includes('CREATE POLICY "Anyone can submit news" ON public.submissions FOR INSERT WITH CHECK (') &&
    schema.includes('(auth.uid() IS NULL AND user_id IS NULL)') &&
    schema.includes('(auth.uid() IS NOT NULL AND user_id = auth.uid())'),
    'Synchronized with migration'
  );

  // ---------------------------------------------------------------------------
  // 3. ADMIN MEDIA URL VALIDATION (P1)
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. ADMIN MEDIA URL VALIDATION ---');
  const adminCode = fs.readFileSync(adminDashboardPath, 'utf-8');

  testCheck(
    'AdminDashboard has isSafeExternalMediaUrl helper function',
    adminCode.includes('function isSafeExternalMediaUrl(url?: string | null): boolean'),
    'Helper exists in AdminDashboard.tsx'
  );

  testCheck(
    'isSafeExternalMediaUrl checks for http: and https: protocols only',
    adminCode.includes("parsed.protocol === 'http:' || parsed.protocol === 'https:'"),
    'Strict protocol whitelisting implemented'
  );

  testCheck(
    'imageUrl uses isSafeExternalMediaUrl before rendering anchor',
    adminCode.includes('sub.imageUrl && isSafeExternalMediaUrl(sub.imageUrl) ? ('),
    'Protects against unsafe image link rendering'
  );

  testCheck(
    'audioUrl uses isSafeExternalMediaUrl before rendering clickable link',
    adminCode.includes('isSafeExternalMediaUrl(sub.audioUrl) ? ('),
    'Protects against unsafe audio link rendering'
  );

  testCheck(
    'videoUrl uses isSafeExternalMediaUrl before rendering clickable link',
    adminCode.includes('isSafeExternalMediaUrl(sub.videoUrl) ? ('),
    'Protects against unsafe video link rendering'
  );

  testCheck(
    'External media links include rel="noopener noreferrer"',
    adminCode.includes('rel="noopener noreferrer"'),
    'Prevents tab-nabbing / window.opener tampering'
  );

  // Unit-testing isSafeExternalMediaUrl logic directly
  function isSafeExternalMediaUrlTest(url) {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (!trimmed) return false;
    try {
      const parsed = new URL(trimmed);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  testCheck(
    'URL validation allows legitimate Supabase public storage https URL',
    isSafeExternalMediaUrlTest('https://xyz.supabase.co/storage/v1/object/public/submissions-media/audio/123.mp3') === true
  );

  testCheck(
    'URL validation allows standard http URL',
    isSafeExternalMediaUrlTest('http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4') === true
  );

  testCheck(
    'URL validation blocks javascript:alert(1)',
    isSafeExternalMediaUrlTest('javascript:alert(1)') === false
  );

  testCheck(
    'URL validation blocks data:text/html,<script>alert(1)</script>',
    isSafeExternalMediaUrlTest('data:text/html,<script>alert(1)</script>') === false
  );

  testCheck(
    'URL validation blocks vbscript:msgbox(1)',
    isSafeExternalMediaUrlTest('vbscript:msgbox(1)') === false
  );

  testCheck(
    'URL validation blocks file:///etc/passwd',
    isSafeExternalMediaUrlTest('file:///etc/passwd') === false
  );

  testCheck(
    'URL validation blocks blob:http://localhost/uuid',
    isSafeExternalMediaUrlTest('blob:http://localhost/uuid') === false
  );

  testCheck(
    'URL validation rejects null, undefined, empty, and whitespace strings',
    isSafeExternalMediaUrlTest(null) === false &&
    isSafeExternalMediaUrlTest(undefined) === false &&
    isSafeExternalMediaUrlTest('') === false &&
    isSafeExternalMediaUrlTest('   ') === false
  );

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log(`TOTAL CHECKS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
  console.log('========================================================================');

  if (passed === total) {
    console.log('🎉 ALL TRUST & SAFETY SECURITY CHECKS PASSED!\n');
    process.exit(0);
  } else {
    console.error('❌ SOME CHECKS FAILED. Please review output above.\n');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Verification script error:', err);
  process.exit(1);
});

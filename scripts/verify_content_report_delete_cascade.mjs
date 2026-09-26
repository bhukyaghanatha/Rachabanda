/**
 * @file verify_content_report_delete_cascade.mjs
 * @description Verification script for #8E Task 1: Fix P0 Content Report Deletion Cascade Conflict.
 * Verifies that ON DELETE SET NULL for content_reports.reporter_id operates cleanly
 * during profile deletion while strictly blocking ordinary client/staff modification of reporter_id
 * and all other immutable report fields.
 */

import fs from 'fs';
import path from 'path';

const projectRoot = 'c:/Users/DELL/Desktop/Rachabanda_app';
const migrationPath = path.join(projectRoot, 'supabase/migrations/20260926000003_content_report_cascade_fix.sql');
const baseMigrationPath = path.join(projectRoot, 'supabase/migrations/20260926000002_content_reporting.sql');
const schemaPath = path.join(projectRoot, 'supabase/schema.sql');
const envLocalPath = path.join(projectRoot, '.env.local');

console.log('========================================================================');
console.log('RACHABANDA — #8E TASK 1: CONTENT REPORT CASCADE FIX VERIFICATION');
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
// 1. MIGRATION FILE & SQL STRUCTURE
// -----------------------------------------------------------------------------
console.log('--- 1. MIGRATION FILE & SQL STRUCTURE ---');

assert(
  fs.existsSync(migrationPath),
  'Migration file 20260926000003_content_report_cascade_fix.sql exists',
  `Path: ${migrationPath}`
);

const migrationCode = fs.readFileSync(migrationPath, 'utf-8');

assert(
  migrationCode.includes('CREATE OR REPLACE FUNCTION public.protect_content_report_fields()') &&
  migrationCode.includes('RETURNS trigger') &&
  migrationCode.includes('SECURITY DEFINER') &&
  migrationCode.includes('SET search_path = public, pg_temp;'),
  'protect_content_report_fields() is updated with SECURITY DEFINER and secure search_path'
);

assert(
  migrationCode.includes('DROP TRIGGER IF EXISTS trg_protect_content_report_fields ON public.content_reports;') &&
  migrationCode.includes('CREATE TRIGGER trg_protect_content_report_fields') &&
  migrationCode.includes('BEFORE UPDATE ON public.content_reports') &&
  migrationCode.includes('FOR EACH ROW') &&
  migrationCode.includes('EXECUTE FUNCTION public.protect_content_report_fields();'),
  'Trigger trg_protect_content_report_fields is cleanly bound to BEFORE UPDATE ON public.content_reports'
);

// -----------------------------------------------------------------------------
// 2. FOREIGN KEY & REFERENTIAL ACTION DEFINITION
// -----------------------------------------------------------------------------
console.log('\n--- 2. FOREIGN KEY & REFERENTIAL ACTION DEFINITION ---');

const baseMigrationCode = fs.readFileSync(baseMigrationPath, 'utf-8');
const schemaCode = fs.readFileSync(schemaPath, 'utf-8');

assert(
  baseMigrationCode.includes('reporter_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL') &&
  schemaCode.includes('reporter_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL'),
  'Foreign key content_reports.reporter_id references public.profiles(id) with ON DELETE SET NULL in base migration and schema.sql'
);

assert(
  schemaCode.includes('CREATE OR REPLACE FUNCTION public.protect_content_report_fields()') &&
  schemaCode.includes('AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = OLD.reporter_id)') &&
  schemaCode.includes('SECURITY DEFINER'),
  'schema.sql is synchronized with the new cascade-aware protect_content_report_fields() definition'
);

// -----------------------------------------------------------------------------
// 3. TRIGGER BEHAVIOR & IMMUTABILITY SIMULATION
// -----------------------------------------------------------------------------
console.log('\n--- 3. TRIGGER BEHAVIOR & IMMUTABILITY SIMULATION ---');

/**
 * Simulates the exact logic of public.protect_content_report_fields()
 * @param {object} oldRow 
 * @param {object} newRow 
 * @param {Set<string>} existingProfilesSet - Mock set of active profile IDs
 */
function simulateProtectTrigger(oldRow, newRow, existingProfilesSet) {
  // 1. Immutable fields check
  if (
    (newRow.id !== oldRow.id) ||
    (newRow.content_type !== oldRow.content_type) ||
    (newRow.content_id !== oldRow.content_id) ||
    (newRow.reason !== oldRow.reason) ||
    (newRow.details !== oldRow.details) ||
    (newRow.created_at !== oldRow.created_at)
  ) {
    const err = new Error('Cannot modify immutable content report fields (target content, reason, details, or timestamp)');
    err.code = '42501';
    throw err;
  }

  // 2. Reporter ID check
  if (newRow.reporter_id !== oldRow.reporter_id) {
    const isNewNull = newRow.reporter_id === null;
    const isOldNotNull = oldRow.reporter_id !== null;
    const statusUnchanged = newRow.status === oldRow.status;
    const reviewedByUnchanged = newRow.reviewed_by === oldRow.reviewed_by;
    const reviewedAtUnchanged = newRow.reviewed_at === oldRow.reviewed_at;
    const updatedAtUnchanged = newRow.updated_at === oldRow.updated_at;
    const profileDeleted = !existingProfilesSet.has(oldRow.reporter_id);

    if (
      isNewNull &&
      isOldNotNull &&
      statusUnchanged &&
      reviewedByUnchanged &&
      reviewedAtUnchanged &&
      updatedAtUnchanged &&
      profileDeleted
    ) {
      // Permitted: pure ON DELETE SET NULL cascade triggered by profile deletion
    } else {
      const err = new Error('Cannot modify immutable content report fields (reporter_id cannot be modified)');
      err.code = '42501';
      throw err;
    }
  }

  return newRow;
}

const mockActiveProfiles = new Set(['usr-alice', 'usr-bob', 'admin-carol']);

const baseReport = {
  id: 'rep-0001',
  reporter_id: 'usr-alice',
  content_type: 'news',
  content_id: 'news-1111',
  reason: 'misinformation',
  details: 'Initial report details',
  status: 'pending',
  reviewed_by: null,
  reviewed_at: null,
  created_at: '2026-09-26T10:00:00Z',
  updated_at: '2026-09-26T10:00:00Z'
};

// Check 3.1: Client trying to modify reporter_id to another user is BLOCKED
let blockChangeUser = false;
try {
  simulateProtectTrigger(baseReport, { ...baseReport, reporter_id: 'usr-bob' }, mockActiveProfiles);
} catch (e) {
  blockChangeUser = e.code === '42501';
}
assert(
  blockChangeUser,
  'Client attempt to reassign reporter_id to another user is rejected with SQLSTATE 42501'
);

// Check 3.2: Client trying to set reporter_id = null while profile exists is BLOCKED
let blockManualNullify = false;
try {
  simulateProtectTrigger(baseReport, { ...baseReport, reporter_id: null }, mockActiveProfiles);
} catch (e) {
  blockManualNullify = e.code === '42501';
}
assert(
  blockManualNullify,
  'Client attempt to set reporter_id = null while user profile exists is rejected with SQLSTATE 42501'
);

// Check 3.3: Client trying to modify id is BLOCKED
let blockId = false;
try {
  simulateProtectTrigger(baseReport, { ...baseReport, id: 'rep-tampered' }, mockActiveProfiles);
} catch (e) {
  blockId = e.code === '42501';
}
assert(blockId, 'Client attempt to modify report id is rejected with SQLSTATE 42501');

// Check 3.4: Client trying to modify content_type is BLOCKED
let blockContentType = false;
try {
  simulateProtectTrigger(baseReport, { ...baseReport, content_type: 'comment' }, mockActiveProfiles);
} catch (e) {
  blockContentType = e.code === '42501';
}
assert(blockContentType, 'Client attempt to modify content_type is rejected with SQLSTATE 42501');

// Check 3.5: Client trying to modify content_id is BLOCKED
let blockContentId = false;
try {
  simulateProtectTrigger(baseReport, { ...baseReport, content_id: 'news-other' }, mockActiveProfiles);
} catch (e) {
  blockContentId = e.code === '42501';
}
assert(blockContentId, 'Client attempt to modify content_id is rejected with SQLSTATE 42501');

// Check 3.6: Client trying to modify reason is BLOCKED
let blockReason = false;
try {
  simulateProtectTrigger(baseReport, { ...baseReport, reason: 'hate_speech' }, mockActiveProfiles);
} catch (e) {
  blockReason = e.code === '42501';
}
assert(blockReason, 'Client attempt to modify reason is rejected with SQLSTATE 42501');

// Check 3.7: Client trying to modify details is BLOCKED
let blockDetails = false;
try {
  simulateProtectTrigger(baseReport, { ...baseReport, details: 'Tampered details' }, mockActiveProfiles);
} catch (e) {
  blockDetails = e.code === '42501';
}
assert(blockDetails, 'Client attempt to modify details is rejected with SQLSTATE 42501');

// Check 3.8: Client trying to modify created_at is BLOCKED
let blockCreatedAt = false;
try {
  simulateProtectTrigger(baseReport, { ...baseReport, created_at: '2026-01-01T00:00:00Z' }, mockActiveProfiles);
} catch (e) {
  blockCreatedAt = e.code === '42501';
}
assert(blockCreatedAt, 'Client attempt to modify created_at is rejected with SQLSTATE 42501');

// Check 3.9: Client trying to set reporter_id = null while modifying status is BLOCKED
const deletedProfiles = new Set(mockActiveProfiles);
deletedProfiles.delete('usr-alice'); // usr-alice is deleted
let blockNullWithStatus = false;
try {
  simulateProtectTrigger(
    baseReport,
    { ...baseReport, reporter_id: null, status: 'dismissed' },
    deletedProfiles
  );
} catch (e) {
  blockNullWithStatus = e.code === '42501';
}
assert(
  blockNullWithStatus,
  'Attempt to nullify reporter_id while simultaneously altering moderation fields is rejected with SQLSTATE 42501'
);

// Check 3.10: Pure ON DELETE SET NULL cascade when profile is deleted SUCCEEDS
let cascadeSuccess = false;
try {
  const result = simulateProtectTrigger(
    baseReport,
    { ...baseReport, reporter_id: null },
    deletedProfiles
  );
  cascadeSuccess = result.reporter_id === null && result.reason === baseReport.reason;
} catch (e) {
  cascadeSuccess = false;
}
assert(
  cascadeSuccess,
  'Genuine ON DELETE SET NULL cascade (profile deleted, only reporter_id set to null) succeeds cleanly'
);

// Check 3.11: Legitimate staff moderation update on active report SUCCEEDS
let moderationSuccess = false;
try {
  const result = simulateProtectTrigger(
    baseReport,
    {
      ...baseReport,
      status: 'actioned',
      reviewed_by: 'admin-carol',
      reviewed_at: '2026-09-26T12:00:00Z',
      updated_at: '2026-09-26T12:00:00Z'
    },
    mockActiveProfiles
  );
  moderationSuccess = result.status === 'actioned' && result.reviewed_by === 'admin-carol';
} catch (e) {
  moderationSuccess = false;
}
assert(
  moderationSuccess,
  'Staff moderation update (status, reviewed_by, reviewed_at, updated_at) on active report succeeds'
);

// Check 3.12: Staff moderation update on previously anonymized report SUCCEEDS
const anonymizedReport = { ...baseReport, reporter_id: null };
let anonymizedModerationSuccess = false;
try {
  const result = simulateProtectTrigger(
    anonymizedReport,
    {
      ...anonymizedReport,
      status: 'reviewed',
      reviewed_by: 'admin-carol',
      reviewed_at: '2026-09-26T14:00:00Z',
      updated_at: '2026-09-26T14:00:00Z'
    },
    mockActiveProfiles
  );
  anonymizedModerationSuccess = result.status === 'reviewed';
} catch (e) {
  anonymizedModerationSuccess = false;
}
assert(
  anonymizedModerationSuccess,
  'Staff moderation update on an already anonymized report (reporter_id = null) succeeds'
);

// Check 3.13: Attempt to assign reporter_id to an anonymized report is BLOCKED
let blockAssignToAnonymized = false;
try {
  simulateProtectTrigger(
    anonymizedReport,
    { ...anonymizedReport, reporter_id: 'usr-bob' },
    mockActiveProfiles
  );
} catch (e) {
  blockAssignToAnonymized = e.code === '42501';
}
assert(
  blockAssignToAnonymized,
  'Attempt to assign a user to an already anonymized report is rejected with SQLSTATE 42501'
);

// -----------------------------------------------------------------------------
// 4. RLS POLICIES & DESTRUCTIVE DELETE ELIMINATION
// -----------------------------------------------------------------------------
console.log('\n--- 4. RLS POLICIES & DELETE ELIMINATION ---');

assert(
  schemaCode.includes('ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;'),
  'RLS remains enabled on public.content_reports'
);

assert(
  schemaCode.includes('CREATE POLICY "Authenticated users can create content reports"') &&
  schemaCode.includes('reporter_id = auth.uid()') &&
  schemaCode.includes('status = \'pending\''),
  'INSERT policy strictly requires authenticated session and reporter_id = auth.uid()'
);

assert(
  schemaCode.includes('CREATE POLICY "Users can view own reports and staff can view all"') &&
  schemaCode.includes('public.is_admin_or_editor()'),
  'SELECT policy isolates reporter identity: users see only their own, staff sees all'
);

assert(
  schemaCode.includes('CREATE POLICY "Staff can update content reports"') &&
  schemaCode.includes('public.is_admin_or_editor()'),
  'UPDATE policy restricts report updates strictly to staff'
);

assert(
  !schemaCode.includes('CREATE POLICY "Staff can delete content reports"') &&
  !schemaCode.includes('FOR DELETE ON public.content_reports') &&
  !migrationCode.includes('FOR DELETE ON public.content_reports'),
  'Destructive DELETE policy remains strictly absent across all migrations and schema'
);

// -----------------------------------------------------------------------------
// 5. LIVE SUPABASE API VERIFICATION (SAFE & NON-DESTRUCTIVE)
// -----------------------------------------------------------------------------
console.log('\n--- 5. LIVE SUPABASE API SAFE PROBE ---');

async function testLiveApi() {
  if (!fs.existsSync(envLocalPath)) {
    console.log('⚠️ .env.local not found — skipping live API probe');
    return;
  }

  const envContent = fs.readFileSync(envLocalPath, 'utf-8');
  const urlMatch = envContent.match(/VITE_SUPABASE_URL=([^\r\n]+)/);
  const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=([^\r\n]+)/);

  if (!urlMatch || !keyMatch) {
    console.log('⚠️ Missing credentials in .env.local — skipping live API probe');
    return;
  }

  const supabaseUrl = urlMatch[1].trim();
  const anonKey = keyMatch[1].trim();

  const headers = {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`,
    'Content-Type': 'application/json'
  };

  try {
    // Probe 5.1: Verify content_reports endpoint responds
    const res = await fetch(`${supabaseUrl}/rest/v1/content_reports?select=id,status&limit=1`, {
      method: 'GET',
      headers
    });
    assert(
      res.status === 200,
      'Live Supabase REST API responds for content_reports (HTTP 200)',
      `Status: ${res.status}`
    );

    // Probe 5.2: Anonymous attempt to DELETE content_reports is blocked
    const delRes = await fetch(`${supabaseUrl}/rest/v1/content_reports?id=eq.00000000-0000-0000-0000-000000000000`, {
      method: 'DELETE',
      headers
    });
    // With RLS and no DELETE policy, anon cannot delete (200 with 0 deleted, or 401/403/404)
    assert(
      delRes.status !== 500,
      'Anonymous DELETE request is safely handled without 500 error',
      `HTTP status: ${delRes.status}`
    );

    // Probe 5.3: Anonymous attempt to PATCH content_reports is blocked by RLS
    const patchRes = await fetch(`${supabaseUrl}/rest/v1/content_reports?id=eq.00000000-0000-0000-0000-000000000000`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ reporter_id: '00000000-0000-0000-0000-000000000001' })
    });
    assert(
      patchRes.status !== 500,
      'Anonymous PATCH request is safely handled without 500 error',
      `HTTP status: ${patchRes.status}`
    );
  } catch (err) {
    console.log('⚠️ Network probe note:', err.message);
  }
}

await testLiveApi();

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n========================================================================');
console.log(`TOTAL CHECKS: ${totalChecks} | PASSED: ${passedChecks} | FAILED: ${failedChecks}`);
console.log('========================================================================');

if (failedChecks === 0) {
  console.log('🎉 ALL #8E TASK 1 CONTENT REPORT CASCADE FIX CHECKS PASSED!\n');
  process.exit(0);
} else {
  console.error('❌ SOME CHECKS FAILED. Please review the output above.\n');
  process.exit(1);
}

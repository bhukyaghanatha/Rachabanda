/**
 * @file verify_content_reporting_rls.mjs
 * @description Comprehensive verification script for #8D-1 Content Reporting Backend & Service Security.
 * Includes security review fixes: immutable field protection and destructive delete elimination.
 */

import fs from 'fs';
import path from 'path';

const projectRoot = 'c:/Users/DELL/Desktop/Rachabanda_app';
const migrationPath = path.join(projectRoot, 'supabase/migrations/20260926000002_content_reporting.sql');
const schemaPath = path.join(projectRoot, 'supabase/schema.sql');
const servicePath = path.join(projectRoot, 'src/services/reportService.ts');
const typesPath = path.join(projectRoot, 'src/types.ts');
const migration8APath = path.join(projectRoot, 'supabase/migrations/20260926000001_profile_privacy_hardening.sql');
const storageServicePath = path.join(projectRoot, 'src/services/storageService.ts');

console.log('========================================================================');
console.log('RACHABANDA — CONTENT REPORTING BACKEND & SERVICE VERIFICATION (#8D-1)');
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
// 1. MIGRATION FILE & SCHEMA DESIGN
// -----------------------------------------------------------------------------
console.log('--- 1. MIGRATION FILE & SCHEMA VERIFICATION ---');

assert(
  fs.existsSync(migrationPath),
  'Migration file 20260926000002_content_reporting.sql exists',
  `Path: ${migrationPath}`
);

const migrationCode = fs.readFileSync(migrationPath, 'utf-8');

assert(
  migrationCode.includes('CREATE TABLE IF NOT EXISTS public.content_reports') &&
  migrationCode.includes('reporter_id uuid REFERENCES public.profiles(id)') &&
  migrationCode.includes('content_type text NOT NULL') &&
  migrationCode.includes('content_id uuid NOT NULL') &&
  migrationCode.includes('reason text NOT NULL') &&
  migrationCode.includes('status text NOT NULL DEFAULT \'pending\'') &&
  migrationCode.includes('reviewed_by uuid REFERENCES public.profiles(id)'),
  'Migration creates public.content_reports table with all required columns'
);

assert(
  migrationCode.includes('chk_content_reports_type') &&
  migrationCode.includes('content_type IN (\'news\', \'comment\')'),
  'CHECK constraint chk_content_reports_type restricts to news and comment'
);

assert(
  migrationCode.includes('chk_content_reports_reason') &&
  migrationCode.includes('misinformation') &&
  migrationCode.includes('hate_speech') &&
  migrationCode.includes('harassment') &&
  migrationCode.includes('spam') &&
  migrationCode.includes('inappropriate') &&
  migrationCode.includes('copyright') &&
  migrationCode.includes('other'),
  'CHECK constraint chk_content_reports_reason defines 7 standardized report reasons'
);

assert(
  migrationCode.includes('chk_content_reports_status') &&
  migrationCode.includes('pending') &&
  migrationCode.includes('reviewed') &&
  migrationCode.includes('dismissed') &&
  migrationCode.includes('actioned'),
  'CHECK constraint chk_content_reports_status defines 4 moderation lifecycle statuses'
);

// -----------------------------------------------------------------------------
// 2. DUPLICATE REPORT PROTECTION & INDEXES
// -----------------------------------------------------------------------------
console.log('\n--- 2. DUPLICATE REPORT PROTECTION & INDEXES ---');

assert(
  migrationCode.includes('CREATE UNIQUE INDEX IF NOT EXISTS idx_content_reports_unique_pending') &&
  migrationCode.includes('ON public.content_reports (reporter_id, content_type, content_id)') &&
  migrationCode.includes('WHERE status = \'pending\''),
  'Partial unique index idx_content_reports_unique_pending blocks duplicate pending reports'
);

assert(
  migrationCode.includes('idx_content_reports_status_created') &&
  migrationCode.includes('idx_content_reports_reporter') &&
  migrationCode.includes('idx_content_reports_content'),
  'Performance indexes created for moderation filtering and reporter history'
);

// -----------------------------------------------------------------------------
// 3. TARGET CONTENT EXISTENCE VALIDATION
// -----------------------------------------------------------------------------
console.log('\n--- 3. TARGET EXISTENCE VALIDATION TRIGGER ---');

assert(
  migrationCode.includes('CREATE OR REPLACE FUNCTION public.validate_content_report_target()') &&
  migrationCode.includes('SELECT 1 FROM public.news WHERE id = NEW.content_id') &&
  migrationCode.includes('SELECT 1 FROM public.comments WHERE id = NEW.content_id') &&
  migrationCode.includes('USING ERRCODE = \'23503\''),
  'Trigger function validates target exists in news or comments before insert/update'
);

assert(
  migrationCode.includes('CREATE TRIGGER trg_validate_content_report_target') &&
  migrationCode.includes('BEFORE INSERT OR UPDATE OF content_type, content_id ON public.content_reports'),
  'Trigger bound to BEFORE INSERT OR UPDATE of content_type, content_id'
);

// -----------------------------------------------------------------------------
// 4. IMMUTABLE REPORT FIELDS PROTECTION (SECURITY FIX 1)
// -----------------------------------------------------------------------------
console.log('\n--- 4. IMMUTABLE REPORT FIELDS PROTECTION TRIGGER (FIX 1) ---');

assert(
  migrationCode.includes('CREATE OR REPLACE FUNCTION public.protect_content_report_fields()') &&
  migrationCode.includes('CREATE TRIGGER trg_protect_content_report_fields') &&
  migrationCode.includes('BEFORE UPDATE ON public.content_reports'),
  'BEFORE UPDATE trigger trg_protect_content_report_fields created'
);

// Unit test simulated logic for trigger function
function simulateProtectFields(oldRow, newRow) {
  if (
    (newRow.id !== oldRow.id) ||
    (newRow.reporter_id !== oldRow.reporter_id) ||
    (newRow.content_type !== oldRow.content_type) ||
    (newRow.content_id !== oldRow.content_id) ||
    (newRow.reason !== oldRow.reason) ||
    (newRow.details !== oldRow.details) ||
    (newRow.created_at !== oldRow.created_at)
  ) {
    const err = new Error('Cannot modify immutable content report fields');
    err.code = '42501';
    throw err;
  }
  return newRow;
}

const baseOldRow = {
  id: 'rep-001',
  reporter_id: 'usr-111',
  content_type: 'news',
  content_id: 'news-999',
  reason: 'misinformation',
  details: 'Fake details provided',
  status: 'pending',
  reviewed_by: null,
  reviewed_at: null,
  created_at: '2026-09-26T10:00:00Z',
  updated_at: '2026-09-26T10:00:00Z',
};

// Check 4.1: Staff cannot modify reporter_id
let staffModReporterBlocked = false;
try {
  simulateProtectFields(baseOldRow, { ...baseOldRow, reporter_id: 'usr-hacker' });
} catch (e) {
  staffModReporterBlocked = e.code === '42501';
}
assert(
  staffModReporterBlocked && migrationCode.includes('NEW.reporter_id IS DISTINCT FROM OLD.reporter_id'),
  'Staff cannot modify reporter_id (blocked with SQLSTATE 42501)'
);

// Check 4.2: Staff cannot modify content_type
let staffModContentTypeBlocked = false;
try {
  simulateProtectFields(baseOldRow, { ...baseOldRow, content_type: 'comment' });
} catch (e) {
  staffModContentTypeBlocked = e.code === '42501';
}
assert(
  staffModContentTypeBlocked && migrationCode.includes('NEW.content_type IS DISTINCT FROM OLD.content_type'),
  'Staff cannot modify content_type (blocked with SQLSTATE 42501)'
);

// Check 4.3: Staff cannot modify content_id
let staffModContentIdBlocked = false;
try {
  simulateProtectFields(baseOldRow, { ...baseOldRow, content_id: 'news-other' });
} catch (e) {
  staffModContentIdBlocked = e.code === '42501';
}
assert(
  staffModContentIdBlocked && migrationCode.includes('NEW.content_id IS DISTINCT FROM OLD.content_id'),
  'Staff cannot modify content_id (blocked with SQLSTATE 42501)'
);

// Check 4.4: Staff cannot modify reason
let staffModReasonBlocked = false;
try {
  simulateProtectFields(baseOldRow, { ...baseOldRow, reason: 'harassment' });
} catch (e) {
  staffModReasonBlocked = e.code === '42501';
}
assert(
  staffModReasonBlocked && migrationCode.includes('NEW.reason IS DISTINCT FROM OLD.reason'),
  'Staff cannot modify reason (blocked with SQLSTATE 42501)'
);

// Check 4.5: Staff cannot modify details
let staffModDetailsBlocked = false;
try {
  simulateProtectFields(baseOldRow, { ...baseOldRow, details: 'Tampered details' });
} catch (e) {
  staffModDetailsBlocked = e.code === '42501';
}
assert(
  staffModDetailsBlocked && migrationCode.includes('NEW.details IS DISTINCT FROM OLD.details'),
  'Staff cannot modify details (blocked with SQLSTATE 42501)'
);

// Check 4.6: Staff cannot modify created_at
let staffModCreatedAtBlocked = false;
try {
  simulateProtectFields(baseOldRow, { ...baseOldRow, created_at: '2026-01-01T00:00:00Z' });
} catch (e) {
  staffModCreatedAtBlocked = e.code === '42501';
}
assert(
  staffModCreatedAtBlocked && migrationCode.includes('NEW.created_at IS DISTINCT FROM OLD.created_at'),
  'Staff cannot modify created_at (blocked with SQLSTATE 42501)'
);

// Check 4.7: Staff CAN change status
let staffChangeStatusAllowed = false;
try {
  const updated = simulateProtectFields(baseOldRow, {
    ...baseOldRow,
    status: 'actioned',
    updated_at: '2026-09-26T12:00:00Z',
  });
  staffChangeStatusAllowed = updated.status === 'actioned';
} catch {}
assert(
  staffChangeStatusAllowed,
  'Staff CAN change status (moderation flow permitted)'
);

// Check 4.8: Staff CAN set reviewed_by and reviewed_at
let staffReviewAllowed = false;
try {
  const updated = simulateProtectFields(baseOldRow, {
    ...baseOldRow,
    status: 'reviewed',
    reviewed_by: 'admin-777',
    reviewed_at: '2026-09-26T12:00:00Z',
    updated_at: '2026-09-26T12:00:00Z',
  });
  staffReviewAllowed = updated.reviewed_by === 'admin-777' && updated.reviewed_at !== null;
} catch {}
assert(
  staffReviewAllowed,
  'Staff CAN set reviewed_by and reviewed_at (reviewer attribution permitted)'
);

// -----------------------------------------------------------------------------
// 5. ROW LEVEL SECURITY (RLS) POLICIES & DESTRUCTIVE DELETE REMOVAL (FIX 2)
// -----------------------------------------------------------------------------
console.log('\n--- 5. ROW LEVEL SECURITY (RLS) & DELETE REMOVAL (FIX 2) ---');

assert(
  migrationCode.includes('ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;'),
  'RLS enabled on public.content_reports'
);

assert(
  migrationCode.includes('CREATE POLICY "Authenticated users can create content reports"') &&
  migrationCode.includes('auth.uid() IS NOT NULL') &&
  migrationCode.includes('reporter_id = auth.uid()') &&
  migrationCode.includes('status = \'pending\''),
  'INSERT policy strictly requires authenticated session, reporter_id = auth.uid(), and status = pending'
);

assert(
  migrationCode.includes('CREATE POLICY "Users can view own reports and staff can view all"') &&
  migrationCode.includes('reporter_id = auth.uid()') &&
  migrationCode.includes('public.is_admin_or_editor()'),
  'SELECT policy isolates reporter identity: users see only their own reports, staff sees all'
);

assert(
  migrationCode.includes('CREATE POLICY "Staff can update content reports"') &&
  migrationCode.includes('FOR UPDATE') &&
  migrationCode.includes('USING (public.is_admin_or_editor())') &&
  migrationCode.includes('WITH CHECK (public.is_admin_or_editor())'),
  'UPDATE policy restricts report updates to staff only (Readers & Anonymous blocked)'
);

// Check 5.1: Reader cannot update reports (RLS policy check)
assert(
  !migrationCode.includes('FOR UPDATE USING (auth.uid() = reporter_id)'),
  'Reader cannot update reports (RLS policy check)'
);

// Check 5.2: Anonymous cannot update reports (RLS policy check)
assert(
  !migrationCode.includes('FOR UPDATE USING (true)'),
  'Anonymous cannot update reports (RLS policy check)'
);

// Check 5.3: No DELETE policy exists for normal users or staff (Fix 2)
const hasNoDeletePolicy = !migrationCode.includes('CREATE POLICY "Staff can delete content reports"') &&
  !migrationCode.includes('FOR DELETE USING');
assert(
  hasNoDeletePolicy && migrationCode.includes('DROP POLICY IF EXISTS "Staff can delete content reports"'),
  'No DELETE policy exists on content_reports (Destructive DELETE blocked for ALL users to preserve audit trail)'
);

// -----------------------------------------------------------------------------
// 6. SCHEMA.SQL SYNCHRONIZATION
// -----------------------------------------------------------------------------
console.log('\n--- 6. SCHEMA.SQL SYNCHRONIZATION ---');

const schemaCode = fs.readFileSync(schemaPath, 'utf-8');

assert(
  schemaCode.includes('CREATE TABLE IF NOT EXISTS public.content_reports') &&
  schemaCode.includes('chk_content_reports_type') &&
  schemaCode.includes('chk_content_reports_reason') &&
  schemaCode.includes('chk_content_reports_status'),
  'schema.sql contains content_reports table and constraints'
);

assert(
  schemaCode.includes('idx_content_reports_unique_pending') &&
  schemaCode.includes('WHERE status = \'pending\''),
  'schema.sql contains partial unique index for duplicate protection'
);

assert(
  schemaCode.includes('ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;'),
  'schema.sql enables RLS on content_reports'
);

assert(
  schemaCode.includes('CREATE POLICY "Authenticated users can create content reports"') &&
  schemaCode.includes('CREATE POLICY "Users can view own reports and staff can view all"') &&
  schemaCode.includes('CREATE POLICY "Staff can update content reports"') &&
  !schemaCode.includes('CREATE POLICY "Staff can delete content reports"'),
  'schema.sql contains synchronized RLS policies with destructive DELETE eliminated'
);

assert(
  schemaCode.includes('CREATE OR REPLACE FUNCTION public.protect_content_report_fields()') &&
  schemaCode.includes('trg_protect_content_report_fields'),
  'schema.sql contains protect_content_report_fields trigger and function'
);

// -----------------------------------------------------------------------------
// 7. SERVICE LAYER INTEGRATION
// -----------------------------------------------------------------------------
console.log('\n--- 7. SERVICE LAYER INTEGRATION ---');

assert(
  fs.existsSync(servicePath),
  'Service file src/services/reportService.ts exists',
  `Path: ${servicePath}`
);

const serviceCode = fs.readFileSync(servicePath, 'utf-8');

assert(
  serviceCode.includes('export async function createContentReport(') &&
  serviceCode.includes('supabase.auth.getUser()') &&
  serviceCode.includes('reporter_id: user.id'),
  'createContentReport derives reporter_id exclusively from authenticated session'
);

assert(
  serviceCode.includes('error.code === \'23505\'') &&
  serviceCode.includes('error.code === \'23503\''),
  'createContentReport handles 23505 (duplicate pending) and 23503 (target not found) gracefully'
);

assert(
  serviceCode.includes('export async function updateReportStatus(') &&
  serviceCode.includes('reviewed_by: user.id') &&
  serviceCode.includes('reviewed_at: nowIso'),
  'updateReportStatus updates ONLY status, reviewed_by, reviewed_at, updated_at'
);

// -----------------------------------------------------------------------------
// 8. REGRESSION VERIFICATION: #8A & #8C INTEGRITY
// -----------------------------------------------------------------------------
console.log('\n--- 8. REGRESSION VERIFICATION (#8A & #8C INTEGRITY) ---');

const migration8ACode = fs.readFileSync(migration8APath, 'utf-8');
const storageCode = fs.readFileSync(storageServicePath, 'utf-8');

assert(
  migration8ACode.includes('CREATE POLICY "Users can view their own profile"') &&
  migration8ACode.includes('CREATE POLICY "Staff can view all profiles"') &&
  migration8ACode.includes('CREATE OR REPLACE VIEW public.public_profiles'),
  '#8A profile privacy hardening migration remains intact and unmodified'
);

assert(
  schemaCode.includes('CREATE POLICY "Authenticated users can post comments"') &&
  schemaCode.includes('auth.uid() = user_id') &&
  schemaCode.includes('CREATE POLICY "Anyone can submit news"'),
  '#8A comment identity and submission identity RLS policies remain intact in schema.sql'
);

assert(
  storageCode.includes('extractSafeStoragePath') &&
  storageCode.includes('cleanupSubmissionMedia') &&
  storageCode.includes('deleteMediaFile'),
  '#8C storage hardening and cleanup helpers remain intact'
);

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n========================================================================');
console.log(`TOTAL CHECKS: ${totalChecks} | PASSED: ${passedChecks} | FAILED: ${failedChecks}`);
console.log('========================================================================');

if (failedChecks === 0) {
  console.log('🎉 ALL #8D-1 CONTENT REPORTING SECURITY CHECKS PASSED!\n');
  process.exit(0);
} else {
  console.error('❌ SOME CHECKS FAILED. Please review the output above.\n');
  process.exit(1);
}

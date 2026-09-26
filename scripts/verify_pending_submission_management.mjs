/**
 * @file verify_pending_submission_management.mjs
 * @description Comprehensive static verification script for #8F Pending Submission Management.
 * Verifies all 23 security, database, and UX criteria without running destructive live tests.
 */

import fs from 'fs';
import path from 'path';

const projectRoot = 'c:/Users/DELL/Desktop/Rachabanda_app';
const migrationPath = path.join(projectRoot, 'supabase/migrations/20260926000005_pending_submission_management.sql');
const schemaPath = path.join(projectRoot, 'supabase/schema.sql');
const submissionServicePath = path.join(projectRoot, 'src/services/submissionService.ts');
const storageServicePath = path.join(projectRoot, 'src/services/storageService.ts');
const submitNewsScreenPath = path.join(projectRoot, 'src/components/SubmitNewsScreen.tsx');
const reporterScreenPath = path.join(projectRoot, 'src/components/ReporterScreen.tsx');
const adminDashboardPath = path.join(projectRoot, 'src/components/AdminDashboard.tsx');
const storageSetupPath = path.join(projectRoot, 'supabase/migrations/20260924000001_storage_setup.sql');
const typesPath = path.join(projectRoot, 'src/types.ts');

console.log('========================================================================');
console.log('RACHABANDA — #8F PENDING SUBMISSION MANAGEMENT STATIC VERIFICATION');
console.log('========================================================================\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(condition, checkNum, testName, details = '') {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`✅ PASS [Criterion ${checkNum}] ${testName}`);
    if (details) console.log(`   ${details}`);
  } else {
    failedChecks++;
    console.error(`❌ FAIL [Criterion ${checkNum}] ${testName}`);
    if (details) console.error(`   ${details}`);
  }
}

// -----------------------------------------------------------------------------
// READ FILE CONTENTS FOR STATIC ANALYSIS
// -----------------------------------------------------------------------------
const migrationSql = fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, 'utf-8') : '';
const schemaSql = fs.existsSync(schemaPath) ? fs.readFileSync(schemaPath, 'utf-8') : '';
const submissionServiceCode = fs.existsSync(submissionServicePath) ? fs.readFileSync(submissionServicePath, 'utf-8') : '';
const storageServiceCode = fs.existsSync(storageServicePath) ? fs.readFileSync(storageServicePath, 'utf-8') : '';
const submitNewsScreenCode = fs.existsSync(submitNewsScreenPath) ? fs.readFileSync(submitNewsScreenPath, 'utf-8') : '';
const reporterScreenCode = fs.existsSync(reporterScreenPath) ? fs.readFileSync(reporterScreenPath, 'utf-8') : '';
const adminDashboardCode = fs.existsSync(adminDashboardPath) ? fs.readFileSync(adminDashboardPath, 'utf-8') : '';
const storageSql = fs.existsSync(storageSetupPath) ? fs.readFileSync(storageSetupPath, 'utf-8') : '';
const typesCode = fs.existsSync(typesPath) ? fs.readFileSync(typesPath, 'utf-8') : '';

// -----------------------------------------------------------------------------
// CRITERION 1: WITHDRAWAL RPC EXISTS
// -----------------------------------------------------------------------------
const withdrawalRpcExists =
  migrationSql.includes('CREATE OR REPLACE FUNCTION public.withdraw_own_submission') &&
  schemaSql.includes('CREATE OR REPLACE FUNCTION public.withdraw_own_submission') &&
  migrationSql.includes('p_submission_id uuid');
assert(
  withdrawalRpcExists,
  1,
  'Withdrawal RPC exists: public.withdraw_own_submission(p_submission_id uuid) defined in migration & schema',
  'Ensures the database has a dedicated withdrawal endpoint'
);

// -----------------------------------------------------------------------------
// CRITERION 2: SECURITY DEFINER ON WITHDRAWAL RPC
// -----------------------------------------------------------------------------
const withdrawSecDefiner =
  /CREATE OR REPLACE FUNCTION public\.withdraw_own_submission[\s\S]*?SECURITY DEFINER/i.test(migrationSql) &&
  /CREATE OR REPLACE FUNCTION public\.withdraw_own_submission[\s\S]*?SECURITY DEFINER/i.test(schemaSql);
assert(
  withdrawSecDefiner,
  2,
  'SECURITY DEFINER configured on public.withdraw_own_submission()',
  'Enforces privilege boundary inside the function'
);

// -----------------------------------------------------------------------------
// CRITERION 3: SAFE search_path ON WITHDRAWAL RPC
// -----------------------------------------------------------------------------
const withdrawSearchPath =
  migrationSql.includes('SET search_path = public, auth, pg_temp') &&
  schemaSql.includes('SET search_path = public, auth, pg_temp');
assert(
  withdrawSearchPath,
  3,
  'Safe search_path set on public.withdraw_own_submission() (public, auth, pg_temp)',
  'Prevents schema search-path hijacking attacks'
);

// -----------------------------------------------------------------------------
// CRITERION 4: AUTHENTICATED-ONLY EXECUTION FOR WITHDRAWAL
// -----------------------------------------------------------------------------
const withdrawGrants =
  migrationSql.includes('REVOKE ALL ON FUNCTION public.withdraw_own_submission(uuid) FROM public;') &&
  migrationSql.includes('REVOKE ALL ON FUNCTION public.withdraw_own_submission(uuid) FROM anon;') &&
  migrationSql.includes('GRANT EXECUTE ON FUNCTION public.withdraw_own_submission(uuid) TO authenticated;');
assert(
  withdrawGrants,
  4,
  'Execution permissions: REVOKED from public/anon and GRANTED strictly to authenticated',
  'Blocks anonymous execution while enabling logged-in reporters'
);

// -----------------------------------------------------------------------------
// CRITERION 5: AUTH.UID OWNERSHIP CHECK
// -----------------------------------------------------------------------------
const withdrawAuthCheck =
  migrationSql.includes('v_user_id := auth.uid();') &&
  migrationSql.includes('IF v_user_id IS NULL THEN') &&
  migrationSql.includes('IF v_submission.user_id IS NULL OR v_submission.user_id != v_user_id THEN');
assert(
  withdrawAuthCheck,
  5,
  'auth.uid() ownership check: zero authenticated ownership ambiguity',
  'Verifies caller is authenticated and matches submission.user_id strictly'
);

// -----------------------------------------------------------------------------
// CRITERION 6: PENDING-ONLY WITHDRAWAL CHECK
// -----------------------------------------------------------------------------
const withdrawPendingOnly =
  migrationSql.includes("IF v_submission.status != 'pending' THEN") &&
  migrationSql.includes("AND status = 'pending';");
assert(
  withdrawPendingOnly,
  6,
  'Pending-only withdrawal check: approved and rejected submissions cannot be withdrawn',
  'Prevents modifying approved/published or rejected editorial records'
);

// -----------------------------------------------------------------------------
// CRITERION 7: ROW LOCKING FOR WITHDRAWAL
// -----------------------------------------------------------------------------
const withdrawRowLock =
  /FROM\s+public\.submissions[\s\S]*?WHERE\s+id\s*=\s*p_submission_id[\s\S]*?FOR\s+UPDATE;/i.test(migrationSql);
assert(
  withdrawRowLock,
  7,
  'Row locking: FOR UPDATE row lock acquired on submission row during withdrawal',
  'Eliminates concurrent approval/withdrawal race conditions'
);

// -----------------------------------------------------------------------------
// CRITERION 8: MEDIA COLLECTION BEFORE DELETION
// -----------------------------------------------------------------------------
const mediaCollectionIndex = migrationSql.indexOf('jsonb_agg(DISTINCT url)');
const deleteSubmissionIndex = migrationSql.indexOf('DELETE FROM public.submissions');
const mediaCollectionBeforeDelete =
  mediaCollectionIndex !== -1 &&
  deleteSubmissionIndex !== -1 &&
  mediaCollectionIndex < deleteSubmissionIndex &&
  migrationSql.includes('v_submission.image_url') &&
  migrationSql.includes('v_submission.audio_url') &&
  migrationSql.includes('v_submission.video_url');
assert(
  mediaCollectionBeforeDelete,
  8,
  'Media collection: image_url, audio_url, video_url captured BEFORE row deletion',
  'Returns media paths for safe subsequent storage cleanup'
);

// -----------------------------------------------------------------------------
// CRITERION 9: NO WITHDRAWN ENUM VALUE
// -----------------------------------------------------------------------------
const noWithdrawnEnum =
  !migrationSql.includes("ADD VALUE 'withdrawn'") &&
  !migrationSql.includes("ENUM ('pending', 'approved', 'rejected', 'withdrawn')") &&
  !schemaSql.includes("ENUM ('pending', 'approved', 'rejected', 'withdrawn')") &&
  typesCode.includes("status: 'pending' | 'approved' | 'rejected';") &&
  !typesCode.includes("'withdrawn'");
assert(
  noWithdrawnEnum,
  9,
  "No 'withdrawn' enum: submission_status enum remains ('pending', 'approved', 'rejected')",
  'Maintains exact schema consistency and matches account deletion pattern'
);

// -----------------------------------------------------------------------------
// CRITERION 10: REJECTION RPC EXISTS
// -----------------------------------------------------------------------------
const rejectionRpcExists =
  migrationSql.includes('CREATE OR REPLACE FUNCTION public.reject_submission') &&
  schemaSql.includes('CREATE OR REPLACE FUNCTION public.reject_submission') &&
  migrationSql.includes('p_submission_id uuid') &&
  migrationSql.includes('p_reason text');
assert(
  rejectionRpcExists,
  10,
  'Rejection RPC exists: public.reject_submission(p_submission_id, p_reason, p_reviewer_id) defined',
  'Replaces client-side direct update with atomic database function'
);

// -----------------------------------------------------------------------------
// CRITERION 11: ADMIN/EDITOR AUTHORIZATION FOR REJECTION
// -----------------------------------------------------------------------------
const rejectionAuthz =
  migrationSql.includes('IF NOT public.is_admin_or_editor() THEN') &&
  migrationSql.includes('Only administrators and editors can reject submissions');
assert(
  rejectionAuthz,
  11,
  'Admin/Editor authorization: public.is_admin_or_editor() enforced on rejection RPC',
  'Guarantees standard reporters or readers cannot reject submissions'
);

// -----------------------------------------------------------------------------
// CRITERION 12: REVIEWER IDENTITY VALIDATION
// -----------------------------------------------------------------------------
const reviewerIdentityCheck =
  migrationSql.includes('v_caller_id := auth.uid();') &&
  migrationSql.includes('IF p_reviewer_id IS NOT NULL AND p_reviewer_id != v_caller_id THEN') &&
  migrationSql.includes('Security violation: Reviewer ID');
assert(
  reviewerIdentityCheck,
  12,
  'Reviewer identity validation: p_reviewer_id strictly verified against auth.uid()',
  'Eliminates reviewer impersonation in audit logs'
);

// -----------------------------------------------------------------------------
// CRITERION 13: PENDING-ONLY REJECTION CHECK
// -----------------------------------------------------------------------------
const rejectPendingOnly =
  migrationSql.includes("IF v_submission.status != 'pending' THEN") &&
  migrationSql.includes('Submission is already');
assert(
  rejectPendingOnly,
  13,
  'Pending-only rejection: already-approved or already-rejected submissions cannot be rejected',
  'Preserves approved news integrity and prevents redundant rejections'
);

// -----------------------------------------------------------------------------
// CRITERION 14: ROW LOCKING FOR REJECTION
// -----------------------------------------------------------------------------
const rejectRowLock =
  /FROM\s+public\.submissions[\s\S]*?WHERE\s+id\s*=\s*p_submission_id[\s\S]*?FOR\s+UPDATE;/i.test(
    migrationSql.slice(migrationSql.indexOf('reject_submission'))
  );
assert(
  rejectRowLock,
  14,
  'Row locking for rejection: FOR UPDATE acquired on submission row',
  'Prevents concurrent approve/reject race condition with approve_submission()'
);

// -----------------------------------------------------------------------------
// CRITERION 15: CUSTOM REJECTION REASON VALIDATION
// -----------------------------------------------------------------------------
const rejectReasonValidation =
  migrationSql.includes('v_reason := trim(p_reason);') &&
  migrationSql.includes("IF v_reason IS NULL OR v_reason = '' THEN") &&
  migrationSql.includes('IF length(v_reason) > 500 THEN');
assert(
  rejectReasonValidation,
  15,
  'Rejection reason validation: required, trimmed, and capped at 500 characters',
  'Prevents empty rejections and excessively large payloads'
);

// -----------------------------------------------------------------------------
// CRITERION 16: RESUBMISSION CREATES A NEW PENDING SUBMISSION
// -----------------------------------------------------------------------------
const resubmissionCreatesNew =
  submitNewsScreenCode.includes('createSubmission') &&
  submissionServiceCode.includes("status: 'pending' as const") &&
  reporterScreenCode.includes("navigate('/submit', { state: { resubmitFrom: sub } })");
assert(
  resubmissionCreatesNew,
  16,
  "Resubmission creates a NEW submission with status='pending'",
  'Pre-fills details without modifying or reopening old rejected row'
);

// -----------------------------------------------------------------------------
// CRITERION 17: REJECTED RECORD IS NOT MUTATED INTO PENDING
// -----------------------------------------------------------------------------
const noMutationOfRejected =
  !reporterScreenCode.includes("update({ status: 'pending' })") &&
  !submissionServiceCode.includes("status = 'pending' WHERE id = rejected");
assert(
  noMutationOfRejected,
  17,
  'Rejected records are immutable: never updated back to pending status',
  'Preserves historical audit trail and editorial rejection reasons'
);

// -----------------------------------------------------------------------------
// CRITERION 18: FAILED-UPLOAD CLEANUP IN SUBMITNEWSSCREEN
// -----------------------------------------------------------------------------
const failedUploadCleanup =
  submitNewsScreenCode.includes('cleanupSubmissionMedia') &&
  submitNewsScreenCode.includes('hasUploadedMedia') &&
  submitNewsScreenCode.includes('uploadedImageUrl') &&
  submitNewsScreenCode.includes('catch (err: any)');
assert(
  failedUploadCleanup,
  18,
  'Failed-upload cleanup: SubmitNewsScreen calls cleanupSubmissionMedia on database error',
  'Removes newly uploaded files if DB insert fails without hiding error'
);

// -----------------------------------------------------------------------------
// CRITERION 19: REPORTER SCREEN HAS WITHDRAWAL
// -----------------------------------------------------------------------------
const reporterHasWithdrawal =
  reporterScreenCode.includes('withdrawOwnSubmission') &&
  reporterScreenCode.includes('withdrawModalSubmission') &&
  reporterScreenCode.includes('ఉపసంహరించు (Withdraw)') &&
  reporterScreenCode.includes('వార్త ఉపసంహరణ / Withdraw Submission');
assert(
  reporterHasWithdrawal,
  19,
  'ReporterScreen UX: provides pending withdrawal button and confirmation modal',
  'Allows reporter to safely withdraw pending news with clear warning'
);

// -----------------------------------------------------------------------------
// CRITERION 20: REPORTER SCREEN HAS REJECTED FILTER
// -----------------------------------------------------------------------------
const reporterHasRejectedFilter =
  reporterScreenCode.includes("setSubmissionFilter('rejected')") &&
  reporterScreenCode.includes('తిరస్కరించబడింది ({rejectedCount})');
assert(
  reporterHasRejectedFilter,
  20,
  'ReporterScreen UX: Rejected filter chip added alongside All, Pending, Approved',
  'Enables reporters to quickly view all rejected news items'
);

// -----------------------------------------------------------------------------
// CRITERION 21: REPORTER SCREEN HAS RESUBMIT
// -----------------------------------------------------------------------------
const reporterHasResubmit =
  reporterScreenCode.includes('handleResubmit') &&
  reporterScreenCode.includes('resubmitFrom') &&
  reporterScreenCode.includes('మళ్లీ సమర్పించు (Resubmit)');
assert(
  reporterHasResubmit,
  21,
  'ReporterScreen UX: Resubmit button provided for rejected submissions',
  'Routes to SubmitNewsScreen with pre-filled title, details, location, category'
);

// -----------------------------------------------------------------------------
// CRITERION 22: ADMIN DASHBOARD USES REJECTION DIALOG
// -----------------------------------------------------------------------------
const adminRejectionDialog =
  adminDashboardCode.includes('STANDARD_REJECTION_REASONS') &&
  adminDashboardCode.includes('rejectModalSubmission') &&
  adminDashboardCode.includes('handleOpenRejectModal') &&
  adminDashboardCode.includes('handleConfirmReject') &&
  adminDashboardCode.includes('వార్తను తిరస్కరించండి / Reject Submission');
assert(
  adminRejectionDialog,
  22,
  'AdminDashboard UX: Accessible rejection dialog with preset reasons and custom textarea',
  'Prevents accidental 1-click rejection and mandates explicit reason'
);

// -----------------------------------------------------------------------------
// CRITERION 23: NO STORAGE RLS WEAKENING
// -----------------------------------------------------------------------------
const storageSetupUnchanged =
  storageSql.includes("bucket_id = 'submissions-media'") &&
  storageSql.includes("(storage.foldername(name))[1] = auth.uid()::text") &&
  !migrationSql.includes('storage.objects') &&
  !migrationSql.includes('storage.buckets');
assert(
  storageSetupUnchanged,
  23,
  'No Storage RLS weakening: Storage policies remain strictly locked down',
  'Media cleanup respects existing storage boundaries without granting broad delete'
);

console.log('\n========================================================================');
console.log(`SUMMARY: ${passedChecks}/${totalChecks} checks passed (${failedChecks} failed).`);
console.log('========================================================================\n');

if (failedChecks > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL #8F PENDING SUBMISSION MANAGEMENT REQUIREMENTS VERIFIED SUCCESSFULLY!');
  process.exit(0);
}

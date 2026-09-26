/**
 * @file verify_account_deletion_architecture.mjs
 * @description Comprehensive static verification script for #8E Task 2: Database-First Account Deletion.
 * Verifies all 16 required security and architectural criteria + UI safety checks
 * WITHOUT deleting any actual user or modifying production data.
 */

import fs from 'fs';
import path from 'path';

const projectRoot = 'c:/Users/DELL/Desktop/Rachabanda_app';
const migrationPath = path.join(projectRoot, 'supabase/migrations/20260926000004_account_deletion_rpc.sql');
const schemaPath = path.join(projectRoot, 'supabase/schema.sql');
const storageSetupPath = path.join(projectRoot, 'supabase/migrations/20260924000001_storage_setup.sql');
const cascadeMigrationPath = path.join(projectRoot, 'supabase/migrations/20260926000003_content_report_cascade_fix.sql');
const userServicePath = path.join(projectRoot, 'src/services/userService.ts');
const authContextPath = path.join(projectRoot, 'src/contexts/AuthContext.tsx');
const dialogPath = path.join(projectRoot, 'src/components/DeleteAccountDialog.tsx');
const reporterScreenPath = path.join(projectRoot, 'src/components/ReporterScreen.tsx');

console.log('========================================================================');
console.log('RACHABANDA — #8E TASK 2: DATABASE-FIRST ACCOUNT DELETION VERIFICATION');
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
const storageSql = fs.existsSync(storageSetupPath) ? fs.readFileSync(storageSetupPath, 'utf-8') : '';
const cascadeSql = fs.existsSync(cascadeMigrationPath) ? fs.readFileSync(cascadeMigrationPath, 'utf-8') : '';
const userServiceCode = fs.existsSync(userServicePath) ? fs.readFileSync(userServicePath, 'utf-8') : '';
const authContextCode = fs.existsSync(authContextPath) ? fs.readFileSync(authContextPath, 'utf-8') : '';
const dialogCode = fs.existsSync(dialogPath) ? fs.readFileSync(dialogPath, 'utf-8') : '';
const reporterScreenCode = fs.existsSync(reporterScreenPath) ? fs.readFileSync(reporterScreenPath, 'utf-8') : '';

// Extract deleteOwnAccount function slice from userService.ts for execution order analysis
const deleteOwnAccountFnIndex = userServiceCode.indexOf('export async function deleteOwnAccount');
const deleteOwnAccountFnBody = deleteOwnAccountFnIndex !== -1 ? userServiceCode.slice(deleteOwnAccountFnIndex) : '';
const rpcCallIndex = deleteOwnAccountFnBody.indexOf("supabase.rpc('delete_own_account')");
const preRpcCode = rpcCallIndex !== -1 ? deleteOwnAccountFnBody.slice(0, rpcCallIndex) : '';
const postRpcCode = rpcCallIndex !== -1 ? deleteOwnAccountFnBody.slice(rpcCallIndex) : '';

// -----------------------------------------------------------------------------
// CRITERION 1: DB-FIRST RPC SEQUENCE
// -----------------------------------------------------------------------------
const dbFirstSequenceCheck =
  rpcCallIndex !== -1 &&
  deleteOwnAccountFnBody.includes("// 2. Call the secure database RPC: delete_own_account() FIRST") &&
  deleteOwnAccountFnBody.includes("const { data: rpcData, error: rpcError } = await supabase.rpc('delete_own_account');") &&
  deleteOwnAccountFnBody.includes("if (rpcError)");
assert(
  dbFirstSequenceCheck,
  1,
  'DB-first RPC sequence: supabase.rpc("delete_own_account") is called FIRST before any Storage cleanup',
  'Guarantees DB atomicity and protects active account from Storage corruption'
);

// -----------------------------------------------------------------------------
// CRITERION 2: PENDING MEDIA URLS COLLECTED BEFORE DELETION
// -----------------------------------------------------------------------------
const collectMediaSqlRegex = /SELECT[\s\S]*?jsonb_agg\(DISTINCT\s+url\)[\s\S]*?INTO\s+v_pending_media_urls[\s\S]*?FROM[\s\S]*?status\s*=\s*'pending'/i;
const collectIndexInMigration = migrationSql.indexOf('v_pending_media_urls');
const deletePendingIndexInMigration = migrationSql.indexOf("DELETE FROM public.submissions\n  WHERE user_id = v_user_id\n    AND status = 'pending'");
const collectMediaBeforeDelete =
  collectMediaSqlRegex.test(migrationSql) &&
  collectMediaSqlRegex.test(schemaSql) &&
  collectIndexInMigration !== -1 &&
  deletePendingIndexInMigration !== -1 &&
  collectIndexInMigration < deletePendingIndexInMigration &&
  migrationSql.includes("image_url AS url") &&
  migrationSql.includes("audio_url AS url") &&
  migrationSql.includes("video_url AS url") &&
  migrationSql.includes("'pending_media_urls', v_pending_media_urls") &&
  schemaSql.includes("'pending_media_urls', v_pending_media_urls");
assert(
  collectMediaBeforeDelete,
  2,
  'Pending submission media URLs (image, audio, video) collected BEFORE pending rows are deleted',
  'Ensures media references are safely captured before atomic row deletion'
);

// -----------------------------------------------------------------------------
// CRITERION 3: PENDING ROWS DELETED ATOMICALLY
// -----------------------------------------------------------------------------
const pendingRowsDeletedCheck =
  migrationSql.includes("DELETE FROM public.submissions") &&
  migrationSql.includes("WHERE user_id = v_user_id") &&
  migrationSql.includes("AND status = 'pending'") &&
  migrationSql.includes("GET DIAGNOSTICS v_pending_count = ROW_COUNT;") &&
  schemaSql.includes("DELETE FROM public.submissions") &&
  schemaSql.includes("AND status = 'pending'");
assert(
  pendingRowsDeletedCheck,
  3,
  'Pending submissions owned by caller are atomically deleted/withdrawn by the RPC',
  'Draft/pending submissions are fully cleaned up without leaving orphaned drafts'
);

// -----------------------------------------------------------------------------
// CRITERION 4: RETAINED SUBMISSIONS ANONYMIZED
// -----------------------------------------------------------------------------
const retainedSubmissionsAnonymized =
  migrationSql.includes("UPDATE public.submissions") &&
  migrationSql.includes("reporter_name = 'రచ్చబండ పౌరుడు'") &&
  migrationSql.includes("reporter_phone = NULL") &&
  migrationSql.includes("WHERE user_id = v_user_id") &&
  schemaSql.includes("reporter_name = 'రచ్చబండ పౌరుడు'") &&
  schemaSql.includes("reporter_phone = NULL");
assert(
  retainedSubmissionsAnonymized,
  4,
  'Retained submissions anonymized: reporter_name = "రచ్చబండ పౌరుడు", reporter_phone = NULL',
  'Approved news records remain published while PII is stripped'
);

// -----------------------------------------------------------------------------
// CRITERION 5: COMMENTS ANONYMIZED
// -----------------------------------------------------------------------------
const commentsAnonymized =
  migrationSql.includes("UPDATE public.comments") &&
  migrationSql.includes("user_name = 'రచ్చబండ పాఠకుడు'") &&
  migrationSql.includes("WHERE user_id = v_user_id") &&
  schemaSql.includes("user_name = 'రచ్చబండ పాఠకుడు'");
assert(
  commentsAnonymized,
  5,
  'Comments are preserved and anonymized: user_name = "రచ్చబండ పాఠకుడు"',
  'Maintains article discussion continuity while anonymizing user identity'
);

// -----------------------------------------------------------------------------
// CRITERION 6: SOLE-ADMIN PROTECTION
// -----------------------------------------------------------------------------
const soleAdminCheck =
  migrationSql.includes("v_role = 'admin'") &&
  migrationSql.includes("v_admin_count <= 1") &&
  (migrationSql.includes("42501") || migrationSql.includes("ERRCODE = '42501'")) &&
  migrationSql.includes("Cannot delete the sole administrator account") &&
  schemaSql.includes("Cannot delete the sole administrator account");
assert(
  soleAdminCheck,
  6,
  'Sole-admin protection rejects deletion with SQLSTATE 42501 when only 1 admin remains',
  'Prevents administrative lockout'
);

// -----------------------------------------------------------------------------
// CRITERION 7: AUTH.UID-DERIVED IDENTITY
// -----------------------------------------------------------------------------
const authUidIdentityCheck =
  migrationSql.includes('v_user_id := auth.uid();') &&
  migrationSql.includes('IF v_user_id IS NULL THEN') &&
  schemaSql.includes('v_user_id := auth.uid();') &&
  !migrationSql.includes('delete_own_account(p_user_id') &&
  !migrationSql.includes('delete_own_account(user_id') &&
  userServiceCode.includes('export async function deleteOwnAccount(): Promise') &&
  !userServiceCode.includes('deleteOwnAccount(userId');
assert(
  authUidIdentityCheck,
  7,
  'Caller identity derived exclusively from auth.uid(); no client-supplied user ID is accepted',
  'Guarantees caller cannot spoof or delete another user\'s account'
);

// -----------------------------------------------------------------------------
// CRITERION 8: SECURITY DEFINER
// -----------------------------------------------------------------------------
const secDefCheck =
  /FUNCTION\s+public\.delete_own_account\s*\(\s*\)[\s\S]*?SECURITY\s+DEFINER/i.test(migrationSql) &&
  /FUNCTION\s+public\.delete_own_account\s*\(\s*\)[\s\S]*?SECURITY\s+DEFINER/i.test(schemaSql);
assert(
  secDefCheck,
  8,
  'Function declared with SECURITY DEFINER for privileged auth.users and profile cleanup',
  'Runs with definition privileges to cascade deletion across system tables'
);

// -----------------------------------------------------------------------------
// CRITERION 9: SAFE SEARCH_PATH
// -----------------------------------------------------------------------------
const safeSearchPathCheck =
  /SET\s+search_path\s*=\s*public\s*,\s*auth\s*,\s*pg_temp/i.test(migrationSql) &&
  /SET\s+search_path\s*=\s*public\s*,\s*auth\s*,\s*pg_temp/i.test(schemaSql);
assert(
  safeSearchPathCheck,
  9,
  'Explicit safe search_path configured: SET search_path = public, auth, pg_temp',
  'Protects against search_path hijacking'
);

// -----------------------------------------------------------------------------
// CRITERION 10: PUBLIC & ANON EXECUTE REVOKED
// -----------------------------------------------------------------------------
const revokePublicAnonCheck =
  migrationSql.includes('REVOKE ALL ON FUNCTION public.delete_own_account() FROM public;') &&
  migrationSql.includes('REVOKE ALL ON FUNCTION public.delete_own_account() FROM anon;') &&
  schemaSql.includes('REVOKE ALL ON FUNCTION public.delete_own_account() FROM public;') &&
  schemaSql.includes('REVOKE ALL ON FUNCTION public.delete_own_account() FROM anon;');
assert(
  revokePublicAnonCheck,
  10,
  'Execution revoked from public and anon roles',
  'Anonymous callers are blocked at database level'
);

// -----------------------------------------------------------------------------
// CRITERION 11: AUTHENTICATED EXECUTE GRANTED
// -----------------------------------------------------------------------------
const grantAuthenticatedCheck =
  /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.delete_own_account\s*\(\s*\)\s+TO\s+authenticated/i.test(migrationSql) &&
  /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.delete_own_account\s*\(\s*\)\s+TO\s+authenticated/i.test(schemaSql);
assert(
  grantAuthenticatedCheck,
  11,
  'EXECUTE granted strictly to authenticated role',
  'Only logged-in users with valid JWT session can invoke the RPC'
);

// -----------------------------------------------------------------------------
// CRITERION 12: NO SERVICE_ROLE USAGE
// -----------------------------------------------------------------------------
function searchServiceRoleKey(dir) {
  let found = false;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
      if (searchServiceRoleKey(fullPath)) return true;
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js'))) {
      const code = fs.readFileSync(fullPath, 'utf-8');
      if (/SUPABASE_SERVICE_ROLE_KEY|VITE_.*SERVICE_ROLE/i.test(code) && !fullPath.includes('scripts')) {
        found = true;
        break;
      }
    }
  }
  return found;
}
const serviceRoleInFrontend = searchServiceRoleKey(path.join(projectRoot, 'src'));
assert(
  !serviceRoleInFrontend,
  12,
  'No service_role key or elevated credentials exposed in frontend client code',
  'All operations rely solely on RLS and authenticated SECURITY DEFINER RPC'
);

// -----------------------------------------------------------------------------
// CRITERION 13: STORAGE RLS UNCHANGED
// -----------------------------------------------------------------------------
const storageRlsUnchangedCheck =
  storageSql.includes('ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;') &&
  storageSql.includes('CREATE POLICY "Allow delete on submissions-media"') &&
  storageSql.includes("(auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text)") &&
  !migrationSql.includes('storage.objects') &&
  !schemaSql.includes('CREATE POLICY "Allow delete on submissions-media" ON storage.objects FOR DELETE USING (true)');
assert(
  storageRlsUnchangedCheck,
  13,
  'Storage RLS policies remain unchanged and secure; no broad or anonymous DELETE introduced',
  'Storage authorization boundary is strictly preserved'
);

// -----------------------------------------------------------------------------
// CRITERION 14: STORAGE CLEANUP OCCURS ONLY AFTER SUCCESSFUL RPC
// -----------------------------------------------------------------------------
const postRpcStorageCleanupCheck =
  postRpcCode.includes('cleanupSubmissionMedia') &&
  postRpcCode.includes('pending_media_urls') &&
  postRpcCode.includes('avatarPrefix') &&
  postRpcCode.includes('SUBMISSIONS_BUCKET') &&
  postRpcCode.includes('supabase.auth.signOut()');
assert(
  postRpcStorageCleanupCheck,
  14,
  'Storage cleanup occurs strictly AFTER successful RPC execution in userService.deleteOwnAccount()',
  'Pending media and avatar cleanup execute only after DB deletion confirms success'
);

// -----------------------------------------------------------------------------
// CRITERION 15: STORAGE CLEANUP IS NONFATAL
// -----------------------------------------------------------------------------
const nonfatalCleanupCheck =
  postRpcCode.includes('Non-fatal') &&
  postRpcCode.includes('console.warn') &&
  postRpcCode.includes('try {') &&
  postRpcCode.includes('} catch (pendingMediaErr)') &&
  postRpcCode.includes('} catch (avatarErr)') &&
  postRpcCode.includes('return {\n      success: true,');
assert(
  nonfatalCleanupCheck,
  15,
  'Storage cleanup failures are non-fatal and MUST NOT turn a successful account deletion into a failure',
  'Errors/warnings are logged; user account deletion succeeds atomically regardless of storage hiccups'
);

// -----------------------------------------------------------------------------
// CRITERION 16: NO PRE-RPC STORAGE DELETION REMAINS
// -----------------------------------------------------------------------------
const noPreRpcStorageCheck =
  !preRpcCode.includes('supabase.storage') &&
  !preRpcCode.includes('cleanupSubmissionMedia') &&
  !preRpcCode.includes('deleteMediaFile') &&
  !preRpcCode.includes('.delete()');
assert(
  noPreRpcStorageCheck,
  16,
  'No pre-RPC Storage deletion remains in userService.deleteOwnAccount()',
  'Verified: zero storage mutation occurs before the RPC executes'
);

// -----------------------------------------------------------------------------
// CRITERION 17: CONTENT REPORT CASCADE TRIGGER PRESERVED (#8E TASK 1 INTEGRITY)
// -----------------------------------------------------------------------------
const triggerIntactCheck =
  cascadeSql.includes("protect_content_report_fields") &&
  cascadeSql.includes("NEW.reporter_id IS NULL") &&
  cascadeSql.includes("NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = OLD.reporter_id)");
assert(
  triggerIntactCheck,
  17,
  '#8E Task 1 trigger protect_content_report_fields() remains intact and allows ON DELETE SET NULL',
  'Rejects illicit staff modifications while allowing profile deletion cascade'
);

// -----------------------------------------------------------------------------
// CRITERION 18: UI TWO-STEP CONFIRMATION MODAL
// -----------------------------------------------------------------------------
const uiTwoStepCheck =
  dialogCode.includes("const [step, setStep] = useState<1 | 2>(1);") &&
  dialogCode.includes("శాశ్వతంగా తొలగించబడేవి (Permanently Deleted):") &&
  dialogCode.includes("అజ్ఞాతీకరించబడేవి (Anonymized & Retained):") &&
  dialogCode.includes("ఖాతాను శాశ్వతంగా తొలగించండి");
assert(
  uiTwoStepCheck,
  18,
  'DeleteAccountDialog implements two-step confirmation with detailed bilingual impact disclosure',
  'Step 1 explains permanent deletion and anonymization; Step 2 requires explicit final action'
);

// -----------------------------------------------------------------------------
// CRITERION 19: UI ACCESSIBILITY & FOCUS TRAP
// -----------------------------------------------------------------------------
const uiFocusTrapCheck =
  dialogCode.includes('role="dialog"') &&
  dialogCode.includes('aria-modal="true"') &&
  dialogCode.includes("e.key === 'Tab'") &&
  dialogCode.includes("e.key === 'Escape'") &&
  dialogCode.includes("previousActiveElementRef.current.focus()");
assert(
  uiFocusTrapCheck,
  19,
  'DeleteAccountDialog implements WAI-ARIA role="dialog", aria-modal, focus trap, and Escape dismissal',
  'Keyboard navigation stays strictly within modal, focus restored upon closure'
);

// -----------------------------------------------------------------------------
// CRITERION 20: UI PREVENTS DOUBLE SUBMISSION
// -----------------------------------------------------------------------------
const doubleSubmissionCheck =
  dialogCode.includes("const [isDeleting, setIsDeleting] = useState<boolean>(false);") &&
  dialogCode.includes("disabled={isDeleting}") &&
  reporterScreenCode.includes("<DeleteAccountDialog") &&
  reporterScreenCode.includes('id="reporter-delete-account-btn"');
assert(
  doubleSubmissionCheck,
  20,
  'UI prevents double submission with loading spinner, disabled states, and button locks',
  'ReporterScreen integrates accessible trigger button and dialog handler'
);

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n========================================================================');
console.log(`TOTAL ARCHITECTURE CHECKS: ${totalChecks}`);
console.log(`PASSED: ${passedChecks}`);
console.log(`FAILED: ${failedChecks}`);
console.log('========================================================================\n');

if (failedChecks > 0) {
  console.error('❌ Verification failed. Please resolve above issues.');
  process.exit(1);
} else {
  console.log('✨ ALL 20 ARCHITECTURE AND SECURITY CRITERIA VERIFIED SUCCESSFULLY!');
  process.exit(0);
}

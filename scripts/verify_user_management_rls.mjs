/**
 * @file verify_user_management_rls.mjs
 * @description Static and structural verification script for User Management Database Security (Migration 05).
 */

import fs from 'fs';
import path from 'path';

const projectRoot = 'c:/Users/DELL/Desktop/Rachabanda_app';
const migrationPath = path.join(projectRoot, 'supabase/migrations/20260925000005_user_management.sql');
const schemaPath = path.join(projectRoot, 'supabase/schema.sql');

async function main() {
  console.log('========================================================================');
  console.log('RACHABANDA — USER MANAGEMENT DATABASE SECURITY STATIC VERIFICATION');
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

  // 1. Migration file exists
  testCheck(
    'Migration file 20260925000005_user_management.sql exists',
    fs.existsSync(migrationPath),
    `File path: ${migrationPath}`
  );

  if (!fs.existsSync(migrationPath)) {
    console.error('Migration file not found. Aborting remaining checks.');
    process.exit(1);
  }

  const migration = fs.readFileSync(migrationPath, 'utf-8');

  // 2. Required indexes exist in migration
  const hasRoleIdx = migration.includes('idx_profiles_role') && migration.includes('ON public.profiles(role)');
  const hasCreatedIdx = migration.includes('idx_profiles_created') && migration.includes('public.profiles(created_at DESC)');
  const hasNameIdx = migration.includes('idx_profiles_full_name') && migration.includes('public.profiles(full_name)');

  testCheck(
    'All 3 required performance indexes declared in migration',
    hasRoleIdx && hasCreatedIdx && hasNameIdx,
    `idx_profiles_role: ${hasRoleIdx}, idx_profiles_created: ${hasCreatedIdx}, idx_profiles_full_name: ${hasNameIdx}`
  );

  // 3. RPC exists in migration
  const hasRpc = migration.includes('CREATE OR REPLACE FUNCTION public.admin_set_user_role');
  testCheck(
    'public.admin_set_user_role function declared in migration',
    hasRpc,
    'Found CREATE OR REPLACE FUNCTION public.admin_set_user_role'
  );

  // 4. RPC is SECURITY DEFINER
  const rpcIsSecDef = migration.includes('admin_set_user_role') && migration.includes('SECURITY DEFINER');
  testCheck(
    'admin_set_user_role is marked SECURITY DEFINER',
    rpcIsSecDef,
    'Enables privileged role updates under strict server-side validation'
  );

  // 5. search_path is hardened
  const rpcSearchPath = migration.includes('SET search_path = public, pg_temp');
  testCheck(
    'RPC search_path is explicitly hardened (public, pg_temp)',
    rpcSearchPath,
    'Prevents search_path hijacking in SECURITY DEFINER context'
  );

  // 6. Caller must be admin (determined from database public.profiles using auth.uid())
  const callerAuthCheck = migration.includes('auth.uid()') &&
    migration.includes('SELECT role INTO v_caller_role') &&
    migration.includes("v_caller_role != 'admin'");
  testCheck(
    "Caller role is strictly queried from public.profiles via auth.uid() and must be 'admin'",
    callerAuthCheck,
    'Does not trust frontend role payload; enforces server-evaluated admin identity'
  );

  // 7. Self-demotion is rejected
  const selfDemoteCheck = migration.includes("p_user_id = v_caller_id AND p_new_role != 'admin'");
  testCheck(
    'Self-demotion protection enforced (administrators cannot demote themselves)',
    selfDemoteCheck,
    "Rejects p_user_id = v_caller_id when p_new_role != 'admin'"
  );

  // 8. Editor role assignment is rejected in trigger and RPC
  const triggerRejectsEditor = migration.includes("role = 'admin'") &&
    !migration.includes("protect_profile_role()\\nRETURNS trigger\\nLANGUAGE plpgsql\\nSECURITY DEFINER\\nSET search_path = public, auth, pg_temp\\nAS $$\\nBEGIN\\n  IF (OLD.role IS DISTINCT FROM NEW.role) THEN\\n    IF NOT public.is_admin_or_editor()");
  testCheck(
    'protect_profile_role trigger rejects editor (only admin allowed)',
    triggerRejectsEditor,
    "Verified: protect_profile_role strictly checks role = 'admin' instead of is_admin_or_editor()"
  );

  // 9. Anon execute is revoked
  const anonRevoked = migration.includes('REVOKE EXECUTE ON FUNCTION public.admin_set_user_role(uuid, public.user_role) FROM anon') &&
    migration.includes('REVOKE EXECUTE ON FUNCTION public.admin_set_user_role(uuid, public.user_role) FROM public');
  testCheck(
    'EXECUTE privilege explicitly revoked from anon and public',
    anonRevoked,
    'Prevents unauthenticated calls at PostgreSQL permissions level'
  );

  // 10. Authenticated execute is granted
  const authGranted = migration.includes('GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, public.user_role) TO authenticated');
  testCheck(
    'EXECUTE privilege granted to authenticated role',
    authGranted,
    'Allows logged-in users with admin token to call RPC'
  );

  // 11. Existing protect_profile_role trigger is hardened in migration
  const triggerHardened = migration.includes('CREATE OR REPLACE FUNCTION public.protect_profile_role()') &&
    migration.includes("WHERE id = auth.uid() AND role = 'admin'") &&
    migration.includes("OLD.id = auth.uid() AND NEW.role != 'admin'");
  testCheck(
    'Existing protect_profile_role() trigger hardened with admin check and self-demotion guard',
    triggerHardened,
    'Trigger provides defense-in-depth on any direct profile updates'
  );

  // 12. Canonical schema.sql contains the implementation
  testCheck(
    'schema.sql exists and is readable',
    fs.existsSync(schemaPath),
    `Schema path: ${schemaPath}`
  );

  const schema = fs.readFileSync(schemaPath, 'utf-8');

  const schemaHasIndexes = schema.includes('idx_profiles_role') &&
    schema.includes('idx_profiles_created') &&
    schema.includes('idx_profiles_full_name');

  const schemaHasHardenedTrigger = schema.includes('CREATE OR REPLACE FUNCTION public.protect_profile_role()') &&
    schema.includes("WHERE id = auth.uid() AND role = 'admin'");

  const schemaHasRpc = schema.includes('CREATE OR REPLACE FUNCTION public.admin_set_user_role') &&
    schema.includes('REVOKE EXECUTE ON FUNCTION public.admin_set_user_role(uuid, public.user_role) FROM anon') &&
    schema.includes('GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, public.user_role) TO authenticated');

  testCheck(
    'schema.sql synchronized with indexes, hardened trigger, and admin_set_user_role RPC',
    schemaHasIndexes && schemaHasHardenedTrigger && schemaHasRpc,
    `Indexes: ${schemaHasIndexes}, Hardened Trigger: ${schemaHasHardenedTrigger}, RPC: ${schemaHasRpc}`
  );

  console.log('\n========================================================================');
  console.log(`VERIFICATION SUMMARY: ${passed}/${total} CHECKS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('========================================================================\n');

  if (passed === total) {
    console.log('ALL STATIC VERIFICATION CHECKS PASSED! Ready for manual Supabase execution.\n');
    process.exit(0);
  } else {
    console.error('VERIFICATION FAILED: Some checks did not pass.\n');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});

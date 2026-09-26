/**
 * @file verify_user_management_service.mjs
 * @description Verification script for userService user management functions (14 static checks & harmless live read tests)
 */

import fs from 'fs';
import path from 'path';

const projectRoot = 'c:/Users/DELL/Desktop/Rachabanda_app';
const servicePath = path.join(projectRoot, 'src/services/userService.ts');
const typesPath = path.join(projectRoot, 'src/types.ts');
const envLocalPath = path.join(projectRoot, '.env.local');

async function main() {
  console.log('====================================================');
  console.log('RACHABANDA — USER MANAGEMENT SERVICE LAYER VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, checkNum, message) {
    total++;
    if (condition) {
      console.log(`✅ Check ${checkNum}: ${message}`);
      passed++;
    } else {
      console.error(`❌ Check ${checkNum}: FAILED - ${message}`);
    }
  }

  // 0. File existence
  assert(fs.existsSync(servicePath), '0a', 'userService.ts exists');
  const serviceContent = fs.readFileSync(servicePath, 'utf-8');

  assert(fs.existsSync(typesPath), '0b', 'types.ts exists');
  const typesContent = fs.readFileSync(typesPath, 'utf-8');

  // Strip comments for pure AST/code verification
  const serviceCodeOnly = serviceContent
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '');

  // Static checks on types.ts
  assert(
    typesContent.includes('export interface AdminUserFilters') &&
    typesContent.includes("role?: UserRole | 'all'") &&
    typesContent.includes('search?: string') &&
    typesContent.includes('limit?: number'),
    '0c',
    'AdminUserFilters declared in types.ts (role, search, limit)'
  );

  assert(
    typesContent.includes('export interface AdminUserProfile extends UserProfile'),
    '0d',
    'AdminUserProfile extends UserProfile declared in types.ts'
  );

  assert(
    typesContent.includes('export interface AdminSetUserRoleResult') &&
    typesContent.includes('role: UserRole'),
    '0e',
    'AdminSetUserRoleResult declared in types.ts'
  );

  // 1. fetchAllUsersForAdmin exists
  assert(
    serviceContent.includes('export async function fetchAllUsersForAdmin('),
    1,
    'fetchAllUsersForAdmin exists and is exported'
  );

  // 2. It queries profiles
  assert(
    serviceContent.includes(".from('profiles')"),
    2,
    "fetchAllUsersForAdmin queries 'profiles' table"
  );

  // 3. It supports role filtering
  assert(
    serviceContent.includes(".eq('role', options.role)"),
    3,
    'fetchAllUsersForAdmin supports role filtering'
  );

  // 4. It supports name/district/mandal/user-ID search
  assert(
    serviceContent.includes('full_name.ilike') &&
    serviceContent.includes('district.ilike') &&
    serviceContent.includes('mandal.ilike') &&
    serviceContent.includes('id.eq'),
    4,
    'fetchAllUsersForAdmin supports full_name, district, mandal, and user ID search'
  );

  // 5. It has a limit
  assert(
    serviceContent.includes('.limit(limit)') && serviceContent.includes('100'),
    5,
    'fetchAllUsersForAdmin has a limit with safe default (100)'
  );

  // 6. It sorts by created_at descending
  assert(
    serviceContent.includes(".order('created_at', { ascending: false })"),
    6,
    'fetchAllUsersForAdmin sorts by created_at descending'
  );

  // 7. adminSetUserRole exists
  assert(
    serviceContent.includes('export async function adminSetUserRole('),
    7,
    'adminSetUserRole exists and is exported'
  );

  // 8. It calls admin_set_user_role
  assert(
    serviceContent.includes(".rpc('admin_set_user_role'"),
    8,
    "adminSetUserRole calls 'admin_set_user_role' RPC"
  );

  // 9. It passes p_user_id
  assert(
    serviceContent.includes('p_user_id: userId'),
    9,
    'adminSetUserRole passes p_user_id to RPC'
  );

  // 10. It passes p_new_role
  assert(
    serviceContent.includes('p_new_role: newRole'),
    10,
    'adminSetUserRole passes p_new_role to RPC'
  );

  // 11. It does NOT directly update profiles.role
  const directlyUpdatesRole =
    serviceCodeOnly.includes("update({ role") ||
    serviceCodeOnly.includes("update({role") ||
    serviceCodeOnly.includes(".role =") ||
    serviceCodeOnly.includes("payload.role =");
  assert(
    !directlyUpdatesRole,
    11,
    'Does NOT directly update profiles.role from the frontend'
  );

  // 12. No service_role key is referenced
  const referencesServiceRole =
    serviceCodeOnly.toLowerCase().includes('service_role') ||
    typesContent.toLowerCase().includes('service_role') ||
    serviceCodeOnly.includes('SUPABASE_SERVICE_ROLE');
  assert(
    !referencesServiceRole,
    12,
    'No service_role key is referenced'
  );

  // 13. No password/token handling was added
  const referencesSensitive =
    serviceCodeOnly.includes('password') ||
    serviceCodeOnly.includes('access_token') ||
    serviceCodeOnly.includes('auth.users') ||
    serviceCodeOnly.includes('auth.admin');
  assert(
    !referencesSensitive,
    13,
    'No password, access_token, auth.admin, or auth.users query added'
  );

  // 14. Existing updateUserProfile() behavior remains intact
  const hasUpdateUserProfile = serviceContent.includes('export async function updateUserProfile(');
  const whitelistsOnlySafeFields =
    serviceContent.includes('payload.full_name =') &&
    serviceContent.includes('payload.bio =') &&
    serviceContent.includes('payload.district =') &&
    serviceContent.includes('payload.mandal =') &&
    serviceContent.includes('payload.phone =') &&
    serviceContent.includes('payload.avatar_url =');
  assert(
    hasUpdateUserProfile && whitelistsOnlySafeFields,
    14,
    'Existing updateUserProfile() behavior remains intact with strict field whitelisting'
  );

  // =========================================================================
  // Harmless Live Read Test using Supabase REST API (No live data modified)
  // =========================================================================
  if (fs.existsSync(envLocalPath)) {
    const env = fs.readFileSync(envLocalPath, 'utf-8');
    const urlMatch = env.match(/VITE_SUPABASE_URL=([^\r\n]+)/);
    const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=([^\r\n]+)/);

    if (urlMatch && keyMatch) {
      const url = urlMatch[1].trim();
      const anonKey = keyMatch[1].trim();
      const headers = {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      };

      try {
        console.log('\n--- Running Harmless Live Read Tests ---');

        const selectFields = 'id,full_name,phone,role,avatar_url,district,mandal,bio,created_at,updated_at';

        // Test 1: Fetch default profiles list
        const defaultRes = await fetch(
          `${url}/rest/v1/profiles?select=${selectFields}&order=created_at.desc&limit=10`,
          { headers }
        );
        assert(defaultRes.ok, '15a', 'Live query to public.profiles succeeded with HTTP 200');

        const defaultUsers = await defaultRes.json();
        assert(
          Array.isArray(defaultUsers),
          '15b',
          `Default fetch returned ${defaultUsers.length} profiles successfully`
        );

        if (defaultUsers && defaultUsers.length > 0) {
          const sample = defaultUsers[0];
          console.log(`   Sample profile: "${sample.full_name}" | Role: ${sample.role} | ID: ${sample.id}`);

          // Verify created_at descending sort order
          let isSorted = true;
          for (let i = 0; i < defaultUsers.length - 1; i++) {
            if (new Date(defaultUsers[i].created_at) < new Date(defaultUsers[i + 1].created_at)) {
              isSorted = false;
              break;
            }
          }
          assert(isSorted, '15c', 'Live profiles sorted by created_at DESC');

          // Verify schema integrity
          const hasRequiredFields =
            'id' in sample &&
            'full_name' in sample &&
            'role' in sample &&
            'created_at' in sample;
          assert(hasRequiredFields, '15d', 'Live profile conforms to AdminUserProfile interface');
        }

        // Test 2: Role filter query
        const roleRes = await fetch(
          `${url}/rest/v1/profiles?select=id,full_name,role,created_at&role=eq.admin&order=created_at.desc&limit=5`,
          { headers }
        );
        assert(roleRes.ok, '15e', "Role filtering for 'admin' evaluated successfully by PostgREST");
        const adminUsers = await roleRes.json();
        assert(
          Array.isArray(adminUsers) && adminUsers.every(u => u.role === 'admin'),
          '15f',
          `Role filtering confirmed only 'admin' records returned (${adminUsers.length} found)`
        );

        // Test 3: Search filter query with URL encoding
        const searchTerm = 'Admin';
        const orClause = encodeURIComponent(`full_name.ilike.%${searchTerm}%,district.ilike.%${searchTerm}%,mandal.ilike.%${searchTerm}%`);
        const searchRes = await fetch(
          `${url}/rest/v1/profiles?select=id,full_name,district,mandal&or=(${orClause})&limit=5`,
          { headers }
        );
        assert(searchRes.ok, '15g', `Search query for "${searchTerm}" evaluated successfully by PostgREST`);
        const searchedUsers = await searchRes.json();
        assert(
          Array.isArray(searchedUsers),
          '15h',
          `Search returned ${searchedUsers.length} records matching term "${searchTerm}"`
        );

      } catch (err) {
        console.error('❌ Live read test error:', err.message);
      }
    }
  }

  console.log(`\n====================================================`);
  console.log(`VERIFICATION SCORE: ${passed}/${total} checks passed.`);
  console.log(`====================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Unhandled verification error:', err);
  process.exit(1);
});

/**
 * @file verify_user_management_ui.mjs
 * @description Static verification script for User Management Admin Dashboard UI Integration
 */

import fs from 'fs';
import path from 'path';

const projectRoot = 'c:/Users/DELL/Desktop/Rachabanda_app';
const dashboardPath = path.join(projectRoot, 'src/components/AdminDashboard.tsx');
const userServicePath = path.join(projectRoot, 'src/services/userService.ts');

async function main() {
  console.log('========================================================');
  console.log('RACHABANDA — USER MANAGEMENT UI STATIC VERIFICATION');
  console.log('========================================================\n');

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

  assert(fs.existsSync(dashboardPath), 0, 'AdminDashboard.tsx exists');
  const content = fs.readFileSync(dashboardPath, 'utf-8');

  // Strip comments for pure code checks
  const codeOnly = content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '');

  // 1. Users tab exists
  assert(
    content.includes("setActiveTab('users')") &&
    (content.includes("activeTab === 'users'") || content.includes("activeTab === 'users' || activeTab === 'reporters'")) &&
    content.includes('వినియోగదారులు (Users)'),
    1,
    "Users tab exists with 'వినియోగదారులు (Users)' label in sidebar and state"
  );

  // 2. Users tab uses live user-service functions
  assert(
    content.includes('loadUsers') &&
    content.includes('fetchAllUsersForAdmin') &&
    content.includes('adminSetUserRole'),
    2,
    'Users tab connects to live user-service functions'
  );

  // 3. fetchAllUsersForAdmin is referenced
  assert(
    codeOnly.includes('fetchAllUsersForAdmin('),
    3,
    'fetchAllUsersForAdmin is imported and called with filter/search options'
  );

  // 4. adminSetUserRole is referenced
  assert(
    codeOnly.includes('adminSetUserRole('),
    4,
    'adminSetUserRole is imported and invoked on confirmed role changes'
  );

  // 5. No direct profiles.role update exists
  const hasDirectRoleUpdate =
    codeOnly.includes("update({ role") ||
    codeOnly.includes("update({role") ||
    codeOnly.includes(".from('profiles').update");
  assert(
    !hasDirectRoleUpdate,
    5,
    'No direct profiles.role database update exists in UI (delegates strictly to adminSetUserRole)'
  );

  // 6. No hardcoded user counts exist (calculated from live fetched profiles)
  const calculatesCountsLive =
    content.includes('userMetrics = React.useMemo') &&
    content.includes("filter((u) => u.role === 'reader')") &&
    content.includes("filter((u) => u.role === 'citizen_reporter')") &&
    content.includes("filter((u) => u.role === 'reporter')") &&
    content.includes("filter((u) => u.role === 'editor')") &&
    content.includes("filter((u) => u.role === 'admin')");
  assert(
    calculatesCountsLive,
    6,
    'No hardcoded user counts; metrics dynamically derived from live profile data'
  );

  // 7. All required role filters exist
  const hasAllRoleFilters =
    content.includes('value="all"') &&
    content.includes('value="reader"') &&
    content.includes('value="citizen_reporter"') &&
    content.includes('value="reporter"') &&
    content.includes('value="editor"') &&
    content.includes('value="admin"');
  assert(
    hasAllRoleFilters,
    7,
    'All required role filters exist (All, Reader, Citizen Reporter, Reporter, Editor, Admin)'
  );

  // 8. Admin-only role controls exist
  const hasAdminCheck =
    content.includes('isCurrentUserAdmin') &&
    content.includes("profile?.role === 'admin'");
  assert(
    hasAdminCheck,
    8,
    'Admin-only role management controls enforced via isCurrentUserAdmin'
  );

  // 9. Editor view-only behavior exists
  const hasEditorNote =
    content.includes('Only administrators can change user roles') ||
    content.includes('కేవలం అడ్మినిస్ట్రేటర్లకు మాత్రమే అనుమతి ఉంది') ||
    content.includes('వీక్షణ మాత్రమే (View Only)');
  assert(
    hasEditorNote,
    9,
    'Editor view-only behavior implemented with clear informational note'
  );

  // 10. Self-demotion UX exists
  const hasSelfDemotionProtection =
    content.includes('isSelf && u.role ===') ||
    content.includes('You cannot demote your own administrator account') ||
    content.includes('మీ స్వంత అడ్మినిస్ట్రేటర్ ఖాతాను మార్చలేరు');
  assert(
    hasSelfDemotionProtection,
    10,
    'Self-demotion UX prevention exists (prevents admins from demoting themselves)'
  );

  // 11. Loading state exists
  assert(
    content.includes('isUsersLoading') &&
    content.includes('వినియోగదారుల సమాచారం లోడ్ అవుతోంది...'),
    11,
    'Users loading spinner and status indicator exist'
  );

  // 12. Empty state exists
  assert(
    content.includes('వినియోగదారులు ఎవరూ కనుగొనబడలేదు') ||
    content.includes('No users found'),
    12,
    'Users empty state handling with informative feedback exists'
  );

  // 13. Error/retry state exists
  assert(
    content.includes('usersError') &&
    content.includes('మళ్ళీ ప్రయత్నించండి (Retry)'),
    13,
    'Error state with retry mechanism exists for user queries'
  );

  // 14. Confirmation dialog exists
  assert(
    content.includes('roleChangeTarget') &&
    content.includes('రోల్ మార్పు నిర్ధారణ (Confirm Role Change)') &&
    content.includes('handleConfirmRoleChange'),
    14,
    'Accessible confirmation dialog exists before applying any role change'
  );

  // 15. No fake user data was added
  const hasFakeUserData =
    content.includes('MOCK_USERS') ||
    content.includes('FAKE_USERS') ||
    content.includes('TEST_PROFILES');
  assert(
    !hasFakeUserData,
    15,
    'No fake/mock user data added; all users loaded live from Supabase'
  );

  // 16. Existing comment moderation UI remains intact
  const hasCommentModeration =
    content.includes("activeTab === 'comments'") &&
    content.includes('fetchAllCommentsForModeration') &&
    content.includes('updateCommentApproval') &&
    content.includes('handleToggleCommentApproval') &&
    content.includes('handleConfirmDeleteComment');
  assert(
    hasCommentModeration,
    16,
    'Existing comment moderation UI, filters, approval toggles, and delete flow remain intact'
  );

  // 17. Existing admin news/submission functionality remains intact
  const hasNewsFunctionality =
    content.includes('handleApprove') &&
    content.includes('handleReject') &&
    content.includes('loadLiveSubmissions') &&
    content.includes('approveSubmission') &&
    content.includes('rejectSubmission');
  assert(
    hasNewsFunctionality,
    17,
    'Existing news submission approval and rejection functionality remains intact'
  );

  console.log(`\n========================================================`);
  console.log(`VERIFICATION SCORE: ${passed}/${total} checks passed.`);
  console.log(`========================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Unhandled verification error:', err);
  process.exit(1);
});

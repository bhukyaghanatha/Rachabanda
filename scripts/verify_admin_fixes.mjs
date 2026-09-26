import fs from 'fs';
import path from 'path';

const projectRoot = 'c:/Users/DELL/Desktop/Rachabanda_app';
const dashboardPath = path.join(projectRoot, 'src/components/AdminDashboard.tsx');

console.log('========================================================');
console.log('RACHABANDA — ADMIN DASHBOARD #7 FIXES STATIC VERIFICATION');
console.log('========================================================\n');

const content = fs.readFileSync(dashboardPath, 'utf-8');

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${message}`);
  }
}

// FIX 1 Checks:
console.log('--- FIX 1: Tab/Filter Synchronization & Dynamic Headings ---');

// Check Pending handler
const hasPendingHandler = content.includes("setActiveTab('pending')") &&
  content.includes("setStatusFilter('pending')");
assert(hasPendingHandler, "Pending handler synchronizes setActiveTab('pending') and setStatusFilter('pending')");

// Check Published handler
const hasPublishedHandler = content.includes("setActiveTab('published')") &&
  content.includes("setStatusFilter('approved')");
assert(hasPublishedHandler, "Published handler synchronizes setActiveTab('published') and setStatusFilter('approved')");

// Check Dashboard handler
const hasDashboardHandler = content.includes("setActiveTab('dashboard')") &&
  content.includes("setStatusFilter('all')");
assert(hasDashboardHandler, "Dashboard handler synchronizes setActiveTab('dashboard') and setStatusFilter('all')");

// Check dynamic headings mapping
const hasDynamicHeadingFn = content.includes('getSubmissionsHeading') &&
  content.includes('Pending News (పరిశీలించాల్సిన వార్తలు)') &&
  content.includes('Published News (ప్రచురిత వార్తలు)') &&
  content.includes('Rejected News (తిరస్కరించిన వార్తలు)') &&
  content.includes('All News Submissions (అన్ని వార్తల సమర్పణలు)');
assert(hasDynamicHeadingFn, 'getSubmissionsHeading covers pending, approved, rejected, and all news bilingually');

// Check dynamic heading in JSX
const hasHeadingInJsx = content.includes('{getSubmissionsHeading()}');
assert(hasHeadingInJsx, 'Dynamic submissions heading rendered in JSX');

// FIX 2 Checks:
console.log('\n--- FIX 2: Removal of Duplicate User Fetch ---');

// Check mount useEffect doesn't call fetchAllUsersForAdmin
const mountEffectMatch = content.match(/useEffect\(\(\)\s*=>\s*\{\s*loadLiveSubmissions\(\);([\s\S]*?)\},\s*\[\]\);/);
const mountEffectBody = mountEffectMatch ? mountEffectMatch[1] : '';
const hasDuplicateMountUserFetch = mountEffectBody.includes('fetchAllUsersForAdmin');
assert(!hasDuplicateMountUserFetch, 'Mount-time useEffect([], ...) no longer contains redundant fetchAllUsersForAdmin');

// Check loadUsers still present
assert(content.includes('loadUsers(debouncedSearch, userRoleFilter)'), 'loadUsers still triggers initial and debounced/filtered user fetches');

// FIX 3 Checks:
console.log('\n--- FIX 3: Submissions Error Banner & Retry ---');

// Check loadError alert banner exists
const hasLoadErrorBanner = content.includes('loadError &&') &&
  content.includes('వార్తల సమర్పణల లోడింగ్ విఫలమైంది: {loadError}');
assert(hasLoadErrorBanner, 'Submissions section renders inline bilingual alert banner for loadError without swallowing error');

// Check retry button exists with accessible label
const hasRetryBtn = content.includes('onClick={loadLiveSubmissions}') &&
  content.includes('మళ్ళీ ప్రయత్నించండి (Retry)');
assert(hasRetryBtn, 'Retry button invokes loadLiveSubmissions and includes bilingual label "మళ్ళీ ప్రయత్నించండి (Retry)"');

const hasRetryAria = content.includes('aria-label="వార్తల సమర్పణలను మళ్ళీ లోడ్ చేయండి (Retry loading submissions)"');
assert(hasRetryAria, 'Retry button has accessible name');

console.log('\n========================================================');
console.log(`SCORE: ${passed}/${total} checks passed.`);
console.log('========================================================');

if (passed !== total) {
  process.exit(1);
}

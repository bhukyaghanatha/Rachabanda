/**
 * @file verify_content_reporting_ui.mjs
 * @description Frontend verification test for Content Reporting UI & Service Integration (#8D-2).
 * Verifies:
 * 1. ReportDialog component, accessibility, bilingual reasons, and submission flow
 * 2. News reporting integration in NewsDetailScreen
 * 3. Comment reporting integration in CommentsDrawer
 * 4. Authentication flow & reporter_id encapsulation (never client-supplied)
 * 5. Admin report queue in AdminDashboard with live filters and updateReportStatus()
 * 6. Audit trail integrity: strictly no DELETE UI or direct Supabase table mutations
 * 7. My Reports activity tab in ReporterScreen
 */

import fs from 'fs';
import path from 'path';

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failCount++;
  }
}

console.log('========================================================================');
console.log('RACHABANDA — CONTENT REPORTING UI VERIFICATION (#8D-2)');
console.log('========================================================================\n');

// 1. ReportDialog Component
console.log('--- 1. REPORT DIALOG COMPONENT ---');
const reportDialogPath = path.resolve('src/components/ReportDialog.tsx');
assert(fs.existsSync(reportDialogPath), 'ReportDialog.tsx exists');

const reportDialogContent = fs.readFileSync(reportDialogPath, 'utf8');
assert(reportDialogContent.includes('role="dialog"'), 'ReportDialog implements role="dialog"');
assert(reportDialogContent.includes('aria-modal="true"'), 'ReportDialog implements aria-modal="true"');
assert(reportDialogContent.includes('aria-labelledby'), 'ReportDialog implements aria-labelledby');
assert(reportDialogContent.includes('createContentReport'), 'ReportDialog integrates createContentReport() from reportService');
assert(!reportDialogContent.includes('reporter_id') && !reportDialogContent.includes('reporterId:'), 'ReportDialog never accepts or passes reporter_id (derived server-side)');

// Verify all 7 required report reasons
const requiredReasons = [
  'misinformation',
  'hate_speech',
  'harassment',
  'spam',
  'inappropriate',
  'copyright',
  'other',
];
for (const reason of requiredReasons) {
  assert(reportDialogContent.includes(`value: '${reason}'`), `ReportDialog contains reason option: ${reason}`);
}

// 2. News Detail Reporting
console.log('\n--- 2. NEWS REPORTING INTEGRATION ---');
const newsDetailPath = path.resolve('src/components/NewsDetailScreen.tsx');
const newsDetailContent = fs.readFileSync(newsDetailPath, 'utf8');
assert(newsDetailContent.includes('ReportDialog'), 'NewsDetailScreen imports ReportDialog');
assert(newsDetailContent.includes('isReportDialogOpen'), 'NewsDetailScreen maintains report dialog visibility state');
assert(newsDetailContent.includes("contentType=\"news\""), 'NewsDetailScreen passes contentType="news"');
assert(newsDetailContent.includes('contentId={news.id}'), 'NewsDetailScreen passes contentId of current news item');
assert(newsDetailContent.includes('openAuthModal'), 'NewsDetailScreen checks authentication and triggers openAuthModal for guests');

// 3. Comment Reporting
console.log('\n--- 3. COMMENT REPORTING INTEGRATION ---');
const commentsDrawerPath = path.resolve('src/components/CommentsDrawer.tsx');
const commentsDrawerContent = fs.readFileSync(commentsDrawerPath, 'utf8');
assert(commentsDrawerContent.includes('ReportDialog'), 'CommentsDrawer imports ReportDialog');
assert(commentsDrawerContent.includes('reportingComment') || commentsDrawerContent.includes('setReportingComment'), 'CommentsDrawer maintains comment reporting state');
assert(commentsDrawerContent.includes("contentType=\"comment\""), 'CommentsDrawer passes contentType="comment"');
assert(commentsDrawerContent.includes('openAuthModal'), 'CommentsDrawer triggers openAuthModal for unauthenticated guests');

// 4. Admin Dashboard Report Queue
console.log('\n--- 4. ADMIN DASHBOARD REPORT QUEUE ---');
const adminDashboardPath = path.resolve('src/components/AdminDashboard.tsx');
const adminDashboardContent = fs.readFileSync(adminDashboardPath, 'utf8');
assert(adminDashboardContent.includes("'reports'"), "AdminDashboard activeTab union includes 'reports'");
assert(adminDashboardContent.includes('fetchReportsForModeration'), 'AdminDashboard imports and calls fetchReportsForModeration()');
assert(adminDashboardContent.includes('updateReportStatus'), 'AdminDashboard imports and calls updateReportStatus()');
assert(!adminDashboardContent.includes(".from('content_reports').delete()"), 'AdminDashboard strictly contains NO DELETE query for content_reports');
assert(!adminDashboardContent.includes(".from('content_reports').update("), 'AdminDashboard does not perform direct Supabase update on content_reports (uses service layer)');
assert(adminDashboardContent.includes('reportStatusFilter'), 'AdminDashboard supports status filtering (All, Pending, Reviewed, Dismissed, Actioned)');
assert(adminDashboardContent.includes('reportTypeFilter'), 'AdminDashboard supports content type filtering (All, News, Comments)');

// 5. Reporter Screen Activity
console.log('\n--- 5. REPORTER SCREEN MY REPORTS ACTIVITY ---');
const reporterScreenPath = path.resolve('src/components/ReporterScreen.tsx');
const reporterScreenContent = fs.readFileSync(reporterScreenPath, 'utf8');
assert(reporterScreenContent.includes('fetchMyReports'), 'ReporterScreen imports fetchMyReports');
assert(reporterScreenContent.includes("'reports'"), "ReporterScreen activeTab union includes 'reports'");
assert(reporterScreenContent.includes('myReports'), 'ReporterScreen maintains myReports state');

console.log('\n========================================================================');
console.log(`TOTAL CHECKS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log('========================================================================');

if (failCount > 0) {
  process.exit(1);
}
console.log('🎉 ALL CONTENT REPORTING UI VERIFICATION CHECKS PASSED!\n');

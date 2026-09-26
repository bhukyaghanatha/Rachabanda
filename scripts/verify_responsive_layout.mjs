import fs from 'fs';
import path from 'path';

const projectRoot = 'c:/Users/DELL/Desktop/Rachabanda_app';

function checkFile(relPath) {
  return fs.readFileSync(path.join(projectRoot, relPath), 'utf-8');
}

console.log('================================================================');
console.log('  PHASE 10 — P1 FIX #3: RESPONSIVE LAYOUT VERIFICATION');
console.log('================================================================\n');

let passed = 0;
let total = 10;

// 1. App.tsx: Removal of artificial phone frame & black void
console.log('--- 1. App.tsx: Phone frame and black void removed ---');
const appContent = checkFile('src/App.tsx');
const hasDeviceFramedState = /isDeviceFramed/.test(appContent);
const hasPhoneNotch = /9:41/.test(appContent);
const hasMaxW440 = /max-w-\[440px\]/.test(appContent);
const hasResponsiveCanvas = /bg-\[#F8F9FA\]/.test(appContent);

console.log(`  - isDeviceFramed state removed: ${!hasDeviceFramedState}`);
console.log(`  - Faux phone notch bar removed: ${!hasPhoneNotch}`);
console.log(`  - Fixed max-w-[440px] shell removed: ${!hasMaxW440}`);
console.log(`  - Clean full-bleed responsive canvas present: ${hasResponsiveCanvas}`);

if (!hasDeviceFramedState && !hasPhoneNotch && !hasMaxW440 && hasResponsiveCanvas) {
  console.log('  ✓ Desktop phone frame & black void successfully removed');
  passed++;
} else {
  console.log('  ❌ App.tsx audit failed');
}

// 2. App.tsx: Max-width 7xl container with responsive horizontal padding
console.log('\n--- 2. App.tsx: max-w-7xl responsive container ---');
const hasMaxW7xl = /max-w-7xl\s+mx-auto/.test(appContent);
console.log(`  - max-w-7xl mx-auto container present: ${hasMaxW7xl}`);
if (hasMaxW7xl) {
  console.log('  ✓ App shell uses modern max-w-7xl responsive container');
  passed++;
} else {
  console.log('  ❌ max-w-7xl container missing');
}

// 3. Header.tsx: Desktop navigation shortcuts added
console.log('\n--- 3. Header.tsx: Desktop navigation shortcuts ---');
const headerContent = checkFile('src/components/Header.tsx');
const hasSubmitBtn = /header-submit-news-btn/.test(headerContent);
const hasSavedBtn = /header-saved-btn/.test(headerContent);
const hasHiddenMd = /hidden\s+md:flex/.test(headerContent);

console.log(`  - Desktop Submit News button present: ${hasSubmitBtn}`);
console.log(`  - Desktop Saved Articles button present: ${hasSavedBtn}`);
console.log(`  - Responsive hidden md:flex toggle used: ${hasHiddenMd}`);

if (hasSubmitBtn && hasSavedBtn && hasHiddenMd) {
  console.log('  ✓ Desktop navigation shortcuts properly wired');
  passed++;
} else {
  console.log('  ❌ Header desktop shortcuts missing');
}

// 4. BottomNav.tsx: Mobile-only conditional display
console.log('\n--- 4. BottomNav.tsx: Hidden on desktop (md:hidden) ---');
const bottomNavContent = checkFile('src/components/BottomNav.tsx');
const hasMdHidden = /md:hidden/.test(bottomNavContent);
console.log(`  - md:hidden present on BottomNav: ${hasMdHidden}`);
if (hasMdHidden) {
  console.log('  ✓ Bottom navigation bar is properly mobile-only and does not clutter desktop');
  passed++;
} else {
  console.log('  ❌ BottomNav md:hidden missing');
}

// 5. HomeScreen.tsx: Responsive multi-column news card grid
console.log('\n--- 5. HomeScreen.tsx: Responsive multi-column news grid ---');
const homeContent = checkFile('src/components/HomeScreen.tsx');
const hasNewsGrid = /grid-cols-1\s+md:grid-cols-2\s+lg:grid-cols-3/.test(homeContent);
const hasColSpanFull = /col-span-full/.test(homeContent);

console.log(`  - News card grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3): ${hasNewsGrid}`);
console.log(`  - Full-width col-span-full for status/auth cards: ${hasColSpanFull}`);

if (hasNewsGrid && hasColSpanFull) {
  console.log('  ✓ HomeScreen news cards naturally expand into 2-3 columns on desktop');
  passed++;
} else {
  console.log('  ❌ HomeScreen responsive grid missing');
}

// 6. CategoryGrid.tsx: Responsive columns
console.log('\n--- 6. CategoryGrid.tsx: Responsive columns ---');
const catGridContent = checkFile('src/components/CategoryGrid.tsx');
const hasCatCols = /grid-cols-5\s+md:grid-cols-10/.test(catGridContent);
console.log(`  - Category grid (grid-cols-5 md:grid-cols-10): ${hasCatCols}`);
if (hasCatCols) {
  console.log('  ✓ CategoryGrid displays in a clean single row of 10 on tablet/desktop');
  passed++;
} else {
  console.log('  ❌ CategoryGrid responsive columns missing');
}

// 7. NewsDetailScreen.tsx: Responsive reading container & related news grid
console.log('\n--- 7. NewsDetailScreen.tsx: Responsive article layout ---');
const detailContent = checkFile('src/components/NewsDetailScreen.tsx');
const hasArticleMaxW = /max-w-3xl\s+mx-auto/.test(detailContent);
const hasRelatedGrid = /sm:grid\s+sm:grid-cols-3/.test(detailContent);

console.log(`  - Article container max-w-3xl mx-auto: ${hasArticleMaxW}`);
console.log(`  - Related news sm:grid sm:grid-cols-3: ${hasRelatedGrid}`);

if (hasArticleMaxW && hasRelatedGrid) {
  console.log('  ✓ Article detail page gives comfortable desktop typography & reading width');
  passed++;
} else {
  console.log('  ❌ NewsDetailScreen layout audit failed');
}

// 8. SavedScreen.tsx: Responsive multi-column grid
console.log('\n--- 8. SavedScreen.tsx: Responsive grid ---');
const savedContent = checkFile('src/components/SavedScreen.tsx');
const hasSavedGrid = /grid-cols-1\s+md:grid-cols-2\s+lg:grid-cols-3/.test(savedContent);
console.log(`  - Saved articles grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3): ${hasSavedGrid}`);
if (hasSavedGrid) {
  console.log('  ✓ SavedScreen articles layout responsive on desktop');
  passed++;
} else {
  console.log('  ❌ SavedScreen responsive grid missing');
}

// 9. VideoScreen.tsx: Responsive video grid
console.log('\n--- 9. VideoScreen.tsx: Responsive grid ---');
const videoContent = checkFile('src/components/VideoScreen.tsx');
const hasVideoGrid = /grid-cols-1\s+sm:grid-cols-2\s+lg:grid-cols-3/.test(videoContent);
console.log(`  - Video cards grid (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3): ${hasVideoGrid}`);
if (hasVideoGrid) {
  console.log('  ✓ VideoScreen cards layout responsive on desktop');
  passed++;
} else {
  console.log('  ❌ VideoScreen responsive grid missing');
}

// 10. ReporterScreen.tsx & SubmitNewsScreen.tsx: Responsive container widths
console.log('\n--- 10. ReporterScreen & SubmitNewsScreen container widths ---');
const reporterContent = checkFile('src/components/ReporterScreen.tsx');
const submitContent = checkFile('src/components/SubmitNewsScreen.tsx');
const hasReporterMaxW = /max-w-3xl\s+mx-auto/.test(reporterContent);
const hasSubmitMaxW = /max-w-2xl\s+mx-auto/.test(submitContent);

console.log(`  - ReporterScreen max-w-3xl mx-auto: ${hasReporterMaxW}`);
console.log(`  - SubmitNewsScreen max-w-2xl mx-auto: ${hasSubmitMaxW}`);

if (hasReporterMaxW && hasSubmitMaxW) {
  console.log('  ✓ Reporter profile and submission forms gracefully sized on desktop');
  passed++;
} else {
  console.log('  ❌ Form/profile container audit failed');
}

console.log('\n================================================================');
console.log(`  RESPONSIVE AUDIT RESULT: ${passed}/${total} CHECKS PASSED`);
console.log('================================================================\n');

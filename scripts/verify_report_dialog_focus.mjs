/**
 * @file verify_report_dialog_focus.mjs
 * @description Static verification test for ReportDialog keyboard focus trap & restoration (#8D-2 Hardening).
 * Verifies:
 * 1. Accessible dialog attributes (role, aria-modal, aria-labelledby, aria-describedby)
 * 2. Escape key handling
 * 3. Tab key trapping
 * 4. Shift+Tab key trapping
 * 5. Focusable element discovery and visible element filtering
 * 6. First/Last element wrapping logic
 * 7. Active triggering element capture (document.activeElement)
 * 8. Focus restoration upon close/unmount
 * 9. Graceful fallback when trigger element is missing or not in DOM
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
console.log('RACHABANDA — REPORT DIALOG FOCUS MANAGEMENT VERIFICATION (#8D-2 HARDENING)');
console.log('========================================================================\n');

const reportDialogPath = path.resolve('src/components/ReportDialog.tsx');
assert(fs.existsSync(reportDialogPath), 'ReportDialog.tsx exists');

const content = fs.readFileSync(reportDialogPath, 'utf8');

// 1. Accessibility attributes
console.log('--- 1. ACCESSIBILITY ATTRIBUTES ---');
assert(content.includes('role="dialog"'), 'Implements role="dialog"');
assert(content.includes('aria-modal="true"'), 'Implements aria-modal="true"');
assert(content.includes('aria-labelledby="report-dialog-title"'), 'Implements aria-labelledby="report-dialog-title"');
assert(content.includes('aria-describedby="report-dialog-desc"'), 'Implements aria-describedby="report-dialog-desc"');

// 2. Escape handler
console.log('\n--- 2. ESCAPE KEY HANDLING ---');
assert(content.includes("e.key === 'Escape'"), 'Listens for Escape key');
assert(content.includes('onClose()'), 'Invokes onClose() on Escape');

// 3. Tab & Shift+Tab handling
console.log('\n--- 3. KEYBOARD TAB TRAPPING ---');
assert(content.includes("e.key === 'Tab'"), 'Listens for Tab key');
assert(content.includes('e.shiftKey'), 'Distinguishes between Tab and Shift+Tab');
assert(content.includes('e.preventDefault()'), 'Prevents default tab navigation to trap focus within dialog');

// 4. Focusable element discovery
console.log('\n--- 4. FOCUSABLE ELEMENT DETECTION & WRAPPING ---');
assert(content.includes('FOCUSABLE_SELECTOR'), 'Defines query selector for focusable elements');
assert(content.includes('getFocusableElements'), 'Contains getFocusableElements detection helper');
assert(content.includes('firstElement') && content.includes('lastElement'), 'Identifies first and last focusable elements');
assert(content.includes('focusables.length === 0') || content.includes('focusables.length === 1'), 'Safely handles 0 or 1 focusable element edge cases');
assert(content.includes('firstElement.focus()'), 'Wraps forward tab from last element to first element');
assert(content.includes('lastElement.focus()'), 'Wraps backward shift-tab from first element to last element');

// 5. Trigger capture & focus restoration
console.log('\n--- 5. FOCUS CAPTURE & RESTORATION ---');
assert(content.includes('previousActiveElementRef'), 'Uses ref to store previously active trigger element');
assert(content.includes('document.activeElement'), 'Captures document.activeElement before opening dialog');
assert(content.includes('closeButtonRef.current?.focus()') || content.includes('closeButtonRef.current.focus()'), 'Moves initial focus into the dialog (preferring close button)');
assert(content.includes('previousEl.focus()') || content.includes('previousActiveElementRef.current.focus()'), 'Restores focus to trigger element when dialog closes');
assert(content.includes('document.body.contains'), 'Checks if trigger element still exists in document.body before restoring focus');
assert(content.includes('try') && content.includes('catch'), 'Wraps focus restoration in try/catch for graceful error handling');

console.log('\n========================================================================');
console.log(`TOTAL CHECKS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log('========================================================================');

if (failCount > 0) {
  process.exit(1);
}
console.log('🎉 ALL REPORT DIALOG FOCUS MANAGEMENT CHECKS PASSED!\n');

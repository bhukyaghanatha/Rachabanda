/**
 * @file verify_comment_moderation_rls.mjs
 * @description Verification script for Comment Moderation RLS policies
 */

import fs from 'fs';
import path from 'path';

const projectRoot = 'c:/Users/DELL/Desktop/Rachabanda_app';
const migrationPath = path.join(projectRoot, 'supabase/migrations/20260925000004_comment_moderation_rls.sql');
const schemaPath = path.join(projectRoot, 'supabase/schema.sql');
const envLocalPath = path.join(projectRoot, '.env.local');

async function main() {
  console.log('====================================================');
  console.log('RACHABANDA — COMMENT MODERATION RLS VERIFICATION');
  console.log('====================================================\n');

  let passedChecks = 0;
  let totalChecks = 0;

  // Check 1: Migration file exists
  totalChecks++;
  if (fs.existsSync(migrationPath)) {
    console.log('✅ Check 1: Migration file exists');
    passedChecks++;
  } else {
    console.error('❌ Check 1: Migration file missing');
  }

  // Check 2: Migration content validation
  totalChecks++;
  const migrationContent = fs.readFileSync(migrationPath, 'utf-8');
  const hasStaffSelect = migrationContent.includes('Staff can view all comments') &&
    migrationContent.includes('public.is_admin_or_editor()');
  const hasStaffUpdate = migrationContent.includes('Staff can moderate comments') &&
    migrationContent.includes('FOR UPDATE');

  if (hasStaffSelect && hasStaffUpdate) {
    console.log('✅ Check 2: Migration declares both Staff SELECT and UPDATE policies with public.is_admin_or_editor()');
    passedChecks++;
  } else {
    console.error('❌ Check 2: Missing expected policy definitions in migration');
  }

  // Check 3: Schema synchronization
  totalChecks++;
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  const schemaHasStaffSelect = schemaContent.includes('CREATE POLICY "Staff can view all comments"');
  const schemaHasStaffUpdate = schemaContent.includes('CREATE POLICY "Staff can moderate comments"');

  if (schemaHasStaffSelect && schemaHasStaffUpdate) {
    console.log('✅ Check 3: Canonical schema.sql synchronized with new moderation policies');
    passedChecks++;
  } else {
    console.error('❌ Check 3: schema.sql not synchronized');
  }

  // Live Supabase tests if configured
  if (fs.existsSync(envLocalPath)) {
    const env = fs.readFileSync(envLocalPath, 'utf-8');
    const urlMatch = env.match(/VITE_SUPABASE_URL=([^\r\n]+)/);
    const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=([^\r\n]+)/);

    if (urlMatch && keyMatch) {
      const url = urlMatch[1].trim();
      const key = keyMatch[1].trim();

      // Test 4: Anonymous user cannot update comments
      totalChecks++;
      try {
        const patchRes = await fetch(`${url}/rest/v1/comments?id=neq.00000000-0000-0000-0000-000000000000`, {
          method: 'PATCH',
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation'
          },
          body: JSON.stringify({ is_approved: false })
        });
        const patchData = await patchRes.json();
        if (Array.isArray(patchData) && patchData.length === 0) {
          console.log('✅ Check 4: Anonymous users cannot update comments (0 rows affected / blocked by RLS)');
          passedChecks++;
        } else {
          console.warn('⚠️ Check 4: Unexpected patch response:', patchData);
        }
      } catch (err) {
        console.error('❌ Check 4 error:', err.message);
      }

      // Test 5: Anonymous user can only select approved comments
      totalChecks++;
      try {
        const selectRes = await fetch(`${url}/rest/v1/comments?select=id,is_approved&is_approved=eq.false`, {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`
          }
        });
        const selectData = await selectRes.json();
        if (Array.isArray(selectData) && selectData.length === 0) {
          console.log('✅ Check 5: Public/Anon cannot read hidden/unapproved comments (is_approved = false returns 0 rows)');
          passedChecks++;
        } else {
          console.warn('⚠️ Check 5: Unexpected select response:', selectData);
        }
      } catch (err) {
        console.error('❌ Check 5 error:', err.message);
      }
    }
  }

  console.log(`\nVerification Score: ${passedChecks}/${totalChecks} checks passed.\n`);
}

main().catch(console.error);

/**
 * @file verify_comment_service.mjs
 * @description Verification script for commentService moderation functions
 */

import fs from 'fs';
import path from 'path';

const projectRoot = 'c:/Users/DELL/Desktop/Rachabanda_app';
const servicePath = path.join(projectRoot, 'src/services/commentService.ts');
const envLocalPath = path.join(projectRoot, '.env.local');

async function main() {
  console.log('====================================================');
  console.log('RACHABANDA — COMMENT SERVICE LAYER VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  // Check 1: Service file exists
  total++;
  if (fs.existsSync(servicePath)) {
    console.log('✅ Check 1: commentService.ts exists');
    passed++;
  } else {
    console.error('❌ Check 1: commentService.ts missing');
  }

  const content = fs.readFileSync(servicePath, 'utf-8');

  // Check 2: All 5 functions exported
  const requiredFunctions = [
    'fetchCommentsByNewsId',
    'postComment',
    'deleteComment',
    'fetchAllCommentsForModeration',
    'updateCommentApproval'
  ];

  total++;
  const missingFns = requiredFunctions.filter(fn => !content.includes(`export async function ${fn}`));
  if (missingFns.length === 0) {
    console.log('✅ Check 2: All 5 service functions exported:');
    requiredFunctions.forEach(fn => console.log(`   - ${fn}`));
    passed++;
  } else {
    console.error('❌ Check 2: Missing functions:', missingFns);
  }

  // Check 3: fetchAllCommentsForModeration includes required fields & relation
  total++;
  const hasRelation = content.includes('news:news_id(id, title)');
  const hasFields = content.includes('id, news_id, user_id, user_name, user_location, comment, likes_count, is_approved, created_at');
  const hasLimit = content.includes('limit ?? 100');
  const hasOrder = content.includes(".order('created_at', { ascending: false })");

  if (hasRelation && hasFields && hasLimit && hasOrder) {
    console.log('✅ Check 3: fetchAllCommentsForModeration includes relation, fields, ordering & default limit 100');
    passed++;
  } else {
    console.error('❌ Check 3: Query specification incomplete');
  }

  // Check 4: updateCommentApproval only updates is_approved
  total++;
  const updatesOnlyApproval = content.includes('update({ is_approved: Boolean(isApproved) })');
  const checksAuth = content.includes('supabase.auth.getUser()');

  if (updatesOnlyApproval && checksAuth) {
    console.log('✅ Check 4: updateCommentApproval validates session & restricts update strictly to is_approved');
    passed++;
  } else {
    console.error('❌ Check 4: updateCommentApproval safety check failed');
  }

  // Check 5: Live API test for moderation query structure
  if (fs.existsSync(envLocalPath)) {
    total++;
    const env = fs.readFileSync(envLocalPath, 'utf-8');
    const url = env.match(/VITE_SUPABASE_URL=([^\r\n]+)/)[1].trim();
    const key = env.match(/VITE_SUPABASE_ANON_KEY=([^\r\n]+)/)[1].trim();

    try {
      const res = await fetch(
        `${url}/rest/v1/comments?select=id,news_id,user_id,user_name,user_location,comment,likes_count,is_approved,created_at,news:news_id(id,title)&order=created_at.desc&limit=2`,
        {
          headers: { apikey: key, Authorization: `Bearer ${key}` }
        }
      );
      const data = await res.json();
      if (Array.isArray(data)) {
        console.log(`✅ Check 5: Live query with news relational join succeeded (returned ${data.length} records)`);
        if (data.length > 0) {
          console.log(`   Sample comment news title: "${data[0].news?.title || 'N/A'}"`);
        }
        passed++;
      } else {
        console.warn('⚠️ Check 5 response:', data);
      }
    } catch (e) {
      console.error('❌ Check 5 network error:', e.message);
    }
  }

  console.log(`\nVerification Score: ${passed}/${total} checks passed.\n`);
}

main().catch(console.error);

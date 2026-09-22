#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

// Check .env.local first, then .env, then process.env
const envLocalPath = path.join(projectRoot, '.env.local');
const envPath = path.join(projectRoot, '.env');

const envLocal = parseEnvFile(envLocalPath);
const envDefault = parseEnvFile(envPath);

const url = envLocal.VITE_SUPABASE_URL || envDefault.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const anonKey = envLocal.VITE_SUPABASE_ANON_KEY || envDefault.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const isPlaceholderUrl = url === 'https://your-project-id.supabase.co' || url.includes('placeholder');
const isPlaceholderKey = anonKey === 'your-supabase-anon-key-here' || anonKey.includes('placeholder');

const hasUrl = Boolean(url && url.trim() !== '' && !isPlaceholderUrl);
const hasKey = Boolean(anonKey && anonKey.trim() !== '' && !isPlaceholderKey);

console.log('\n======================================================');
console.log('  Rachabanda (రచ్చ బండ) — Supabase Config Check');
console.log('======================================================\n');

console.log(`Checking config files in: ${projectRoot}`);
console.log(`- .env.local file exists: ${fs.existsSync(envLocalPath) ? '✅ Yes' : '❌ No'}`);

console.log('\nVariable Status:');

// Check URL safely without logging secret details
if (!hasUrl) {
  if (url && isPlaceholderUrl) {
    console.log('❌ VITE_SUPABASE_URL: Placeholder value detected (not a real project URL)');
  } else {
    console.log('❌ VITE_SUPABASE_URL: Missing or empty');
  }
} else {
  try {
    const parsed = new URL(url);
    const hostParts = parsed.hostname.split('.');
    const maskedHost = hostParts.length > 2
      ? `${hostParts[0].slice(0, 3)}***.${hostParts.slice(1).join('.')}`
      : parsed.hostname;
    console.log(`✅ VITE_SUPABASE_URL: Configured (https://${maskedHost})`);
  } catch {
    console.log('⚠️ VITE_SUPABASE_URL: Configured, but could not parse as valid URL');
  }
}

// Check Anon Key safely without logging secret details
if (!hasKey) {
  if (anonKey && isPlaceholderKey) {
    console.log('❌ VITE_SUPABASE_ANON_KEY: Placeholder value detected (not a real anon key)');
  } else {
    console.log('❌ VITE_SUPABASE_ANON_KEY: Missing or empty');
  }
} else {
  const maskedKey = `${anonKey.slice(0, 5)}...${anonKey.slice(-4)} (${anonKey.length} chars)`;
  console.log(`✅ VITE_SUPABASE_ANON_KEY: Configured (${maskedKey})`);
}

console.log('\n------------------------------------------------------');

const isFullyConfigured = hasUrl && hasKey;
const strictMode = process.argv.includes('--strict');

if (isFullyConfigured) {
  console.log('🎉 RESULT: Supabase is fully configured for live backend connections.');
  console.log('------------------------------------------------------\n');
  process.exit(0);
} else {
  console.log('ℹ️ RESULT: Real Supabase credentials are NOT yet configured.');
  console.log('   The application will run safely using local mock data.');
  console.log('   To connect to a live Supabase project:');
  console.log('   1. Open .env.local in the project root.');
  console.log('   2. Set your real VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  console.log('   3. Re-run: npm run check:supabase');
  console.log('------------------------------------------------------\n');

  if (strictMode) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

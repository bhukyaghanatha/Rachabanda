import fs from 'fs';
import path from 'path';

const projectRoot = 'c:/Users/DELL/Desktop/Rachabanda_app';
const envLocal = fs.readFileSync(path.join(projectRoot, '.env.local'), 'utf-8');
const urlMatch = envLocal.match(/VITE_SUPABASE_URL=([^\r\n]+)/);
const keyMatch = envLocal.match(/VITE_SUPABASE_ANON_KEY=([^\r\n]+)/);

const supabaseUrl = urlMatch[1].trim();
const anonKey = keyMatch[1].trim();

// Sample valid blobs for allowed MIME types
const jpegBlob = new Blob([new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46])], { type: 'image/jpeg' });
const mp3Blob = new Blob([new Uint8Array([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])], { type: 'audio/mpeg' });
const mp4Blob = new Blob([new Uint8Array([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D])], { type: 'video/mp4' });

async function uploadObject(bucket, objectPath, blob, token = null) {
  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${token || anonKey}`,
    'x-upsert': 'true',
    'Content-Type': blob.type
  };
  const res = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${objectPath}`, {
    method: 'POST',
    headers,
    body: blob
  });
  let json = null;
  try {
    json = await res.json();
  } catch (e) {
    json = { status: res.statusText };
  }
  return { status: res.status, ok: res.ok, json };
}

async function updateObject(bucket, objectPath, blob, token = null) {
  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${token || anonKey}`,
    'Content-Type': blob.type
  };
  const res = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${objectPath}`, {
    method: 'PUT',
    headers,
    body: blob
  });
  let json = null;
  try {
    json = await res.json();
  } catch (e) {
    json = { status: res.statusText };
  }
  return { status: res.status, ok: res.ok, json };
}

async function deleteObject(bucket, objectPath, token = null) {
  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${token || anonKey}`,
    'Content-Type': 'application/json'
  };
  const res = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ prefixes: [objectPath] })
  });
  let json = null;
  try {
    json = await res.json();
  } catch (e) {
    json = { status: res.statusText };
  }
  return { status: res.status, ok: res.ok, json };
}

async function readObject(bucket, objectPath) {
  const res = await fetch(`${supabaseUrl}/storage/v1/object/public/${bucket}/${objectPath}`);
  return { status: res.status, ok: res.ok };
}

async function signUp(email, password, fullName) {
  const res = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, data: { full_name: fullName } })
  });
  const json = await res.json();
  return {
    id: json.user?.id || json.id,
    token: json.access_token || json.session?.access_token,
    email
  };
}

async function runStorageVerification() {
  console.log('================================================================');
  console.log('  PHASE 10 — P0 FIX 3: STORAGE AUTHORIZATION VERIFICATION');
  console.log('================================================================\n');

  const ts = Date.now();
  const createdTestPaths = [];

  // -------------------------------------------------------------
  // 1. PROVISION TEST ACTORS
  // -------------------------------------------------------------
  console.log('--- 1. PROVISIONING ACTORS ---');
  const userA = await signUp(`storage_user_a_${ts}@example.com`, `SecretPass!#${ts}`, 'User A');
  const userB = await signUp(`storage_user_b_${ts}@example.com`, `SecretPass!#${ts}`, 'User B');
  console.log(`✓ User A created: ${userA.id}`);
  console.log(`✓ User B created: ${userB.id}`);

  // -------------------------------------------------------------
  // 2. ANONYMOUS UPLOADS
  // -------------------------------------------------------------
  console.log('\n--- 2. ANONYMOUS UPLOAD TESTS (submissions-media) ---');

  // A. Anonymous upload to images/
  const anonImgPath = `images/test-anon-${ts}.jpg`;
  const resAnonImg = await uploadObject('submissions-media', anonImgPath, jpegBlob);
  console.log(`  - Anonymous -> images/: Status ${resAnonImg.status} (${resAnonImg.ok ? 'ALLOWED' : 'BLOCKED'})`);
  if (resAnonImg.ok) createdTestPaths.push({ bucket: 'submissions-media', path: anonImgPath, token: null });

  // B. Anonymous upload to audio/
  const anonAudioPath = `audio/test-anon-${ts}.mp3`;
  const resAnonAudio = await uploadObject('submissions-media', anonAudioPath, mp3Blob);
  console.log(`  - Anonymous -> audio/: Status ${resAnonAudio.status} (${resAnonAudio.ok ? 'ALLOWED' : 'BLOCKED'})`);
  if (resAnonAudio.ok) createdTestPaths.push({ bucket: 'submissions-media', path: anonAudioPath, token: null });

  // C. Anonymous upload to videos/
  const anonVideoPath = `videos/test-anon-${ts}.mp4`;
  const resAnonVideo = await uploadObject('submissions-media', anonVideoPath, mp4Blob);
  console.log(`  - Anonymous -> videos/: Status ${resAnonVideo.status} (${resAnonVideo.ok ? 'ALLOWED' : 'BLOCKED'})`);
  if (resAnonVideo.ok) createdTestPaths.push({ bucket: 'submissions-media', path: anonVideoPath, token: null });

  // D. Anonymous upload to avatars/<userA.id>/
  const anonAvatarPath = `avatars/${userA.id}/test-anon-${ts}.jpg`;
  const resAnonAvatar = await uploadObject('submissions-media', anonAvatarPath, jpegBlob);
  console.log(`  - Anonymous -> avatars/${userA.id}/: Status ${resAnonAvatar.status} (${resAnonAvatar.ok ? 'ALLOWED (VULNERABILITY)' : 'BLOCKED (SECURE)'})`);
  if (resAnonAvatar.ok) createdTestPaths.push({ bucket: 'submissions-media', path: anonAvatarPath, token: null });

  // E. Anonymous upload to arbitrary folder
  const anonArbitraryPath = `arbitrary-folder/test-anon-${ts}.jpg`;
  const resAnonArbitrary = await uploadObject('submissions-media', anonArbitraryPath, jpegBlob);
  console.log(`  - Anonymous -> arbitrary-folder/: Status ${resAnonArbitrary.status} (${resAnonArbitrary.ok ? 'ALLOWED (VULNERABILITY)' : 'BLOCKED (SECURE)'})`);
  if (resAnonArbitrary.ok) createdTestPaths.push({ bucket: 'submissions-media', path: anonArbitraryPath, token: null });

  // -------------------------------------------------------------
  // 3. AUTHENTICATED USER A & B TESTS (avatars)
  // -------------------------------------------------------------
  console.log('\n--- 3. AUTHENTICATED AVATAR UPLOAD & PERMISSION TESTS ---');

  // A. User A uploads own avatar
  const userAAvatarPath = `avatars/${userA.id}/avatar-${ts}.jpg`;
  const resUserAOwn = await uploadObject('submissions-media', userAAvatarPath, jpegBlob, userA.token);
  console.log(`  - User A -> own avatar (${userAAvatarPath}): Status ${resUserAOwn.status} (${resUserAOwn.ok ? 'ALLOWED' : 'BLOCKED'})`);
  if (resUserAOwn.ok) createdTestPaths.push({ bucket: 'submissions-media', path: userAAvatarPath, token: userA.token });

  // B. User A attempts to upload into User B's avatar folder
  const userBCrossPath = `avatars/${userB.id}/cross-user-${ts}.jpg`;
  const resCrossUpload = await uploadObject('submissions-media', userBCrossPath, jpegBlob, userA.token);
  console.log(`  - User A -> User B avatar (${userBCrossPath}): Status ${resCrossUpload.status} (${resCrossUpload.ok ? 'ALLOWED (VULNERABILITY)' : 'BLOCKED (SECURE)'})`);
  if (resCrossUpload.ok) createdTestPaths.push({ bucket: 'submissions-media', path: userBCrossPath, token: userA.token });

  // C. User A updates own avatar
  if (resUserAOwn.ok) {
    const resUpdateOwn = await updateObject('submissions-media', userAAvatarPath, jpegBlob, userA.token);
    console.log(`  - User A -> update own avatar: Status ${resUpdateOwn.status} (${resUpdateOwn.ok ? 'ALLOWED' : 'BLOCKED'})`);
  }

  // D. User B attempts to update User A's avatar
  if (resUserAOwn.ok) {
    const resCrossUpdate = await updateObject('submissions-media', userAAvatarPath, jpegBlob, userB.token);
    console.log(`  - User B -> update User A avatar: Status ${resCrossUpdate.status} (${resCrossUpdate.ok ? 'ALLOWED (VULNERABILITY)' : 'BLOCKED (SECURE)'})`);
  }

  // E. User B attempts to delete User A's avatar
  if (resUserAOwn.ok) {
    const resCrossDelete = await deleteObject('submissions-media', userAAvatarPath, userB.token);
    // Note: Supabase delete returns 200 with an empty list or error if unauthorized
    console.log(`  - User B -> delete User A avatar: Status ${resCrossDelete.status}, Response:`, resCrossDelete.json);
  }

  // F. User A deletes own avatar
  if (resUserAOwn.ok) {
    const resDeleteOwn = await deleteObject('submissions-media', userAAvatarPath, userA.token);
    console.log(`  - User A -> delete own avatar: Status ${resDeleteOwn.status}, Response:`, resDeleteOwn.json);
  }

  // -------------------------------------------------------------
  // 4. NEWS-MEDIA BUCKET PROTECTION
  // -------------------------------------------------------------
  console.log('\n--- 4. NEWS-MEDIA BUCKET SECURITY ---');
  const newsMediaPath = `images/test-news-${ts}.jpg`;
  const resAnonNewsMedia = await uploadObject('news-media', newsMediaPath, jpegBlob);
  console.log(`  - Anonymous -> news-media: Status ${resAnonNewsMedia.status} (${resAnonNewsMedia.ok ? 'ALLOWED (VULNERABILITY)' : 'BLOCKED (SECURE)'})`);
  const resUserANewsMedia = await uploadObject('news-media', newsMediaPath, jpegBlob, userA.token);
  console.log(`  - Reader User A -> news-media: Status ${resUserANewsMedia.status} (${resUserANewsMedia.ok ? 'ALLOWED (VULNERABILITY)' : 'BLOCKED (SECURE)'})`);

  // -------------------------------------------------------------
  // 5. PUBLIC READ VERIFICATION
  // -------------------------------------------------------------
  console.log('\n--- 5. PUBLIC READ VERIFICATION ---');
  if (resAnonImg.ok) {
    const readRes = await readObject('submissions-media', anonImgPath);
    console.log(`  - Public Read of submissions-media/${anonImgPath}: Status ${readRes.status} (${readRes.ok ? 'ACCESSIBLE' : 'BLOCKED'})`);
  }

  // -------------------------------------------------------------
  // 6. CLEANUP
  // -------------------------------------------------------------
  console.log('\n--- 6. CLEANUP TEMPORARY OBJECTS ---');
  for (const item of createdTestPaths) {
    try {
      await deleteObject(item.bucket, item.path, item.token);
    } catch (e) {
      // ignore
    }
  }
  console.log('✓ Cleanup completed.');

  console.log('\n================================================================');
  console.log('  VERIFICATION RUN FINISHED');
  console.log('================================================================\n');
}

runStorageVerification().catch(console.error);

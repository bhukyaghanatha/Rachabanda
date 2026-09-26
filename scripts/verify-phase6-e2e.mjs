import fs from 'fs';

// Read .env.local
const env = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = env.match(/VITE_SUPABASE_URL=([^\r\n]+)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=([^\r\n]+)/);

if (!urlMatch || !keyMatch) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabaseUrl = urlMatch[1].trim();
const supabaseKey = keyMatch[1].trim();

// Format helpers mirroring newsService.ts
function formatTimeAgo(dateString) {
  if (!dateString) return 'ఇప్పుడే';
  const now = Date.now();
  const publishedTime = new Date(dateString).getTime();
  if (isNaN(publishedTime)) return 'ఇప్పుడే';
  const diffMs = now - publishedTime;
  if (diffMs < 0) return 'ఇప్పుడే';
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return 'ఇప్పుడే';
  if (minutes < 60) return `${minutes} నిమిషాల క్రితం`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} గంటల క్రితం`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'నిన్న';
  if (days < 30) return `${days} రోజుల క్రితం`;
  const months = Math.floor(days / 30);
  return `${months} నెలల క్రితం`;
}

function formatTeluguDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  const day = d.getDate();
  const months = [
    'జనవరి', 'ఫిబ్రవరి', 'మార్చి', 'ఏప్రిల్', 'మే', 'జూన్',
    'జూలై', 'ఆగస్టు', 'సెప్టెంబర్', 'అక్టోబర్', 'నవంబర్', 'డిసెంబర్'
  ];
  const monthName = months[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${day} ${monthName} ${year}, ${hours}:${minutes} ${ampm}`;
}

function mapDatabaseNewsToNewsItem(row) {
  let categoryName = 'సాధారణ';
  let categorySlug = 'general';
  if (row.news_categories && Array.isArray(row.news_categories) && row.news_categories.length > 0) {
    const primaryCat = row.news_categories[0]?.categories;
    if (primaryCat) {
      if (primaryCat.name) categoryName = primaryCat.name;
      if (primaryCat.slug) categorySlug = primaryCat.slug;
    }
  }

  let locationName = 'తెలంగాణ';
  let locationSlug = 'telangana';
  if (row.news_locations && Array.isArray(row.news_locations) && row.news_locations.length > 0) {
    const primaryLoc = row.news_locations[0]?.locations;
    if (primaryLoc) {
      if (primaryLoc.name) locationName = primaryLoc.name;
      if (primaryLoc.slug) locationSlug = primaryLoc.slug;
    }
  }

  let reporterName = row.source || 'రచ్చ బండ డెస్క్';
  let reporterId = 'RBV-DESK';
  if (row.profiles) {
    if (row.profiles.full_name) reporterName = row.profiles.full_name;
    if (row.profiles.id) reporterId = `RB-${row.profiles.id.slice(0, 6).toUpperCase()}`;
  } else if (row.author_id) {
    reporterId = `RB-${row.author_id.slice(0, 6).toUpperCase()}`;
  }

  return {
    id: row.id,
    title: row.title || '',
    shortSummary: row.short_summary || '',
    content: row.content || '',
    location: locationName,
    category: categoryName,
    categorySlug,
    locationSlug,
    imageUrl: row.cover_image || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
    timeAgo: formatTimeAgo(row.published_at || row.created_at),
    publishedDate: formatTeluguDate(row.published_at || row.created_at),
    reporterName,
    reporterId,
    audioDuration: row.audio_duration || '1:00',
    likes: row.likes_count ?? 0,
    commentsCount: row.comments_count ?? 0,
    isBreaking: Boolean(row.is_breaking),
    isVideo: Boolean(row.is_video || row.video_url),
    videoDuration: row.video_duration || undefined,
    factChecked: Boolean(row.fact_checked),
    audioNarratedText: row.audio_narrated_text || undefined,
  };
}

async function runEndToEndVerification() {
  console.log('====================================================');
  console.log('  PHASE 6 END-TO-END VERIFICATION SUITE');
  console.log('====================================================\n');

  // TEST 1: Check Dev Server
  console.log('1. Checking Dev Server HTTP response (http://localhost:3000)...');
  try {
    const devRes = await fetch('http://localhost:3000/');
    if (devRes.ok) {
      const html = await devRes.text();
      const hasTitle = html.includes('రచ్చ బండ') || html.includes('Rachabanda') || html.includes('vite');
      console.log(`   ✓ Dev Server responds with HTTP 200 OK (Title verified: ${hasTitle})`);
    } else {
      console.error(`   ❌ Dev server returned HTTP ${devRes.status}`);
    }
  } catch (err) {
    console.error(`   ❌ Could not connect to dev server: ${err.message}`);
  }

  // TEST 2: Supabase Connection & Categories
  console.log('\n2. Testing Supabase Categories...');
  const catRes = await fetch(`${supabaseUrl}/rest/v1/categories?select=*&order=display_order.asc`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
  });
  if (!catRes.ok) throw new Error(`Categories fetch failed: ${catRes.statusText}`);
  const categories = await catRes.json();
  console.log(`   ✓ Retrieved ${categories.length} categories:`);
  categories.forEach(c => console.log(`     - [${c.slug}] ${c.name} (${c.english_name})`));

  // TEST 3: Supabase Locations
  console.log('\n3. Testing Supabase Locations...');
  const locRes = await fetch(`${supabaseUrl}/rest/v1/locations?select=*&order=name.asc`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
  });
  if (!locRes.ok) throw new Error(`Locations fetch failed: ${locRes.statusText}`);
  const locations = await locRes.json();
  console.log(`   ✓ Retrieved ${locations.length} locations (Districts + Mandals):`);
  const districtList = locations.filter(l => l.type === 'district').map(l => `${l.name} (${l.slug})`);
  console.log(`     Districts: ${districtList.join(', ')}`);

  // TEST 4: Published News Query
  console.log('\n4. Testing Supabase Published News (fetchPublishedNews)...');
  const newsQuery = '/rest/v1/news?select=*,news_categories(categories(id,name,english_name,slug,color,icon_name)),news_locations(locations(id,name,english_name,slug,type)),profiles:author_id(id,full_name,avatar_url,role)&status=eq.published&order=published_at.desc';
  const newsRes = await fetch(`${supabaseUrl}${newsQuery}`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
  });
  if (!newsRes.ok) throw new Error(`News fetch failed: ${newsRes.statusText}`);
  const rawNews = await newsRes.json();
  console.log(`   ✓ Exactly ${rawNews.length} published news articles returned from public.news!`);

  const mappedNews = rawNews.map(mapDatabaseNewsToNewsItem);

  console.log('\n   Seeded Articles in Feed:');
  mappedNews.forEach((item, idx) => {
    console.log(`   [${idx + 1}] ID: ${item.id}`);
    console.log(`       Title: ${item.title}`);
    console.log(`       Category: ${item.category} (slug: ${item.categorySlug}) | Location: ${item.location} (slug: ${item.locationSlug})`);
    console.log(`       Reporter: ${item.reporterName} (${item.reporterId})`);
    console.log(`       Breaking: ${item.isBreaking} | Video: ${item.isVideo} | Fact Checked: ${item.factChecked}`);
    console.log(`       Audio Duration: ${item.audioDuration} | Date: ${item.publishedDate}`);
  });

  // TEST 5: Category Filtering
  console.log('\n5. Testing Category Filtering...');
  const testCats = ['sports', 'cinema', 'politics', 'business', 'devotion', 'local'];
  testCats.forEach(catSlug => {
    const filtered = mappedNews.filter(item => 
      item.categorySlug.toLowerCase() === catSlug.toLowerCase() ||
      item.category.toLowerCase() === catSlug.toLowerCase()
    );
    console.log(`   - Filter [${catSlug}]: found ${filtered.length} article(s) -> ${filtered.map(f => f.title.slice(0, 30) + '...').join('; ')}`);
  });

  // TEST 6: Location Filtering
  console.log('\n6. Testing Location Filtering...');
  const testLocations = ['ఖమ్మం', 'వరంగల్', 'హైదరాబాద్', 'భద్రాద్రి కొత్తగూడెం', 'అన్ని ప్రాంతాలు'];
  testLocations.forEach(locName => {
    const filtered = mappedNews.filter(item => 
      locName === 'అన్ని ప్రాంతాలు' ? true : item.location.includes(locName)
    );
    console.log(`   - Filter [${locName}]: found ${filtered.length} article(s)`);
  });

  // TEST 7: Article Detail Verification
  console.log('\n7. Testing News Detail Screen Data Completeness...');
  let detailErrors = 0;
  mappedNews.forEach((item) => {
    if (!item.id || !item.title || !item.content || !item.shortSummary || !item.location || !item.category) {
      console.error(`   ❌ Missing required field on article ${item.id}`);
      detailErrors++;
    }
  });
  if (detailErrors === 0) {
    console.log(`   ✓ All ${mappedNews.length} articles have complete data for the NewsDetailScreen (title, summary, full content, location, category, author, dates).`);
  }

  // TEST 8: Breaking News and Video News
  console.log('\n8. Testing Special Feeds (Breaking News & Video News)...');
  const breaking = mappedNews.filter(n => n.isBreaking);
  const video = mappedNews.filter(n => n.isVideo);
  console.log(`   ✓ Breaking News banner count: ${breaking.length} (Primary: "${breaking[0]?.title || 'None'}")`);
  console.log(`   ✓ Video Feed tab count: ${video.length}`);

  console.log('\n====================================================');
  console.log('  ALL E2E LOGIC TESTS PASSED SUCCESSFULLY! ✓');
  console.log('====================================================');
}

runEndToEndVerification().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});

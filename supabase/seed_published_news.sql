-- ==============================================================================
-- Rachabanda (రచ్చ బండ) — Safe Demo News Seed Script
-- File: supabase/seed_published_news.sql
-- Description: Inserts 7 original published Telugu test articles linking to existing
--              seeded categories and locations with ON CONFLICT safety.
-- ==============================================================================

DO $$
DECLARE
  v_cat_local uuid := 'a6c66cf4-eefa-4711-9b28-91cf57702a6f';      -- స్థానిక / Local
  v_cat_business uuid := '572d3411-e407-43e2-983d-c53d43eb548e';   -- వ్యాపారం / Business
  v_cat_sports uuid := '7ba03974-b4eb-40c5-ba63-37e4fae457d3';     -- క్రీడలు / Sports
  v_cat_politics uuid := '5e7cc493-4189-478f-bd6c-1c775b7544d2';   -- రాజకీయం / Politics
  v_cat_cinema uuid := '0b269406-eca8-4cf6-9d6e-2b4620f0d377';     -- సినిమా / Cinema
  v_cat_devotion uuid := '6ed0f9d0-ac0b-47f4-8104-dff99af756e1';   -- భక్తి / Devotion

  v_loc_telangana uuid := '00000000-0000-0000-0000-000000000002';  -- తెలంగాణ / Telangana
  v_loc_hyderabad uuid := '00000000-0000-0000-0000-000000000010';  -- హైదరాబాద్ / Hyderabad
  v_loc_khammam uuid := '00000000-0000-0000-0000-000000000011';    -- ఖమ్మం / Khammam
  v_loc_kothagudem uuid := '00000000-0000-0000-0000-000000000012'; -- భద్రాద్రి కొత్తగూడెం
  v_loc_warangal uuid := '00000000-0000-0000-0000-000000000013';   -- వరంగల్ / Warangal
  v_loc_madhira uuid := '00000000-0000-0000-0000-000000000033';    -- మధిర / Madhira

  v_news_id uuid;
BEGIN

  -- --------------------------------------------------------------------------
  -- 1. Article 1: Khammam Smart Bus Shelters (Breaking, Local, Khammam)
  -- --------------------------------------------------------------------------
  INSERT INTO public.news (
    title, slug, short_summary, content, language, status,
    cover_image, audio_duration, audio_narrated_text,
    is_breaking, is_video, fact_checked, source,
    likes_count, comments_count, published_at
  ) VALUES (
    'ఖమ్మం నగరంలో అత్యాధునిక స్మార్ట్ బస్ షెల్టర్ల నిర్మాణం ప్రారంభం',
    'khammam-smart-bus-shelters-demo',
    'ఖమ్మం నగరపాలక సంస్థ పరిధిలో ప్రయాణికుల సౌకర్యార్థం పది ప్రధాన కూడళ్లలో అత్యాధునిక స్మార్ట్ బస్ షెల్టర్ల పనులు ప్రారంభమయ్యాయి. డిజిటల్ డిస్ప్లే బోర్డులు, మొబైల్ ఛార్జింగ్ పాయింట్లు, సీసీ కెమెరాల నిఘాతో వీటిని నిర్మిస్తున్నట్లు కమిషనర్ తెలిపారు.',
    E'నగర ప్రయాణికులకు మెరుగైన మౌలిక వసతులు కల్పించే దిశగా ఖమ్మం మున్సిపల్ కార్పొరేషన్ మరో ముందడుగు వేసింది. నగరంలోని వైరా రోడ్, బస్టాండ్ సర్కిల్, మమత హాస్పిటల్ కూడలితో సహా పది ప్రధాన ప్రాంతాల్లో స్మార్ట్ బస్ షెల్టర్ల నిర్మాణ పనులను అధికారులు ప్రారంభించారు.\n\nఈ బస్ షెల్టర్లలో ప్రత్యేకంగా మహిళల కోసం ప్రైవేట్ వెయిటింగ్ ఏరియా, బస్సుల రాకపోకలను తెలిపే ఎల్ఈడీ డిజిటల్ స్క్రీన్లు, సోలార్ పవర్ మొబైల్ ఛార్జింగ్ కేంద్రాలు మరియు తాగునీటి సదుపాయం ఏర్పాటు చేయనున్నారు. భద్రత కోసం ప్రతి షెల్టర్ వద్ద 24 గంటల సీసీటీవీ నిఘా ఉంటుంది.\n\nరాబోయే రెండు నెలల్లో అన్ని పనులు పూర్తి చేసి ప్రజలకు అందుబాటులోకి తీసుకువస్తామని ప్రాజెక్ట్ ఇంజనీర్ వెల్లడించారు. నగర సుందరీకరణలో భాగంగా ఈ ప్రాజెక్టును చేపట్టినట్లు పేర్కొన్నారు.',
    'te', 'published',
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80',
    '1:15',
    'రచ్చ బండ తాజా వార్త. ఖమ్మం నగరంలో పది ప్రధాన కూడళ్లలో స్మార్ట్ బస్ షెల్టర్ల నిర్మాణ పనులు ప్రారంభమయ్యాయి. డిజిటల్ డిస్ప్లేలు, సీసీ కెమెరాలతో అత్యాధునిక వసతులు కల్పిస్తున్నారు.',
    true, false, true, 'రచ్చ బండ డెస్క్',
    184, 26, now() - interval '15 minutes'
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    short_summary = EXCLUDED.short_summary,
    content = EXCLUDED.content,
    status = EXCLUDED.status,
    published_at = EXCLUDED.published_at
  RETURNING id INTO v_news_id;

  INSERT INTO public.news_categories (news_id, category_id)
  VALUES (v_news_id, v_cat_local)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.news_locations (news_id, location_id)
  VALUES (v_news_id, v_loc_khammam)
  ON CONFLICT DO NOTHING;

  -- --------------------------------------------------------------------------
  -- 2. Article 2: Khammam Chilli Solar Cold Storage (Business/Agri, Khammam)
  -- --------------------------------------------------------------------------
  INSERT INTO public.news (
    title, slug, short_summary, content, language, status,
    cover_image, audio_duration, audio_narrated_text,
    is_breaking, is_video, fact_checked, source,
    likes_count, comments_count, published_at
  ) VALUES (
    'ఖమ్మం మార్కెట్ పరిధిలో రైతులకు సోలార్ కోల్డ్ స్టోరేజ్ వసతి',
    'khammam-chilli-solar-cold-storage-demo',
    'మిర్చి మరియు కూరగాయల రైతులు తమ పంటను నిల్వ చేసుకునేందుకు వీలుగా ఖమ్మం వ్యవసాయ మార్కెట్ యార్డులో నూతన సోలార్ ఆధారిత శీతల గిడ్డంగి ఏర్పాటైంది. నామమాత్రపు రుసుముతో రైతులు ఈ సదుపాయాన్ని వినియోగించుకోవచ్చని పాలకమండలి ప్రకటించింది.',
    E'రైతులు పండించిన పంటను వెంటనే తక్కువ ధరకు అమ్ముకోకుండా గిట్టుబాటు ధర వచ్చే వరకు నిల్వ చేసుకునేందుకు ఖమ్మం మార్కెట్ కమిటీ ఆధ్వర్యంలో అత్యాధునిక సోలార్ కోల్డ్ స్టోరేజ్ యూనిట్ అందుబాటులోకి వచ్చింది.\n\nఈ శీతల గిడ్డంగి 500 మెట్రిక్ టన్నుల సామర్థ్యంతో నిర్మించబడింది. సౌరశక్తితో నడవడం వల్ల నిర్వహణ ఖర్చులు తక్కువగా ఉండి, రైతులకు అతి తక్కువ అద్దెకే స్థలాన్ని కేటాయిస్తారు. తేజా మిర్చి మరియు ఉద్యానవన పంటల నాణ్యత తగ్గకుండా ప్రత్యేక ఉష్ణోగ్రత నియంత్రణ వ్యవస్థను ఇందులో ఏర్పాటు చేశారు.\n\nఈ సదుపాయాన్ని సద్వినియోగం చేసుకోవాలని జిల్లా మార్కెటింగ్ అధికారి రైతులకు పిలుపునిచ్చారు.',
    'te', 'published',
    'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=800&auto=format&fit=crop&q=80',
    '1:05',
    'రచ్చ బండ వ్యవసాయ సమాచారం. ఖమ్మం మార్కెట్ యార్డులో 500 మెట్రిక్ టన్నుల సామర్థ్యంతో సోలార్ కోల్డ్ స్టోరేజ్ ప్రారంభమైంది. రైతులు తమ పంటను నిల్వ చేసుకునేందుకు ఇది ఎంతో ఉపయోగపడుతుంది.',
    false, false, true, 'రచ్చ బండ డెస్క్',
    142, 18, now() - interval '45 minutes'
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    short_summary = EXCLUDED.short_summary,
    content = EXCLUDED.content,
    status = EXCLUDED.status,
    published_at = EXCLUDED.published_at
  RETURNING id INTO v_news_id;

  INSERT INTO public.news_categories (news_id, category_id)
  VALUES (v_news_id, v_cat_business)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.news_locations (news_id, location_id)
  VALUES (v_news_id, v_loc_khammam)
  ON CONFLICT DO NOTHING;

  -- --------------------------------------------------------------------------
  -- 3. Article 3: Warangal Kabaddi (Sports, Video, Warangal)
  -- --------------------------------------------------------------------------
  INSERT INTO public.news (
    title, slug, short_summary, content, language, status,
    cover_image, video_url, video_duration, is_video,
    audio_duration, audio_narrated_text,
    is_breaking, fact_checked, source,
    likes_count, comments_count, published_at
  ) VALUES (
    'వరంగల్‌లో రాష్ట్ర స్థాయి కబడ్డీ పోటీలు.. ఉత్సాహంగా తలపడ్డ జట్లు',
    'warangal-state-level-kabaddi-demo',
    'వరంగల్ జవహర్‌లాల్ నెహ్రూ స్టేడియంలో రాష్ట్ర స్థాయి గ్రామీణ కబడ్డీ ఛాంపియన్‌షిప్ పోటీలు ఘనంగా ప్రారంభమయ్యాయి. 16 జిల్లాల నుంచి వచ్చిన క్రీడాకారులు ఉత్కంఠభరితమైన మ్యాచ్‌లతో క్రీడాభిమానులను అలరించారు.',
    E'తెలంగాణ క్రీడా ప్రాధికార సంస్థ ఆధ్వర్యంలో వరంగల్ వేదికగా జరుగుతున్న అంతర్ జిల్లాల కబడ్డీ టోర్నమెంట్‌కు విశేష స్పందన లభించింది. ప్రారంభ మ్యాచ్‌లో ఖమ్మం జట్టు కరీంనగర్ జట్టుపై 38-32 పాయింట్ల తేడాతో విజయం సాధించింది.\n\nగ్రామీణ ప్రాంతాల యువతలో క్రీడా నైపుణ్యాన్ని వెలికితీసేందుకు ఈ పోటీలను నిర్వహిస్తున్నట్లు నిర్వాహకులు తెలిపారు. సెమీఫైనల్ మరియు ఫైనల్ మ్యాచ్‌లు ఆదివారం సాయంత్రం ఫ్లడ్‌లైట్ల వెలుగులో జరగనున్నాయి.\n\nవిజేతలకు బంగారు పతకాలతో పాటు ప్రత్యేక నగదు ప్రోత్సాహకాలు అందజేయనున్నారు.',
    'te', 'published',
    'https://images.unsplash.com/photo-1526676037777-05a232554f77?w=800&auto=format&fit=crop&q=80',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    '1:30', true,
    '0:55',
    'క్రీడా విశేషాలు. వరంగల్ వేదికగా రాష్ట్ర స్థాయి గ్రామీణ కబడ్డీ పోటీలు ఉత్సాహంగా జరుగుతున్నాయి. ఖమ్మం జట్టు మొదటి రౌండ్‌లో ఘన విజయం నమోదు చేసింది.',
    false, true, 'రచ్చ బండ స్పోర్ట్స్ డెస్క్',
    215, 34, now() - interval '2 hours'
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    short_summary = EXCLUDED.short_summary,
    content = EXCLUDED.content,
    status = EXCLUDED.status,
    published_at = EXCLUDED.published_at
  RETURNING id INTO v_news_id;

  INSERT INTO public.news_categories (news_id, category_id)
  VALUES (v_news_id, v_cat_sports)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.news_locations (news_id, location_id)
  VALUES (v_news_id, v_loc_warangal)
  ON CONFLICT DO NOTHING;

  -- --------------------------------------------------------------------------
  -- 4. Article 4: Digital Panchayat (Politics, Telangana State)
  -- --------------------------------------------------------------------------
  INSERT INTO public.news (
    title, slug, short_summary, content, language, status,
    cover_image, audio_duration, audio_narrated_text,
    is_breaking, is_video, fact_checked, source,
    likes_count, comments_count, published_at
  ) VALUES (
    'తెలంగాణ వ్యాప్తంగా అన్ని పంచాయతీల్లో ఉచిత వై-ఫై సేవలు విస్తరణ',
    'telangana-digital-panchayat-demo',
    'గ్రామీణ ప్రాంతాల్లో డిజిటల్ సేవలను మరింత వేగవంతం చేసేందుకు రాష్ట్ర ప్రభుత్వం ప్రత్యేక ప్రణాళికను ప్రకటించింది. ప్రతి గ్రామ పంచాయతీ కార్యాలయం వద్ద ప్రజలకు రోజుకు 1 జీబీ ఉచిత ఇంటర్నెట్ సౌకర్యం కల్పించనున్నారు.',
    E'డిజిటల్ తెలంగాణ లక్ష్య సాధనలో భాగంగా పంచాయతీ రాజ్ శాఖ కీలక నిర్ణయం తీసుకుంది. టీ-ఫైబర్ ప్రాజెక్ట్ కింద గ్రామీణ ప్రాంతాల్లో ఇప్పటికే ఆప్టికల్ ఫైబర్ కనెక్టివిటీ పనులు ముగింపు దశకు చేరుకున్నాయి.\n\nప్రతి గ్రామ పంచాయతీ కార్యాలయం పరిధిలో 200 మీటర్ల విస్తీర్ణంలో పౌరులు ఉచితంగా ప్రభుత్వ పోర్టల్స్, సంక్షేమ పథకాల దరఖాస్తులు మరియు విద్యార్థుల ఆన్‌లైన్ అభ్యసనం కోసం ఈ ఇంటర్నెట్‌ను ఉపయోగించుకోవచ్చు.\n\nవచ్చే నెలాఖరు నాటికి తొలి విడతలో 5,000 గ్రామాల్లో ఈ సేవలను ప్రారంభించనున్నట్లు ఉన్నతాధికారులు తెలిపారు.',
    'te', 'published',
    'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80',
    '1:10',
    'తెలంగాణ ప్రభుత్వ కీలక నిర్ణయం. రాష్ట్రంలోని అన్ని గ్రామ పంచాయతీలలో ఉచిత వై-ఫై సేవలను అందుబాటులోకి తేనున్నారు. డిజిటల్ సేవల వినియోగం మరింత సులభతరం కానుంది.',
    false, false, true, 'రచ్చ బండ డెస్క్',
    380, 52, now() - interval '3 hours'
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    short_summary = EXCLUDED.short_summary,
    content = EXCLUDED.content,
    status = EXCLUDED.status,
    published_at = EXCLUDED.published_at
  RETURNING id INTO v_news_id;

  INSERT INTO public.news_categories (news_id, category_id)
  VALUES (v_news_id, v_cat_politics)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.news_locations (news_id, location_id)
  VALUES (v_news_id, v_loc_telangana)
  ON CONFLICT DO NOTHING;

  -- --------------------------------------------------------------------------
  -- 5. Article 5: Short Film Fest (Cinema, Video, Hyderabad)
  -- --------------------------------------------------------------------------
  INSERT INTO public.news (
    title, slug, short_summary, content, language, status,
    cover_image, video_url, video_duration, is_video,
    audio_duration, audio_narrated_text,
    is_breaking, fact_checked, source,
    likes_count, comments_count, published_at
  ) VALUES (
    'హైదరాబాద్‌లో అంతర్జాతీయ తెలుగు లఘు చిత్రోత్సవం ప్రారంభం',
    'telugu-cinema-short-film-fest-demo',
    'యువ దర్శకులను ప్రోత్సహించేందుకు రవీంద్రభారతి వేదికగా రెండు రోజుల పాటు తెలుగు షార్ట్ ఫిల్మ్ ఫెస్టివల్ ప్రారంభమైంది. ఉత్తమ కథ, దర్శకత్వానికి ప్రత్యేక పురస్కారాలు అందజేస్తారు.',
    E'తెలుగు సినీ పరిశ్రమలోకి సరికొత్త ప్రతిభను ఆహ్వానించేందుకు సాంస్కృతిక శాఖ ఆధ్వర్యంలో అంతర్జాతీయ తెలుగు లఘు చిత్రోత్సవం సిద్ధమైంది. ప్రపంచవ్యాప్తంగా వివిధ దేశాల నుంచి 150కి పైగా ప్రవేశికలు వచ్చాయి.\n\nప్రముఖ చలనచిత్ర దర్శకులు, రచయితలతో కూడిన జ్యూరీ ఉత్తమ చిత్రాలను ఎంపిక చేయనుంది. సామాజిక స్పృహ, గ్రామీణ సంస్కృతి మరియు సమకాలీన అంశాలపై తెరకెక్కిన చిత్రాలకు ప్రాధాన్యత ఇవ్వబడుతుంది.\n\nశనివారం ఉదయం 10 గంటలకు ప్రారంభమయ్యే ఈ ప్రదర్శనలకు సినీ ప్రియులకు ప్రవేశం ఉచితం.',
    'te', 'published',
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    '2:15', true,
    '0:50',
    'సినీ సమాచారం. హైదరాబాద్ రవీంద్రభారతిలో తెలుగు లఘు చిత్రోత్సవం ప్రారంభం కానుంది. యువ ప్రతిభను గుర్తించి ప్రోత్సహించడమే ఈ ఉత్సవం ప్రధాన ఉద్దేశ్యం.',
    false, true, 'రచ్చ బండ సినిమా డెస్క్',
    195, 29, now() - interval '4 hours'
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    short_summary = EXCLUDED.short_summary,
    content = EXCLUDED.content,
    status = EXCLUDED.status,
    published_at = EXCLUDED.published_at
  RETURNING id INTO v_news_id;

  INSERT INTO public.news_categories (news_id, category_id)
  VALUES (v_news_id, v_cat_cinema)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.news_locations (news_id, location_id)
  VALUES (v_news_id, v_loc_hyderabad)
  ON CONFLICT DO NOTHING;

  -- --------------------------------------------------------------------------
  -- 6. Article 6: Madhira Model Park (Local, Madhira Mandal)
  -- --------------------------------------------------------------------------
  INSERT INTO public.news (
    title, slug, short_summary, content, language, status,
    cover_image, audio_duration, audio_narrated_text,
    is_breaking, is_video, fact_checked, source,
    likes_count, comments_count, published_at
  ) VALUES (
    'మధిర పట్టణంలో సుందరమైన మోడల్ పార్క్ ప్రారంభం',
    'madhira-model-park-inauguration-demo',
    'మధిర పట్టణ ప్రజలకు ఆహ్లాదకరమైన వాతావరణం కల్పించేందుకు చెరువు గట్టు వద్ద నిర్మించిన నూతన మోడల్ పార్కును స్థానిక అధికారులు ప్రారంభించారు. వాకింగ్ ట్రాక్ మరియు ఓపెన్ జిమ్ వసతులు ఏర్పాటు చేశారు.',
    E'మధిర పట్టణ సుందరీకరణలో భాగంగా నిర్మించిన మోడల్ నేచర్ పార్క్ ప్రజలకు అందుబాటులోకి వచ్చింది. ఉదయం, సాయంత్రం వేళల్లో వాకర్స్ కోసం ప్రత్యేకంగా 1 కిలోమీటర్ వాకింగ్ ట్రాక్ సిద్ధం చేశారు.\n\nపిల్లల కోసం క్రీడా పరికరాలు, వృద్ధుల కోసం విశ్రాంతి బల్లలు, మరియు యువత కోసం ఓపెన్ జిమ్ పరికరాలను ఇందులో అమర్చారు. పార్కు చుట్టూ రంగురంగుల పూల మొక్కలతో పాటు నీడను ఇచ్చే చెట్లను నాటారు.\n\nపట్టణవాసులు ఈ పార్కును పరిశుభ్రంగా ఉంచుకోవాలని మున్సిపల్ అధికారులు విజ్ఞప్తి చేశారు.',
    'te', 'published',
    'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&auto=format&fit=crop&q=80',
    '1:00',
    'మధిర స్థానిక వార్తలు. పట్టణంలో చెరువు గట్టు వద్ద మోడల్ పార్కును ప్రారంభించారు. ఓపెన్ జిమ్, వాకింగ్ ట్రాక్‌లతో ప్రజలకు ఆహ్లాదకరమైన వాతావరణం అందుబాటులోకి వచ్చింది.',
    false, false, true, 'రచ్చ బండ డెస్క్',
    115, 14, now() - interval '5 hours'
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    short_summary = EXCLUDED.short_summary,
    content = EXCLUDED.content,
    status = EXCLUDED.status,
    published_at = EXCLUDED.published_at
  RETURNING id INTO v_news_id;

  INSERT INTO public.news_categories (news_id, category_id)
  VALUES (v_news_id, v_cat_local)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.news_locations (news_id, location_id)
  VALUES (v_news_id, v_loc_madhira)
  ON CONFLICT DO NOTHING;

  -- --------------------------------------------------------------------------
  -- 7. Article 7: Bhadrachalam Temple (Devotion, Bhadradri Kothagudem)
  -- --------------------------------------------------------------------------
  INSERT INTO public.news (
    title, slug, short_summary, content, language, status,
    cover_image, audio_duration, audio_narrated_text,
    is_breaking, is_video, fact_checked, source,
    likes_count, comments_count, published_at
  ) VALUES (
    'భద్రాచలం రామాలయంలో వైభవంగా నిత్య కల్యాణ వేడుకలు',
    'bhadradri-temple-renovation-demo',
    'దక్షిణ అయోధ్యగా పేరుగాంచిన భద్రాచలం శ్రీ సీతారామచంద్రస్వామి దేవస్థానంలో నిత్య కల్యాణం కన్నులపండువగా జరిగింది. వివిధ ప్రాంతాల నుంచి వచ్చిన భక్తులు స్వామివారిని దర్శించుకున్నారు.',
    E'భద్రాచల పుణ్యక్షేత్రంలో సీతారాముల నిత్య కల్యాణ క్రతువును వేద పండితులు శాస్త్రోక్తంగా నిర్వహించారు. ఉదయం సుప్రభాత సేవతో ప్రారంభమైన పూజలు, అనంతరం గర్భగుడిలో మూలవిరాట్టులకు ప్రత్యేక అభిషేకాలు నిర్వహించారు.\n\nభక్తుల రద్దీ దృష్ట్యా దేవస్థానం ప్రత్యేక క్యూలైన్లు, ఉచిత లడ్డు ప్రసాదం మరియు తాగునీటి సదుపాయాలు ఏర్పాటు చేసింది. భక్తులకు ఎటువంటి అసౌకర్యం కలగకుండా అన్ని ఏర్పాట్లు చేసినట్లు ఆలయ ఈవో తెలిపారు.\n\nకల్యాణోత్సవంలో పాల్గొన్న భక్తులకు ప్రత్యేక శేషవస్త్రాలు, తీర్థప్రసాదాలు అందజేశారు.',
    'te', 'published',
    'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?w=800&auto=format&fit=crop&q=80',
    '1:02',
    'భక్తి విశేషాలు. భద్రాచలం శ్రీ సీతారామచంద్రస్వామి ఆలయంలో నిత్య కల్యాణం వైభవంగా జరిగింది. భక్తులు విశేష సంఖ్యలో పాల్గొని స్వామివారిని దర్శించుకున్నారు.',
    false, false, true, 'రచ్చ బండ డెస్క్',
    165, 21, now() - interval '6 hours'
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    short_summary = EXCLUDED.short_summary,
    content = EXCLUDED.content,
    status = EXCLUDED.status,
    published_at = EXCLUDED.published_at
  RETURNING id INTO v_news_id;

  INSERT INTO public.news_categories (news_id, category_id)
  VALUES (v_news_id, v_cat_devotion)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.news_locations (news_id, location_id)
  VALUES (v_news_id, v_loc_kothagudem)
  ON CONFLICT DO NOTHING;

END $$;

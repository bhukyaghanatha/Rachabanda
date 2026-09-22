-- ==============================================================================
-- Rachabanda (రచ్చ బండ) Complete Database Schema
-- You can paste this directly into the Supabase Dashboard -> SQL Editor and click 'Run'.
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ENUMS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('reader', 'citizen_reporter', 'reporter', 'editor', 'admin');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE location_type AS ENUM ('country', 'state', 'district', 'city', 'mandal', 'village');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE news_status AS ENUM ('draft', 'pending', 'approved', 'published', 'rejected', 'archived');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE submission_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE media_type AS ENUM ('image', 'video', 'audio');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE reaction_type AS ENUM ('like', 'love', 'support', 'angry');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE follow_type AS ENUM ('category', 'location');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. TABLES

-- 2.1 Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  role user_role DEFAULT 'reader' NOT NULL,
  avatar_url text,
  district text,
  mandal text,
  bio text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 2.2 Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  english_name text NOT NULL,
  slug text UNIQUE NOT NULL,
  color text DEFAULT '#E41E26' NOT NULL,
  icon_name text DEFAULT 'newspaper' NOT NULL,
  display_order int DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 2.3 Locations (Hierarchical)
CREATE TABLE IF NOT EXISTS public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  english_name text NOT NULL,
  slug text UNIQUE NOT NULL,
  type location_type NOT NULL,
  parent_id uuid REFERENCES public.locations(id) ON DELETE CASCADE,
  state_code text DEFAULT 'TG',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 2.4 News
CREATE TABLE IF NOT EXISTS public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  short_summary text NOT NULL,
  content text NOT NULL,
  language text DEFAULT 'te' NOT NULL,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status news_status DEFAULT 'draft' NOT NULL,
  cover_image text,
  audio_url text,
  audio_duration text DEFAULT '1:00',
  audio_narrated_text text,
  video_url text,
  video_duration text,
  is_breaking boolean DEFAULT false NOT NULL,
  is_video boolean DEFAULT false NOT NULL,
  fact_checked boolean DEFAULT false NOT NULL,
  source text DEFAULT 'రచ్చ బండ డెస్క్' NOT NULL,
  source_url text,
  views_count int DEFAULT 0 NOT NULL,
  likes_count int DEFAULT 0 NOT NULL,
  comments_count int DEFAULT 0 NOT NULL,
  published_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 2.5 News Media
CREATE TABLE IF NOT EXISTS public.news_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id uuid REFERENCES public.news(id) ON DELETE CASCADE NOT NULL,
  media_type media_type NOT NULL,
  media_url text NOT NULL,
  caption text,
  display_order int DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 2.6 News Categories Junction
CREATE TABLE IF NOT EXISTS public.news_categories (
  news_id uuid REFERENCES public.news(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (news_id, category_id)
);

-- 2.7 News Locations Junction
CREATE TABLE IF NOT EXISTS public.news_locations (
  news_id uuid REFERENCES public.news(id) ON DELETE CASCADE NOT NULL,
  location_id uuid REFERENCES public.locations(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (news_id, location_id)
);

-- 2.8 Citizen Submissions
CREATE TABLE IF NOT EXISTS public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reporter_name text NOT NULL,
  reporter_phone text,
  title text NOT NULL,
  details text NOT NULL,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  location_text text NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  category_text text NOT NULL,
  image_url text,
  audio_url text,
  video_url text,
  status submission_status DEFAULT 'pending' NOT NULL,
  rejection_reason text,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  published_news_id uuid REFERENCES public.news(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 2.9 Comments
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id uuid REFERENCES public.news(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name text NOT NULL,
  user_location text DEFAULT 'తెలంగాణ',
  comment text NOT NULL,
  likes_count int DEFAULT 0 NOT NULL,
  is_approved boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 2.10 Reactions
CREATE TABLE IF NOT EXISTS public.reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id uuid REFERENCES public.news(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reaction reaction_type DEFAULT 'like' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(news_id, user_id)
);

-- 2.11 Bookmarks
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  news_id uuid REFERENCES public.news(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, news_id)
);

-- 2.12 Follows
CREATE TABLE IF NOT EXISTS public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  follow_type follow_type NOT NULL,
  target_id uuid NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, follow_type, target_id)
);

-- 2.13 Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  link text,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_news_status_published ON public.news(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_slug ON public.news(slug);
CREATE INDEX IF NOT EXISTS idx_news_language ON public.news(language);
CREATE INDEX IF NOT EXISTS idx_news_author ON public.news(author_id);
CREATE INDEX IF NOT EXISTS idx_locations_parent ON public.locations(parent_id);
CREATE INDEX IF NOT EXISTS idx_locations_slug ON public.locations(slug);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_user ON public.submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_news ON public.comments(news_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reactions_news ON public.reactions(news_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_user ON public.follows(user_id, follow_type);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin_or_editor()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Public profiles are readable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Categories & Locations Policies
CREATE POLICY "Categories are readable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Categories manageable by admins" ON public.categories FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Locations are readable by everyone" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Locations manageable by admins" ON public.locations FOR ALL USING (public.is_admin_or_editor());

-- News Policies
CREATE POLICY "Public can read published news" ON public.news FOR SELECT USING (status = 'published');
CREATE POLICY "Staff can read all news" ON public.news FOR SELECT USING (public.is_admin_or_editor());
CREATE POLICY "Authors can read their own drafts" ON public.news FOR SELECT USING (auth.uid() = author_id);
CREATE POLICY "Only admins/editors can create or modify published news" ON public.news FOR ALL USING (public.is_admin_or_editor());

-- Media and Junction Policies
CREATE POLICY "Public can read news media" ON public.news_media FOR SELECT USING (EXISTS (SELECT 1 FROM public.news WHERE id = news_media.news_id AND status = 'published'));
CREATE POLICY "Admins can manage news media" ON public.news_media FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Public can read news categories" ON public.news_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage news categories" ON public.news_categories FOR ALL USING (public.is_admin_or_editor());
CREATE POLICY "Public can read news locations" ON public.news_locations FOR SELECT USING (true);
CREATE POLICY "Admins can manage news locations" ON public.news_locations FOR ALL USING (public.is_admin_or_editor());

-- Citizen Submissions Policies
CREATE POLICY "Anyone can submit news" ON public.submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own submissions" ON public.submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins and editors can view and review all submissions" ON public.submissions FOR ALL USING (public.is_admin_or_editor());

-- Comments Policies
CREATE POLICY "Public can view approved comments" ON public.comments FOR SELECT USING (is_approved = true);
CREATE POLICY "Authenticated users can post comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id OR public.is_admin_or_editor());

-- Reactions, Bookmarks, Follows, Notifications
CREATE POLICY "Users can manage their own reactions" ON public.reactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own bookmarks" ON public.bookmarks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own follows" ON public.follows FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can read their own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- 5. PROFILE TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'రచ్చబండ యూజర్'),
    'reader',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. SEED DATA
INSERT INTO public.categories (name, english_name, slug, color, icon_name, display_order)
VALUES
  ('రాజకీయం', 'Politics', 'politics', '#E41E26', 'landmark', 1),
  ('స్థానిక', 'Local', 'local', '#B71C1C', 'map-pin', 2),
  ('నేరాలు', 'Crime', 'crime', '#D32F2F', 'shield-alert', 3),
  ('క్రీడలు', 'Sports', 'sports', '#1976D2', 'trophy', 4),
  ('సినిమా', 'Cinema', 'cinema', '#7B1FA2', 'film', 5),
  ('జాతీయం', 'National', 'national', '#F57C00', 'globe', 6),
  ('వ్యాపారం', 'Business', 'business', '#388E3C', 'trending-up', 7),
  ('భక్తి', 'Devotion', 'devotion', '#E64A19', 'sparkles', 8)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.locations (id, name, english_name, slug, type, parent_id, state_code)
VALUES ('00000000-0000-0000-0000-000000000001', 'భారతదేశం', 'India', 'india', 'country', NULL, NULL)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.locations (id, name, english_name, slug, type, parent_id, state_code)
VALUES ('00000000-0000-0000-0000-000000000002', 'తెలంగాణ', 'Telangana', 'telangana', 'state', '00000000-0000-0000-0000-000000000001', 'TG')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.locations (id, name, english_name, slug, type, parent_id, state_code)
VALUES
  ('00000000-0000-0000-0000-000000000010', 'హైదరాబాద్', 'Hyderabad', 'hyderabad', 'district', '00000000-0000-0000-0000-000000000002', 'TG'),
  ('00000000-0000-0000-0000-000000000011', 'ఖమ్మం', 'Khammam', 'khammam', 'district', '00000000-0000-0000-0000-000000000002', 'TG'),
  ('00000000-0000-0000-0000-000000000012', 'భద్రాద్రి కొత్తగూడెం', 'Bhadradri Kothagudem', 'bhadradri-kothagudem', 'district', '00000000-0000-0000-0000-000000000002', 'TG'),
  ('00000000-0000-0000-0000-000000000013', 'వరంగల్', 'Warangal', 'warangal', 'district', '00000000-0000-0000-0000-000000000002', 'TG'),
  ('00000000-0000-0000-0000-000000000014', 'కరీంనగర్', 'Karimnagar', 'karimnagar', 'district', '00000000-0000-0000-0000-000000000002', 'TG'),
  ('00000000-0000-0000-0000-000000000015', 'నిజామాబాద్', 'Nizamabad', 'nizamabad', 'district', '00000000-0000-0000-0000-000000000002', 'TG'),
  ('00000000-0000-0000-0000-000000000016', 'నల్గొండ', 'Nalgonda', 'nalgonda', 'district', '00000000-0000-0000-0000-000000000002', 'TG'),
  ('00000000-0000-0000-0000-000000000017', 'మహబూబ్‌నగర్', 'Mahabubnagar', 'mahabubnagar', 'district', '00000000-0000-0000-0000-000000000002', 'TG')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.locations (id, name, english_name, slug, type, parent_id, state_code)
VALUES
  ('00000000-0000-0000-0000-000000000030', 'ఖమ్మం అర్బన్', 'Khammam Urban', 'khammam-urban', 'mandal', '00000000-0000-0000-0000-000000000011', 'TG'),
  ('00000000-0000-0000-0000-000000000031', 'ఖమ్మం రూరల్', 'Khammam Rural', 'khammam-rural', 'mandal', '00000000-0000-0000-0000-000000000011', 'TG'),
  ('00000000-0000-0000-0000-000000000032', 'వైరా', 'Wyra', 'wyra', 'mandal', '00000000-0000-0000-0000-000000000011', 'TG'),
  ('00000000-0000-0000-0000-000000000033', 'మధిర', 'Madhira', 'madhira', 'mandal', '00000000-0000-0000-0000-000000000011', 'TG')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.locations (id, name, english_name, slug, type, parent_id, state_code)
VALUES
  ('00000000-0000-0000-0000-000000000040', 'ముత్తగూడెం', 'Muthagudem', 'muthagudem', 'village', '00000000-0000-0000-0000-000000000031', 'TG'),
  ('00000000-0000-0000-0000-000000000041', 'తీర్థాల', 'Theerthala', 'theerthala', 'village', '00000000-0000-0000-0000-000000000031', 'TG')
ON CONFLICT (slug) DO NOTHING;

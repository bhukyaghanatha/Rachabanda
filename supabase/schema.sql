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
  updated_at timestamptz DEFAULT now() NOT NULL,
  fts tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(short_summary, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(content, '')), 'C')
  ) STORED
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

-- 2.14 Content Reports
CREATE TABLE IF NOT EXISTS public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_content_reports_type CHECK (content_type IN ('news', 'comment')),
  CONSTRAINT chk_content_reports_reason CHECK (reason IN ('misinformation', 'hate_speech', 'harassment', 'spam', 'inappropriate', 'copyright', 'other')),
  CONSTRAINT chk_content_reports_status CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned'))
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
CREATE INDEX IF NOT EXISTS idx_news_fts ON public.news USING gin(fts);
CREATE INDEX IF NOT EXISTS idx_news_categories_cat ON public.news_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_news_locations_loc ON public.news_locations(location_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_reports_unique_pending ON public.content_reports (reporter_id, content_type, content_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_content_reports_status_created ON public.content_reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter ON public.content_reports (reporter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_reports_content ON public.content_reports (content_type, content_id);

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
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Staff can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin_or_editor());
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

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
CREATE POLICY "Anyone can submit news" ON public.submissions FOR INSERT WITH CHECK (
  (auth.uid() IS NULL AND user_id IS NULL)
  OR
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
);
CREATE POLICY "Users can view their own submissions" ON public.submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins and editors can view and review all submissions" ON public.submissions FOR ALL USING (public.is_admin_or_editor());

-- Comments Policies
CREATE POLICY "Public can view approved comments" ON public.comments FOR SELECT USING (is_approved = true);
CREATE POLICY "Staff can view all comments" ON public.comments FOR SELECT USING (public.is_admin_or_editor());
CREATE POLICY "Authenticated users can post comments" ON public.comments FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND auth.uid() = user_id
);
CREATE POLICY "Staff can moderate comments" ON public.comments FOR UPDATE USING (public.is_admin_or_editor()) WITH CHECK (public.is_admin_or_editor());
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id OR public.is_admin_or_editor());

-- Reactions, Bookmarks, Follows
CREATE POLICY "Users can manage their own reactions" ON public.reactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own bookmarks" ON public.bookmarks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own follows" ON public.follows FOR ALL USING (auth.uid() = user_id);

-- Notifications Policies
DROP POLICY IF EXISTS "Users can read their own notifications" ON public.notifications;
CREATE POLICY "Users can read their own notifications" 
  ON public.notifications FOR ALL 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins and editors can insert notifications" ON public.notifications;
CREATE POLICY "Admins and editors can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR public.is_admin_or_editor()
  );

-- Content Reports Policies
DROP POLICY IF EXISTS "Authenticated users can create content reports" ON public.content_reports;
CREATE POLICY "Authenticated users can create content reports"
  ON public.content_reports
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND reporter_id = auth.uid()
    AND status = 'pending'
  );

DROP POLICY IF EXISTS "Users can view own reports and staff can view all" ON public.content_reports;
CREATE POLICY "Users can view own reports and staff can view all"
  ON public.content_reports
  FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND reporter_id = auth.uid())
    OR public.is_admin_or_editor()
  );

DROP POLICY IF EXISTS "Staff can update content reports" ON public.content_reports;
CREATE POLICY "Staff can update content reports"
  ON public.content_reports
  FOR UPDATE
  USING (public.is_admin_or_editor())
  WITH CHECK (public.is_admin_or_editor());

-- Destructive DELETE is strictly prohibited for all roles (audit trail preservation)
DROP POLICY IF EXISTS "Staff can delete content reports" ON public.content_reports;

-- Content Report Target Existence Trigger
CREATE OR REPLACE FUNCTION public.validate_content_report_target()
RETURNS trigger AS $$
BEGIN
  IF NEW.content_type = 'news' THEN
    IF NOT EXISTS (SELECT 1 FROM public.news WHERE id = NEW.content_id) THEN
      RAISE EXCEPTION 'Report target not found: news item % does not exist', NEW.content_id
        USING ERRCODE = '23503';
    END IF;
  ELSIF NEW.content_type = 'comment' THEN
    IF NOT EXISTS (SELECT 1 FROM public.comments WHERE id = NEW.content_id) THEN
      RAISE EXCEPTION 'Report target not found: comment % does not exist', NEW.content_id
        USING ERRCODE = '23503';
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid content_type: %', NEW.content_type
      USING ERRCODE = '22023';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_validate_content_report_target ON public.content_reports;
CREATE TRIGGER trg_validate_content_report_target
  BEFORE INSERT OR UPDATE OF content_type, content_id ON public.content_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_content_report_target();

-- Immutable Report Fields Protection Trigger
CREATE OR REPLACE FUNCTION public.protect_content_report_fields()
RETURNS trigger AS $$
BEGIN
  -- 1. Protect immutable fields: id, content_type, content_id, reason, details, created_at
  IF (NEW.id IS DISTINCT FROM OLD.id)
     OR (NEW.content_type IS DISTINCT FROM OLD.content_type)
     OR (NEW.content_id IS DISTINCT FROM OLD.content_id)
     OR (NEW.reason IS DISTINCT FROM OLD.reason)
     OR (NEW.details IS DISTINCT FROM OLD.details)
     OR (NEW.created_at IS DISTINCT FROM OLD.created_at) THEN
    RAISE EXCEPTION 'Cannot modify immutable content report fields (target content, reason, details, or timestamp)'
      USING ERRCODE = '42501'; -- insufficient_privilege
  END IF;

  -- 2. Protect reporter_id:
  -- reporter_id is strictly immutable EXCEPT when set to NULL by the database's
  -- ON DELETE SET NULL referential action when the referenced profile is deleted.
  IF (NEW.reporter_id IS DISTINCT FROM OLD.reporter_id) THEN
    -- Allow transition ONLY IF:
    -- (a) NEW.reporter_id is NULL, AND
    -- (b) OLD.reporter_id was NOT NULL, AND
    -- (c) No moderation fields were modified in this statement, AND
    -- (d) The referenced profile row no longer exists in public.profiles (confirming it was deleted)
    IF (NEW.reporter_id IS NULL)
       AND (OLD.reporter_id IS NOT NULL)
       AND (NEW.status IS NOT DISTINCT FROM OLD.status)
       AND (NEW.reviewed_by IS NOT DISTINCT FROM OLD.reviewed_by)
       AND (NEW.reviewed_at IS NOT DISTINCT FROM OLD.reviewed_at)
       AND (NEW.updated_at IS NOT DISTINCT FROM OLD.updated_at)
       AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = OLD.reporter_id) THEN
      -- Permitted: pure ON DELETE SET NULL cascade triggered by profile deletion
      NULL;
    ELSE
      RAISE EXCEPTION 'Cannot modify immutable content report fields (reporter_id cannot be modified)'
        USING ERRCODE = '42501'; -- insufficient_privilege
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_protect_content_report_fields ON public.content_reports;
CREATE TRIGGER trg_protect_content_report_fields
  BEFORE UPDATE ON public.content_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_content_report_fields();

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

-- 7. SUBMISSION APPROVAL RPC (Transactional & Atomic)
CREATE OR REPLACE FUNCTION public.approve_submission(
  p_submission_id uuid,
  p_custom_slug text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_caller_id uuid;
  v_submission record;
  v_slug text;
  v_news_id uuid;
  v_short_summary text;
  v_author_id uuid;
  v_cover_image text;
  v_reporter_name text;
  v_has_video boolean;
BEGIN
  -- 1. Security Check: Authenticated Caller
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to approve submissions'
      USING ERRCODE = '42501';
  END IF;

  -- 2. Security Check: Admin or Editor Role
  IF NOT public.is_admin_or_editor() THEN
    RAISE EXCEPTION 'Access denied: Caller must have admin or editor role'
      USING ERRCODE = '42501';
  END IF;

  -- 3. Lock & Retrieve Submission (Row-level lock to prevent concurrent approval race conditions)
  SELECT *
  INTO v_submission
  FROM public.submissions
  WHERE id = p_submission_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission with id % not found', p_submission_id
      USING ERRCODE = 'P0002';
  END IF;

  -- 4. Verify Submission Status is Pending
  IF v_submission.status != 'pending' THEN
    RAISE EXCEPTION 'Submission is already % (id: %)', v_submission.status, p_submission_id
      USING ERRCODE = '22023';
  END IF;

  -- 5. Generate Unique Slug
  IF p_custom_slug IS NOT NULL AND trim(p_custom_slug) != '' THEN
    v_slug := trim(p_custom_slug);
    IF EXISTS (SELECT 1 FROM public.news WHERE slug = v_slug) THEN
      v_slug := v_slug || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 6);
    END IF;
  ELSE
    v_slug := lower(regexp_replace(v_submission.title, '[^a-zA-Z0-9\u0C00-\u0C7F]+', '-', 'g'));
    v_slug := trim(both '-' from v_slug);
    IF length(v_slug) > 50 THEN
      v_slug := substr(v_slug, 1, 50);
    END IF;
    IF v_slug IS NULL OR v_slug = '' THEN
      v_slug := 'news';
    END IF;
    v_slug := v_slug || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 8);
  END IF;

  -- 6. Prepare News Attributes
  IF length(v_submission.details) > 180 THEN
    v_short_summary := substr(v_submission.details, 1, 177) || '...';
  ELSE
    v_short_summary := v_submission.details;
  END IF;

  v_author_id := COALESCE(v_submission.user_id, v_caller_id);
  v_cover_image := COALESCE(
    v_submission.image_url,
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80'
  );
  v_reporter_name := COALESCE(v_submission.reporter_name, 'రచ్చ బండ పౌర రిపోర్టర్');
  v_has_video := (v_submission.video_url IS NOT NULL AND trim(v_submission.video_url) != '');

  -- 7. Insert into public.news
  INSERT INTO public.news (
    title,
    slug,
    short_summary,
    content,
    language,
    author_id,
    status,
    cover_image,
    audio_url,
    audio_duration,
    video_url,
    is_breaking,
    is_video,
    fact_checked,
    source,
    published_at,
    created_at,
    updated_at
  ) VALUES (
    v_submission.title,
    v_slug,
    v_short_summary,
    v_submission.details,
    'te',
    v_author_id,
    'published',
    v_cover_image,
    v_submission.audio_url,
    '1:00',
    v_submission.video_url,
    false,
    v_has_video,
    true,
    v_reporter_name,
    now(),
    now(),
    now()
  )
  RETURNING id INTO v_news_id;

  -- 8. Insert into public.news_categories
  IF v_submission.category_id IS NOT NULL THEN
    INSERT INTO public.news_categories (news_id, category_id)
    VALUES (v_news_id, v_submission.category_id)
    ON CONFLICT (news_id, category_id) DO NOTHING;
  END IF;

  -- 9. Insert into public.news_locations
  IF v_submission.location_id IS NOT NULL THEN
    INSERT INTO public.news_locations (news_id, location_id)
    VALUES (v_news_id, v_submission.location_id)
    ON CONFLICT (news_id, location_id) DO NOTHING;
  END IF;

  -- 10. Insert uploaded media into public.news_media
  IF v_submission.image_url IS NOT NULL AND trim(v_submission.image_url) != '' THEN
    INSERT INTO public.news_media (news_id, media_type, media_url, caption, display_order)
    VALUES (v_news_id, 'image', v_submission.image_url, v_submission.title, 1);
  END IF;

  IF v_submission.audio_url IS NOT NULL AND trim(v_submission.audio_url) != '' THEN
    INSERT INTO public.news_media (news_id, media_type, media_url, caption, display_order)
    VALUES (v_news_id, 'audio', v_submission.audio_url, 'వాయిస్ రిపోర్ట్ (Voice Report)', 2);
  END IF;

  IF v_submission.video_url IS NOT NULL AND trim(v_submission.video_url) != '' THEN
    INSERT INTO public.news_media (news_id, media_type, media_url, caption, display_order)
    VALUES (v_news_id, 'video', v_submission.video_url, 'వీడియో కవరేజ్ (Video Coverage)', 3);
  END IF;

  -- 11. Update public.submissions
  UPDATE public.submissions
  SET
    status = 'approved',
    reviewed_by = v_caller_id,
    reviewed_at = now(),
    published_news_id = v_news_id,
    updated_at = now()
  WHERE id = p_submission_id;

  -- 12. Return confirmation json
  RETURN jsonb_build_object(
    'success', true,
    'submission_id', p_submission_id,
    'news_id', v_news_id,
    'slug', v_slug
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_submission(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_submission(uuid, text) TO authenticated;

-- ==============================================================================
-- 8. STORAGE BUCKETS & STORAGE RLS POLICIES
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'submissions-media',
    'submissions-media',
    true,
    52428800, -- 50 MB
    ARRAY[
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm',
      'video/mp4', 'video/webm', 'video/quicktime'
    ]
  ),
  (
    'news-media',
    'news-media',
    true,
    52428800, -- 50 MB
    ARRAY[
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm',
      'video/mp4', 'video/webm', 'video/quicktime'
    ]
  )
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public media is accessible to all" ON storage.objects;
CREATE POLICY "Public media is accessible to all"
ON storage.objects FOR SELECT
USING (bucket_id IN ('submissions-media', 'news-media'));

-- 8.2 Submissions Media Upload Policies (Hardened)
DROP POLICY IF EXISTS "Allow public uploads to submissions-media" ON storage.objects;

-- Authenticated users can upload only their own avatar
DROP POLICY IF EXISTS "Allow authenticated users to upload own avatar" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'submissions-media'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = 'avatars'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Citizen submissions allowed strictly into designated media folders
DROP POLICY IF EXISTS "Allow submission media uploads to designated folders" ON storage.objects;
CREATE POLICY "Allow submission media uploads to designated folders"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'submissions-media'
  AND (storage.foldername(name))[1] IN ('images', 'audio', 'videos')
);

-- Delete policy with correct path indexing for avatar owners and staff
DROP POLICY IF EXISTS "Allow delete on submissions-media" ON storage.objects;
CREATE POLICY "Allow delete on submissions-media"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'submissions-media'
  AND (
    (
      auth.uid() IS NOT NULL
      AND (storage.foldername(name))[1] = 'avatars'
      AND (storage.foldername(name))[2] = auth.uid()::text
    )
    OR public.is_admin_or_editor()
  )
);

-- Update policy for avatar owners and staff
DROP POLICY IF EXISTS "Allow users to update own avatar" ON storage.objects;
CREATE POLICY "Allow users to update own avatar"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'submissions-media'
  AND (
    (
      auth.uid() IS NOT NULL
      AND (storage.foldername(name))[1] = 'avatars'
      AND (storage.foldername(name))[2] = auth.uid()::text
    )
    OR public.is_admin_or_editor()
  )
)
WITH CHECK (
  bucket_id = 'submissions-media'
  AND (
    (
      auth.uid() IS NOT NULL
      AND (storage.foldername(name))[1] = 'avatars'
      AND (storage.foldername(name))[2] = auth.uid()::text
    )
    OR public.is_admin_or_editor()
  )
);

DROP POLICY IF EXISTS "Admins and editors can insert news media" ON storage.objects;
CREATE POLICY "Admins and editors can insert news media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'news-media'
  AND public.is_admin_or_editor()
);

DROP POLICY IF EXISTS "Admins and editors can update news media" ON storage.objects;
CREATE POLICY "Admins and editors can update news media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'news-media'
  AND public.is_admin_or_editor()
);

DROP POLICY IF EXISTS "Admins and editors can delete news media" ON storage.objects;
CREATE POLICY "Admins and editors can delete news media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'news-media'
  AND public.is_admin_or_editor()
);

-- ==============================================================================
-- 9. SUBMISSION REVIEW NOTIFICATION TRIGGER
-- ==============================================================================

-- Server-Side Submission Review Notification Trigger Function
CREATE OR REPLACE FUNCTION public.handle_submission_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- When submission status changes to approved
  IF (OLD.status IS DISTINCT FROM NEW.status) AND (NEW.status = 'approved') AND (NEW.user_id IS NOT NULL) THEN
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      link,
      is_read,
      created_at
    ) VALUES (
      NEW.user_id,
      'మీ వార్తా కథనం ఆమోదించబడింది! / Submission Approved',
      'మీరు పంపిన వార్త "' || substr(COALESCE(NEW.title, 'వార్త'), 1, 60) || '" ఆమోదించబడి ప్రచురించబడింది.',
      'submission_approved',
      CASE WHEN NEW.published_news_id IS NOT NULL THEN '/news/' || NEW.published_news_id ELSE NULL END,
      false,
      now()
    );
  END IF;

  -- When submission status changes to rejected
  IF (OLD.status IS DISTINCT FROM NEW.status) AND (NEW.status = 'rejected') AND (NEW.user_id IS NOT NULL) THEN
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      link,
      is_read,
      created_at
    ) VALUES (
      NEW.user_id,
      'వార్తా సమర్పణ తిరస్కరించబడింది / Submission Rejected',
      COALESCE(NEW.rejection_reason, 'మీ సమర్పణ సంపాదక మార్గదర్శకాలకు అనుగుణంగా లేదు.'),
      'submission_rejected',
      NULL,
      false,
      now()
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_submission_notification ON public.submissions;
CREATE TRIGGER trg_submission_notification
  AFTER UPDATE OF status ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_submission_notification();

-- ==============================================================================
-- 10. PROFILE ROLE PROTECTION TRIGGER
-- ==============================================================================

-- Prevent non-admin users from escalating their own role in public.profiles
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- If role is being changed
  IF (OLD.role IS DISTINCT FROM NEW.role) THEN
    -- Only existing admins can alter user roles (editors, reporters, and readers are rejected)
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Access denied: Only administrators can modify user roles'
        USING ERRCODE = '42501';
    END IF;

    -- Prevent self-demotion: an admin cannot demote themselves
    IF (OLD.id = auth.uid() AND NEW.role != 'admin') THEN
      RAISE EXCEPTION 'Access denied: Administrators cannot demote themselves'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  -- Maintain updated_at timestamp
  NEW.updated_at := now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();

-- ==============================================================================
-- 11. SEARCH PUBLISHED NEWS FULL-TEXT SEARCH (FTS) RPC
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.search_published_news(
  p_query text,
  p_limit int DEFAULT 25
)
RETURNS SETOF public.news
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_clean text;
  v_prefix_query tsquery;
BEGIN
  -- 1. Sanitize and trim query
  v_clean := trim(p_query);
  IF v_clean IS NULL OR v_clean = '' THEN
    RETURN;
  END IF;

  -- 2. Build safe prefix tsquery from all word tokens (e.g. 'ఖమ్మం బస్' -> 'ఖమ్మం':* & 'బస్':*)
  BEGIN
    SELECT to_tsquery('simple', string_agg(quote_literal(lexeme) || ':*', ' & '))
    INTO v_prefix_query
    FROM unnest(tsvector_to_array(to_tsvector('simple', v_clean))) AS lexeme;
  EXCEPTION WHEN OTHERS THEN
    v_prefix_query := NULL;
  END;

  IF v_prefix_query IS NULL THEN
    BEGIN
      v_prefix_query := plainto_tsquery('simple', v_clean);
    EXCEPTION WHEN OTHERS THEN
      v_prefix_query := NULL;
    END;
  END IF;

  -- 3. Tier 1: Primary Index-Backed Search (FTS via GIN + Category/Location Junctions)
  -- Pure indexed search; does not perform broad sequential scans on news content
  RETURN QUERY
  SELECT n.*
  FROM public.news n
  WHERE n.status = 'published'
    AND (
      -- A. Full-text search match via GIN index on news.fts (supports whole words and prefixes)
      (v_prefix_query IS NOT NULL AND v_prefix_query != ''::tsquery AND n.fts @@ v_prefix_query)
      -- B. Category name, english_name, or slug match via junction table
      OR EXISTS (
        SELECT 1
        FROM public.news_categories nc
        JOIN public.categories c ON c.id = nc.category_id
        WHERE nc.news_id = n.id
          AND (
            c.name ILIKE v_clean || '%'
            OR c.english_name ILIKE v_clean || '%'
            OR c.slug ILIKE v_clean || '%'
          )
      )
      -- C. Location name, english_name, or slug match via junction table
      OR EXISTS (
        SELECT 1
        FROM public.news_locations nl
        JOIN public.locations l ON l.id = nl.location_id
        WHERE nl.news_id = n.id
          AND (
            l.name ILIKE v_clean || '%'
            OR l.english_name ILIKE v_clean || '%'
            OR l.slug ILIKE v_clean || '%'
          )
      )
    )
  ORDER BY
    -- Prioritize FTS relevance rank if query matched FTS
    CASE WHEN v_prefix_query IS NOT NULL AND v_prefix_query != ''::tsquery AND n.fts @@ v_prefix_query
      THEN ts_rank_cd(n.fts, v_prefix_query)
      ELSE 0
    END DESC,
    n.published_at DESC
  LIMIT COALESCE(p_limit, 25);

  -- 4. Tier 2: Controlled Fallback (ONLY if Tier 1 produced 0 rows)
  -- Checks title and short_summary only (avoids scanning large content bodies)
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT n.*
    FROM public.news n
    WHERE n.status = 'published'
      AND (
        n.title ILIKE '%' || v_clean || '%'
        OR n.short_summary ILIKE '%' || v_clean || '%'
      )
    ORDER BY n.published_at DESC
    LIMIT COALESCE(p_limit, 25);
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.search_published_news(text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_published_news(text, int) TO anon, authenticated;

-- ==============================================================================
-- 12. ADMIN USER MANAGEMENT RPC
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  p_user_id uuid,
  p_new_role public.user_role
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id uuid;
  v_caller_role public.user_role;
  v_updated_row record;
BEGIN
  -- 1. Verify caller authentication
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: You must be logged in to change user roles'
      USING ERRCODE = '42501';
  END IF;

  -- 2. Verify caller role is strictly 'admin' in public.profiles
  SELECT role INTO v_caller_role
  FROM public.profiles
  WHERE id = v_caller_id;

  IF v_caller_role IS NULL OR v_caller_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Only administrators can assign user roles'
      USING ERRCODE = '42501';
  END IF;

  -- 3. Prevent self-demotion
  IF p_user_id = v_caller_id AND p_new_role != 'admin' THEN
    RAISE EXCEPTION 'Action rejected: Administrators cannot demote themselves'
      USING ERRCODE = '42501';
  END IF;

  -- 4. Verify target user exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Target user not found'
      USING ERRCODE = 'P0002';
  END IF;

  -- 5. Update strictly role and updated_at
  UPDATE public.profiles
  SET
    role = p_new_role,
    updated_at = now()
  WHERE id = p_user_id
  RETURNING id, full_name, role, updated_at INTO v_updated_row;

  -- 6. Return safe JSON result
  RETURN jsonb_build_object(
    'id', v_updated_row.id,
    'full_name', v_updated_row.full_name,
    'role', v_updated_row.role,
    'updated_at', v_updated_row.updated_at
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_user_role(uuid, public.user_role) FROM public;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_role(uuid, public.user_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, public.user_role) TO authenticated;

-- ==============================================================================
-- 13. ACCOUNT DELETION RPC
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_role public.user_role;
  v_admin_count int;
  v_pending_count int;
  v_retained_sub_count int;
  v_comment_count int;
  v_pending_media_urls jsonb := '[]'::jsonb;
  v_avatar_prefix text;
BEGIN
  -- 1. Security Check: Caller must be authenticated
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: You must be logged in to delete your account'
      USING ERRCODE = '42501'; -- insufficient_privilege
  END IF;

  -- 2. Security Check: Prevent sole administrator deletion to avoid system lockout
  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_role = 'admin' THEN
    SELECT count(*) INTO v_admin_count
    FROM public.profiles
    WHERE role = 'admin';

    IF v_admin_count <= 1 THEN
      RAISE EXCEPTION 'Action rejected: Cannot delete the sole administrator account. Another administrator must exist before this account can be deleted.'
        USING ERRCODE = '42501'; -- insufficient_privilege
    END IF;
  END IF;

  -- 3. Before deleting pending submissions, collect their media URLs
  -- Only collect non-empty URLs belonging strictly to pending submissions owned by auth.uid()
  -- (Approved submission media and news media are retained to protect published stories)
  SELECT COALESCE(
    jsonb_agg(DISTINCT url),
    '[]'::jsonb
  ) INTO v_pending_media_urls
  FROM (
    SELECT image_url AS url
    FROM public.submissions
    WHERE user_id = v_user_id
      AND status = 'pending'
      AND image_url IS NOT NULL
      AND trim(image_url) != ''
    UNION ALL
    SELECT audio_url AS url
    FROM public.submissions
    WHERE user_id = v_user_id
      AND status = 'pending'
      AND audio_url IS NOT NULL
      AND trim(audio_url) != ''
    UNION ALL
    SELECT video_url AS url
    FROM public.submissions
    WHERE user_id = v_user_id
      AND status = 'pending'
      AND video_url IS NOT NULL
      AND trim(video_url) != ''
  ) sub_urls;

  -- 4. Prepare avatar folder prefix for client-side / background best-effort cleanup
  v_avatar_prefix := 'avatars/' || v_user_id::text;

  -- 5. Automatically withdraw and delete pending submissions belonging to this user
  -- (Approved submissions with published news and rejected historical submissions are retained)
  DELETE FROM public.submissions
  WHERE user_id = v_user_id
    AND status = 'pending';
  GET DIAGNOSTICS v_pending_count = ROW_COUNT;

  -- 6. Anonymize retained historical submissions (approved and rejected)
  -- Strips personal information (reporter_name and reporter_phone)
  UPDATE public.submissions
  SET
    reporter_name = 'రచ్చబండ పౌరుడు',
    reporter_phone = NULL,
    updated_at = now()
  WHERE user_id = v_user_id;
  GET DIAGNOSTICS v_retained_sub_count = ROW_COUNT;

  -- 7. Anonymize user comments
  -- Keeps comment text intact for article discussion continuity, but anonymizes author name
  UPDATE public.comments
  SET
    user_name = 'రచ్చబండ పాఠకుడు'
  WHERE user_id = v_user_id;
  GET DIAGNOSTICS v_comment_count = ROW_COUNT;

  -- 8. Delete from auth.users
  -- Foreign key cascades will automatically:
  --   a) Delete public.profiles row (CASCADE)
  --   b) Delete public.reactions rows (CASCADE)
  --   c) Delete public.bookmarks rows (CASCADE)
  --   d) Delete public.follows rows (CASCADE)
  --   e) Delete public.notifications rows (CASCADE)
  --   f) Set public.news.author_id to NULL (SET NULL)
  --   g) Set public.submissions.user_id to NULL (SET NULL)
  --   h) Set public.comments.user_id to NULL (SET NULL)
  --   i) Set public.content_reports.reporter_id to NULL (SET NULL, handled by trg_protect_content_report_fields)
  DELETE FROM auth.users
  WHERE id = v_user_id;

  -- 9. Return summary result
  RETURN jsonb_build_object(
    'success', true,
    'deleted_user_id', v_user_id,
    'pending_media_urls', v_pending_media_urls,
    'avatar_prefix', v_avatar_prefix,
    'withdrawn_pending_submissions', v_pending_count,
    'anonymized_submissions', v_retained_sub_count,
    'anonymized_comments', v_comment_count
  );
END;
$$;

-- Revoke all permissions from public and anonymous users
REVOKE ALL ON FUNCTION public.delete_own_account() FROM public;
REVOKE ALL ON FUNCTION public.delete_own_account() FROM anon;

-- Grant execution strictly to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;

-- ==============================================================================
-- 14. PENDING SUBMISSION MANAGEMENT RPCs (#8F)
-- ==============================================================================

-- 14.1 Withdraw Own Pending Submission
CREATE OR REPLACE FUNCTION public.withdraw_own_submission(
  p_submission_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_submission record;
  v_media_urls jsonb := '[]'::jsonb;
BEGIN
  -- 1. Security Check: Caller must be authenticated
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: You must be logged in to withdraw a submission'
      USING ERRCODE = '42501'; -- insufficient_privilege
  END IF;

  -- 2. Lock & Retrieve Submission (Row-level lock to prevent concurrent review/approval race conditions)
  SELECT *
  INTO v_submission
  FROM public.submissions
  WHERE id = p_submission_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission with id % not found', p_submission_id
      USING ERRCODE = 'P0002'; -- no_data_found
  END IF;

  -- 3. Security Check: Caller must be the genuine author/owner of the submission
  IF v_submission.user_id IS NULL OR v_submission.user_id != v_user_id THEN
    RAISE EXCEPTION 'Access denied: You can only withdraw your own submissions'
      USING ERRCODE = '42501'; -- insufficient_privilege
  END IF;

  -- 4. Status Check: Only pending submissions can be withdrawn
  IF v_submission.status != 'pending' THEN
    RAISE EXCEPTION 'Action rejected: Only pending submissions can be withdrawn. Current status is % (id: %)',
      v_submission.status, p_submission_id
      USING ERRCODE = '22023'; -- invalid_parameter_value
  END IF;

  -- 5. Collect media URLs BEFORE deleting the row
  SELECT COALESCE(
    jsonb_agg(DISTINCT url),
    '[]'::jsonb
  ) INTO v_media_urls
  FROM (
    SELECT v_submission.image_url AS url
    WHERE v_submission.image_url IS NOT NULL AND trim(v_submission.image_url) != ''
    UNION ALL
    SELECT v_submission.audio_url AS url
    WHERE v_submission.audio_url IS NOT NULL AND trim(v_submission.audio_url) != ''
    UNION ALL
    SELECT v_submission.video_url AS url
    WHERE v_submission.video_url IS NOT NULL AND trim(v_submission.video_url) != ''
  ) sub_urls;

  -- 6. Atomically delete the pending submission row
  DELETE FROM public.submissions
  WHERE id = p_submission_id
    AND user_id = v_user_id
    AND status = 'pending';

  -- 7. Return confirmation with collected media URLs for cleanup
  RETURN jsonb_build_object(
    'success', true,
    'submission_id', p_submission_id,
    'media_urls', v_media_urls
  );
END;
$$;

REVOKE ALL ON FUNCTION public.withdraw_own_submission(uuid) FROM public;
REVOKE ALL ON FUNCTION public.withdraw_own_submission(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.withdraw_own_submission(uuid) TO authenticated;

-- 14.2 Hardened Atomic Submission Rejection RPC
CREATE OR REPLACE FUNCTION public.reject_submission(
  p_submission_id uuid,
  p_reason text,
  p_reviewer_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_caller_id uuid;
  v_reviewer_id uuid;
  v_reason text;
  v_submission record;
  v_media_urls jsonb := '[]'::jsonb;
BEGIN
  -- 1. Security Check: Caller must be authenticated
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: You must be logged in to reject submissions'
      USING ERRCODE = '42501'; -- insufficient_privilege
  END IF;

  -- 2. Security Check: Caller must be an admin or editor
  IF NOT public.is_admin_or_editor() THEN
    RAISE EXCEPTION 'Access denied: Only administrators and editors can reject submissions'
      USING ERRCODE = '42501'; -- insufficient_privilege
  END IF;

  -- 3. Reviewer Identity Verification
  v_reviewer_id := v_caller_id;
  IF p_reviewer_id IS NOT NULL AND p_reviewer_id != v_caller_id THEN
    RAISE EXCEPTION 'Security violation: Reviewer ID (%) does not match authenticated caller (%)',
      p_reviewer_id, v_caller_id
      USING ERRCODE = '42501'; -- insufficient_privilege
  END IF;

  -- 4. Reason Validation
  v_reason := trim(p_reason);
  IF v_reason IS NULL OR v_reason = '' THEN
    RAISE EXCEPTION 'Rejection reason is required. Please provide a clear editorial reason.'
      USING ERRCODE = '22023'; -- invalid_parameter_value
  END IF;

  IF length(v_reason) > 500 THEN
    RAISE EXCEPTION 'Rejection reason exceeds maximum allowed length of 500 characters'
      USING ERRCODE = '22023'; -- invalid_parameter_value
  END IF;

  -- 5. Lock & Retrieve Submission (Row-level lock prevents approve/reject race condition)
  SELECT *
  INTO v_submission
  FROM public.submissions
  WHERE id = p_submission_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission with id % not found', p_submission_id
      USING ERRCODE = 'P0002'; -- no_data_found
  END IF;

  -- 6. Verify Submission Status is Pending
  IF v_submission.status != 'pending' THEN
    RAISE EXCEPTION 'Submission is already % (id: %)', v_submission.status, p_submission_id
      USING ERRCODE = '22023'; -- invalid_parameter_value
  END IF;

  -- 7. Collect associated media URLs for post-transaction storage cleanup
  SELECT COALESCE(
    jsonb_agg(DISTINCT url),
    '[]'::jsonb
  ) INTO v_media_urls
  FROM (
    SELECT v_submission.image_url AS url
    WHERE v_submission.image_url IS NOT NULL AND trim(v_submission.image_url) != ''
    UNION ALL
    SELECT v_submission.audio_url AS url
    WHERE v_submission.audio_url IS NOT NULL AND trim(v_submission.audio_url) != ''
    UNION ALL
    SELECT v_submission.video_url AS url
    WHERE v_submission.video_url IS NOT NULL AND trim(v_submission.video_url) != ''
  ) sub_urls;

  -- 8. Atomically update submission status to rejected
  UPDATE public.submissions
  SET
    status = 'rejected',
    reviewed_by = v_reviewer_id,
    reviewed_at = now(),
    rejection_reason = v_reason,
    updated_at = now()
  WHERE id = p_submission_id;

  -- 9. Return confirmation with collected media URLs and status details
  RETURN jsonb_build_object(
    'success', true,
    'submission_id', p_submission_id,
    'status', 'rejected',
    'rejection_reason', v_reason,
    'reviewed_by', v_reviewer_id,
    'reviewed_at', now(),
    'media_urls', v_media_urls
  );
END;
$$;

REVOKE ALL ON FUNCTION public.reject_submission(uuid, text, uuid) FROM public;
REVOKE ALL ON FUNCTION public.reject_submission(uuid, text, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.reject_submission(uuid, text, uuid) TO authenticated;

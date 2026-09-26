-- ==============================================================================
-- Migration: 20260925000003_search_fts.sql
-- Description: Implements PostgreSQL Full-Text Search (FTS) with GIN index on
--              public.news and adds a two-tiered, index-accelerated search RPC.
-- ==============================================================================

-- 1. Add generated tsvector column for FTS on public.news
-- Weighted text representation:
-- 'A' -> title (headline priority)
-- 'B' -> short_summary (lead paragraph priority)
-- 'C' -> content (body text priority)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'news'
      AND column_name = 'fts'
  ) THEN
    ALTER TABLE public.news
    ADD COLUMN fts tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('simple', coalesce(short_summary, '')), 'B') ||
      setweight(to_tsvector('simple', coalesce(content, '')), 'C')
    ) STORED;
  END IF;
END $$;

-- 2. Create GIN index on news.fts for high-efficiency indexed scanning
CREATE INDEX IF NOT EXISTS idx_news_fts ON public.news USING gin(fts);

-- 3. Create supporting indexes on junction tables for reverse lookup optimization
CREATE INDEX IF NOT EXISTS idx_news_categories_cat ON public.news_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_news_locations_loc ON public.news_locations(location_id);

-- 4. Create two-tiered search_published_news RPC
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

-- 5. Revoke from PUBLIC and grant to anon and authenticated roles
REVOKE EXECUTE ON FUNCTION public.search_published_news(text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_published_news(text, int) TO anon, authenticated;

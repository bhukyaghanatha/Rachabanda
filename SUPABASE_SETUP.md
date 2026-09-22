# Rachabanda (రచ్చ బండ) — Supabase Backend Setup Guide

This guide walks you through connecting your Rachabanda Telugu News Application to a live Supabase backend.

---

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in or create a free account.
2. Click **New Project**.
3. Fill in:
   - **Name**: `rachabanda-news`
   - **Database Password**: Choose a strong password and save it safely.
   - **Region**: Choose `South Asia (Mumbai) - ap-south-1` for lowest latency in India.
4. Click **Create new project** and wait 1–2 minutes for provisioning to finish.

---

## 2. Obtain Your API Credentials

1. In your Supabase project dashboard, navigate to:
   **Project Settings** (gear icon on bottom left) ➔ **API**.
2. Locate the following two values under **Project API keys**:
   - **Project URL** (e.g., `https://xyzcompany.supabase.co`)
   - **anon / public key** (a long token starting with `eyJ...`)

---

## 3. Configure Local Environment Variables

1. In the project root, copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` in your editor:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. Replace the placeholder values with your real URL and anon key.
4. Note: `.env.local` is already included in `.gitignore` and will never be committed to Git.

---

## 4. Run Database Schema Migrations

You can run the schema migration in either of two ways:

### Option A: Via the Supabase Web Dashboard (Easiest & Fastest)
1. Open your Supabase Dashboard.
2. Go to **SQL Editor** (icon on left sidebar).
3. Click **New query**.
4. Open [supabase/schema.sql](file:///C:/Users/DELL/Desktop/Rachabanda_app/supabase/schema.sql) in this repository, copy the entire file content, paste it into the editor, and click **Run**.

### Option B: Via Supabase CLI
```bash
npx supabase db push
# OR
npx supabase migration up
```

---

## 5. Tables & Entities Created

The migration creates a relational schema for local and regional news:

| Table | Purpose |
|---|---|
| `profiles` | Extended user profile linked to Supabase `auth.users`, storing `full_name`, `phone`, `role`, `avatar_url`, and location. |
| `categories` | News categories in Telugu & English (రాజకీయం, స్థానిక, నేరాలు, క్రీడలు, సినిమా, జాతీయం, వ్యాపారం, భక్తి). |
| `locations` | Hierarchical locations (`country` ➔ `state` ➔ `district` ➔ `mandal` ➔ `village`) supporting Telangana districts & mandals. |
| `news` | Core news items with 60-word summaries, full text, status (`draft`, `pending`, `approved`, `published`, `rejected`, `archived`), audio duration, and fact-checking flags. |
| `news_media` | Media attachments (images, video links, studio audio narration). |
| `news_categories` | Many-to-many relationship connecting articles to categories. |
| `news_locations` | Many-to-many relationship connecting articles to specific districts/mandals/villages. |
| `submissions` | Citizen reporter submissions with review workflow (`pending` ➔ `approved` / `rejected`). |
| `comments` | User comments with moderation flags and likes count. |
| `reactions` | User reactions (like, love, support, etc.) with unique constraints per user per article. |
| `bookmarks` | Saved news bookmarks linked to user profiles. |
| `follows` | User followed categories and followed locations. |
| `notifications` | User alerts for breaking news and submission review decisions. |

---

## 6. Row Level Security (RLS) Policies

All tables have Row Level Security enabled:
- **Public Readers:** Can view all `published` news, public categories, locations, and approved comments.
- **Ordinary Users:** Cannot directly publish news articles. Submissions must go through `pending` status.
- **Citizen Reporters:** Can create new submissions and view the status of their own submissions only.
- **Admins & Editors:** Protected by `is_admin_or_editor()` database function with full moderation privileges.
- **Profiles:** Users can only modify their own profile data (`auth.uid() = id`).

---

## 7. What Still Requires Supabase Credentials

1. **Live database queries:** Testing live fetches, writes, and real-time updates requires adding real `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env.local`.
2. **Google OAuth login:** Setting up Google Login requires configuring OAuth Client ID and Secret in Supabase Dashboard ➔ Authentication ➔ Providers.
3. **Storage buckets:** Creating public storage buckets (`news-media`, `submissions`) for media uploads.

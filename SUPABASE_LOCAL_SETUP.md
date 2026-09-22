# Rachabanda (రచ్చ బండ) — Local Supabase Setup & Verification

This guide explains how to configure and verify your local Supabase connection for the Rachabanda Telugu News Platform.

---

## 1. Where Do the Supabase URL and Anon Key Go?

Your Supabase credentials belong exclusively in `.env.local` at the root of the project:

```
C:\Users\DELL\Desktop\Rachabanda_app\.env.local
```

Open `.env.local` and enter your values:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Finding These in Supabase:
1. Log in to [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Select your project.
3. Click the **Project Settings** gear icon in the left sidebar.
4. Click **API** under Configuration.
5. Copy:
   - **Project URL** ➔ Paste into `VITE_SUPABASE_URL`
   - **Project API keys: `anon` `public`** ➔ Paste into `VITE_SUPABASE_ANON_KEY`

---

## 2. Which Values Must NEVER Be Committed?

> [!CAUTION]
> - **`.env.local`** must **NEVER** be committed to Git.
> - Any **`service_role`** key must **NEVER** be used in this frontend application or placed in `.env.local`. Only the public `anon` key is permitted.
> - Git is already configured in `.gitignore` to ignore `.env.local`, `.env`, and all `.env.*.local` files.
> - Only `.env.example` (which contains blank placeholders) should ever be in version control.

---

## 3. How to Verify Your Supabase Configuration

We provide a built-in verification script that checks your configuration without printing or exposing your secret keys:

```bash
npm run check:supabase
```

### Expected Output:
- **When credentials are missing or empty:**
  The script reports clearly that `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` are not yet configured, and instructs you how to set them. The app continues to build and run safely using mock data.
- **When valid credentials are provided:**
  The script confirms that both URL and key are detected, checks URL formatting, and reports a successful configuration check.

---

## 4. How to Run the Database Schema

1. Go to your Supabase Dashboard.
2. Click **SQL Editor** in the left sidebar.
3. Click **New query**.
4. Open the local file `supabase/schema.sql`.
5. Copy the entire content, paste it into the Supabase SQL editor, and click **Run**.
6. All 13 tables, enums, triggers, RLS security policies, and initial Telangana seed data will be created.

---

## 5. How to Start the Application

Once configured:

```bash
# Start the local development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

- If Supabase credentials are configured, the Supabase client (`src/lib/supabase.ts`) connects to your live backend.
- If credentials are not yet configured, the app gracefully falls back to the existing mock news and citizen submission workflow with zero crashes.

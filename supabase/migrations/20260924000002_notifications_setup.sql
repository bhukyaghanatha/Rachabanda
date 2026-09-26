-- ==============================================================================
-- Migration: 20260924000002_notifications_setup.sql
-- Description: Sets up public.notifications indexes, RLS policies, and triggers
-- ==============================================================================

-- 1. Notifications Table Definition (reference)
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

-- 2. Indexes for High Performance Queries
CREATE INDEX IF NOT EXISTS idx_notifications_user 
  ON public.notifications(user_id, is_read, created_at DESC);

-- 3. Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3.1 Users can manage (select, update, delete) their own notifications
DROP POLICY IF EXISTS "Users can read their own notifications" ON public.notifications;
CREATE POLICY "Users can read their own notifications" 
  ON public.notifications FOR ALL 
  USING (auth.uid() = user_id);

-- 3.2 Admins and editors can insert notifications for users (e.g. on approval/rejection)
DROP POLICY IF EXISTS "Admins and editors can insert notifications" ON public.notifications;
CREATE POLICY "Admins and editors can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR public.is_admin_or_editor()
  );

-- 4. Server-Side Submission Review Notification Trigger
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

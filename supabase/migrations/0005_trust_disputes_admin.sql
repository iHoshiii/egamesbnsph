-- Enable Row Level Security on Phase 5 tables
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check ADMIN role
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'ADMIN'
  );
$$;

-- Reviews: public read, reviewer insert
DROP POLICY IF EXISTS "reviews_select_public" ON public.reviews;
CREATE POLICY "reviews_select_public" ON public.reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;
CREATE POLICY "reviews_insert_own" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Disputes, evidence, resolutions: visible to transaction participants or admins
DROP POLICY IF EXISTS "disputes_select_participant_or_admin" ON public.disputes;
CREATE POLICY "disputes_select_participant_or_admin" ON public.disputes
  FOR SELECT USING (
    public.is_transaction_participant(transaction_id) OR public.is_admin_user()
  );

DROP POLICY IF EXISTS "dispute_evidence_select_participant_or_admin" ON public.dispute_evidence;
CREATE POLICY "dispute_evidence_select_participant_or_admin" ON public.dispute_evidence
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.disputes d
      WHERE d.id = dispute_id
        AND (public.is_transaction_participant(d.transaction_id) OR public.is_admin_user())
    )
  );

DROP POLICY IF EXISTS "dispute_resolutions_select_participant_or_admin" ON public.dispute_resolutions;
CREATE POLICY "dispute_resolutions_select_participant_or_admin" ON public.dispute_resolutions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.disputes d
      WHERE d.id = dispute_id
        AND (public.is_transaction_participant(d.transaction_id) OR public.is_admin_user())
    )
  );

-- Reports: reporter can insert and read own; admins read all
DROP POLICY IF EXISTS "reports_insert_own" ON public.reports;
CREATE POLICY "reports_insert_own" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "reports_select_own_or_admin" ON public.reports;
CREATE POLICY "reports_select_own_or_admin" ON public.reports
  FOR SELECT USING (auth.uid() = reporter_id OR public.is_admin_user());

-- Notifications: owner read and update
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Audit logs: admin read only
DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.audit_logs;
CREATE POLICY "audit_logs_select_admin" ON public.audit_logs
  FOR SELECT USING (public.is_admin_user());

-- Private storage bucket for dispute evidence (max 5 MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'private-disputes',
  'private-disputes',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "private_disputes_upload_own" ON storage.objects;
CREATE POLICY "private_disputes_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'private-disputes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "private_disputes_read_own" ON storage.objects;
CREATE POLICY "private_disputes_read_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'private-disputes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

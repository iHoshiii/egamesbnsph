-- Enable Row Level Security on Phase 4 tables
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_verifications ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user participates in a transaction
CREATE OR REPLACE FUNCTION public.is_transaction_participant(p_transaction_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.transactions t
    LEFT JOIN public.midman_profiles mp ON mp.id = t.midman_profile_id
    WHERE t.id = p_transaction_id
      AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid() OR mp.user_id = auth.uid())
  );
$$;

-- Transactions: visible only to buyer, seller, or assigned midman
DROP POLICY IF EXISTS "transactions_select_participant" ON public.transactions;
CREATE POLICY "transactions_select_participant" ON public.transactions
  FOR SELECT USING (public.is_transaction_participant(id));

-- Transaction agreements: visible to participants
DROP POLICY IF EXISTS "transaction_agreements_select_participant" ON public.transaction_agreements;
CREATE POLICY "transaction_agreements_select_participant" ON public.transaction_agreements
  FOR SELECT USING (public.is_transaction_participant(transaction_id));

-- Transaction queue: visible to participants
DROP POLICY IF EXISTS "transaction_queue_select_participant" ON public.transaction_queue;
CREATE POLICY "transaction_queue_select_participant" ON public.transaction_queue
  FOR SELECT USING (public.is_transaction_participant(transaction_id));

-- Transaction events: visible to participants
DROP POLICY IF EXISTS "transaction_events_select_participant" ON public.transaction_events;
CREATE POLICY "transaction_events_select_participant" ON public.transaction_events
  FOR SELECT USING (public.is_transaction_participant(transaction_id));

-- Payments: visible to participants
DROP POLICY IF EXISTS "payments_select_participant" ON public.payments;
CREATE POLICY "payments_select_participant" ON public.payments
  FOR SELECT USING (public.is_transaction_participant(transaction_id));

-- Payment receipts: visible to participants
DROP POLICY IF EXISTS "payment_receipts_select_participant" ON public.payment_receipts;
CREATE POLICY "payment_receipts_select_participant" ON public.payment_receipts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.payments p
      WHERE p.id = payment_id AND public.is_transaction_participant(p.transaction_id)
    )
  );

-- Payment verifications: visible to participants
DROP POLICY IF EXISTS "payment_verifications_select_participant" ON public.payment_verifications;
CREATE POLICY "payment_verifications_select_participant" ON public.payment_verifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.payments p
      WHERE p.id = payment_id AND public.is_transaction_participant(p.transaction_id)
    )
  );

-- Private storage bucket for payment receipts (max 5 MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'private-payments',
  'private-payments',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "private_payments_upload_buyer" ON storage.objects;
CREATE POLICY "private_payments_upload_buyer" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'private-payments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "private_payments_read_own" ON storage.objects;
CREATE POLICY "private_payments_read_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'private-payments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Enable Supabase Realtime on transaction tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'transaction_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transaction_events;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'payments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
  END IF;
END $$;

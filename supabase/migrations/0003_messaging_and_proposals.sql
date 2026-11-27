-- Enable Row Level Security on Phase 3 tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_proposals ENABLE ROW LEVEL SECURITY;

-- Conversations: visible only to members
DROP POLICY IF EXISTS "conversations_select_member" ON public.conversations;
CREATE POLICY "conversations_select_member" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = id AND cm.user_id = auth.uid()
    )
  );

-- Conversation members: visible to members of the same conversation
DROP POLICY IF EXISTS "conversation_members_select_member" ON public.conversation_members;
CREATE POLICY "conversation_members_select_member" ON public.conversation_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversation_id AND cm.user_id = auth.uid()
    )
  );

-- Messages: members can read and insert their own messages
DROP POLICY IF EXISTS "messages_select_member" ON public.messages;
CREATE POLICY "messages_select_member" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversation_id AND cm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "messages_insert_member" ON public.messages;
CREATE POLICY "messages_insert_member" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversation_id AND cm.user_id = auth.uid()
    )
  );

-- Message attachments: visible to conversation members
DROP POLICY IF EXISTS "message_attachments_select_member" ON public.message_attachments;
CREATE POLICY "message_attachments_select_member" ON public.message_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE m.id = message_id AND cm.user_id = auth.uid()
    )
  );

-- Message reads: members can read and mark own reads
DROP POLICY IF EXISTS "message_reads_select_member" ON public.message_reads;
CREATE POLICY "message_reads_select_member" ON public.message_reads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE m.id = message_id AND cm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "message_reads_insert_own" ON public.message_reads;
CREATE POLICY "message_reads_insert_own" ON public.message_reads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Transaction proposals: visible only to buyer or seller
DROP POLICY IF EXISTS "transaction_proposals_select_participant" ON public.transaction_proposals;
CREATE POLICY "transaction_proposals_select_participant" ON public.transaction_proposals
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Enable Supabase Realtime for live chat messages and midman proposals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'transaction_proposals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transaction_proposals;
  END IF;
END $$;

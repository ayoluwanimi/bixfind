ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_participant_read" ON public.conversations;
CREATE POLICY "conversations_participant_read" ON public.conversations FOR SELECT USING (
    auth.uid() = customer_id OR auth.uid() = provider_id
);

DROP POLICY IF EXISTS "conversations_participant_insert" ON public.conversations;
CREATE POLICY "conversations_participant_insert" ON public.conversations FOR INSERT WITH CHECK (
    auth.uid() = customer_id
);

DROP POLICY IF EXISTS "conversations_participant_update" ON public.conversations;
CREATE POLICY "conversations_participant_update" ON public.conversations FOR UPDATE USING (
    auth.uid() = customer_id OR auth.uid() = provider_id
);

DROP POLICY IF EXISTS "messages_participant_all" ON public.messages;
CREATE POLICY "messages_participant_all" ON public.messages FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_id
        AND (auth.uid() = c.customer_id OR auth.uid() = c.provider_id)
    )
);

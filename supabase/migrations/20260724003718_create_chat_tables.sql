CREATE TABLE IF NOT EXISTS public.conversations (
    id                  uuid primary key default gen_random_uuid(),
    customer_id         uuid not null references public.profiles(id) on delete cascade,
    provider_id         uuid not null references public.providers(id) on delete cascade,
    booking_id          uuid,
    last_message_at     timestamptz,
    last_message_body   text,
    unread_customer     integer not null default 0,
    unread_provider     integer not null default 0,
    metadata            jsonb default '{}'::jsonb,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_unique ON public.conversations(customer_id, provider_id, coalesce(booking_id, '00000000-0000-0000-0000-000000000000'));
CREATE INDEX IF NOT EXISTS idx_conversations_customer ON public.conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_provider ON public.conversations(provider_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON public.conversations(last_message_at desc);

CREATE TABLE IF NOT EXISTS public.messages (
    id              uuid primary key default gen_random_uuid(),
    conversation_id uuid not null references public.conversations(id) on delete cascade,
    sender_id       uuid not null references public.profiles(id) on delete cascade,
    body            text not null,
    message_type    text default 'text',
    media_urls      text[] default '{}',
    is_read         boolean not null default false,
    read_at         timestamptz,
    metadata        jsonb default '{}'::jsonb,
    created_at      timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);

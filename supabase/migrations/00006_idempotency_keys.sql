-- 00006_idempotency_keys.sql
-- Bixfind: Idempotency keys for payment operations

create table public.idempotency_keys (
    key         text primary key,
    response    jsonb not null,
    expires_at  timestamptz not null,
    created_at  timestamptz not null default now()
);

create index idx_idempotency_keys_expires on public.idempotency_keys(expires_at);

alter table public.idempotency_keys enable row level security;

create policy "idempotency_keys_system_all"
    on public.idempotency_keys
    for all
    using (public.get_current_role() = 'ADMIN')
    with check (public.get_current_role() = 'ADMIN');

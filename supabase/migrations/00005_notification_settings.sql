-- 00005_notification_settings.sql
-- Bixfind: Notification preferences table

create table public.notification_settings (
    id              uuid primary key default gen_random_uuid(),
    profile_id      uuid not null references public.profiles(id) on delete cascade unique,
    preferences     jsonb not null default '[
        {"type":"BOOKING_NEW","in_app":true,"push":true,"email":true},
        {"type":"BOOKING_UPDATE","in_app":true,"push":true,"email":true},
        {"type":"MESSAGE","in_app":true,"push":true,"email":false},
        {"type":"REVIEW","in_app":true,"push":true,"email":false},
        {"type":"PAYOUT","in_app":true,"push":true,"email":true},
        {"type":"SYSTEM","in_app":true,"push":false,"email":false},
        {"type":"LOW_STOCK","in_app":true,"push":true,"email":false}
    ]'::jsonb,
    push_enabled    boolean not null default true,
    email_enabled   boolean not null default true,
    quiet_hours_start time,
    quiet_hours_end   time,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

alter table public.notification_settings enable row level security;

create policy "notification_settings_owner_all"
    on public.notification_settings
    for all
    using (profile_id = auth.uid())
    with check (profile_id = auth.uid());

create trigger trg_notification_settings_updated_at
    before update on public.notification_settings
    for each row execute function public.set_updated_at();

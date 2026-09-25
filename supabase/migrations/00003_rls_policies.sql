-- 00003_rls_policies.sql
-- Bixfind: Row Level Security policies for all tables

-- ──────────────────────────────────────────────
-- HELPER: Get current user's role from profiles
-- ──────────────────────────────────────────────
create or replace function public.get_current_role()
returns public."role" as $$
    select role from public.profiles where id = auth.uid()
$$ language sql stable security definer;

-- ──────────────────────────────────────────────
-- PROFILES
-- ──────────────────────────────────────────────
alter table public.profiles enable row level security;

create policy "profiles_self_all"
    on public.profiles
    for all
    using (id = auth.uid())
    with check (id = auth.uid());

create policy "profiles_admin_read_all"
    on public.profiles
    for select
    using (public.get_current_role() = 'ADMIN');

create policy "profiles_admin_write"
    on public.profiles
    for update
    using (public.get_current_role() = 'ADMIN')
    with check (public.get_current_role() = 'ADMIN');

-- ──────────────────────────────────────────────
-- PROVIDERS
-- ──────────────────────────────────────────────
alter table public.providers enable row level security;

create policy "providers_public_read"
    on public.providers
    for select
    using (true);

create policy "provider_owner_write"
    on public.providers
    for all
    using (id = auth.uid())
    with check (id = auth.uid());

create policy "providers_admin_all"
    on public.providers
    for all
    using (public.get_current_role() = 'ADMIN')
    with check (public.get_current_role() = 'ADMIN');

-- ──────────────────────────────────────────────
-- SERVICES
-- ──────────────────────────────────────────────
alter table public.services enable row level security;

create policy "services_public_read"
    on public.services
    for select
    using (
        is_published = true and is_approved = true
        or provider_id = auth.uid()
        or public.get_current_role() = 'ADMIN'
    );

create policy "services_provider_write"
    on public.services
    for all
    using (provider_id = auth.uid())
    with check (provider_id = auth.uid());

create policy "services_admin_all"
    on public.services
    for all
    using (public.get_current_role() = 'ADMIN')
    with check (public.get_current_role() = 'ADMIN');

-- ──────────────────────────────────────────────
-- PRODUCTS
-- ──────────────────────────────────────────────
alter table public.products enable row level security;

create policy "products_public_read"
    on public.products
    for select
    using (
        is_published = true and is_approved = true
        or provider_id = auth.uid()
        or public.get_current_role() = 'ADMIN'
    );

create policy "products_provider_write"
    on public.products
    for all
    using (provider_id = auth.uid())
    with check (provider_id = auth.uid());

create policy "products_admin_all"
    on public.products
    for all
    using (public.get_current_role() = 'ADMIN')
    with check (public.get_current_role() = 'ADMIN');

-- ──────────────────────────────────────────────
-- INVENTORY ITEMS
-- ──────────────────────────────────────────────
alter table public.inventory_items enable row level security;

create policy "inventory_provider_read"
    on public.inventory_items
    for select
    using (provider_id = auth.uid() or public.get_current_role() = 'ADMIN');

create policy "inventory_provider_write"
    on public.inventory_items
    for all
    using (provider_id = auth.uid())
    with check (provider_id = auth.uid());

-- ──────────────────────────────────────────────
-- INVENTORY MOVEMENTS
-- ──────────────────────────────────────────────
alter table public.inventory_movements enable row level security;

create policy "inv_movement_provider_read"
    on public.inventory_movements
    for select
    using (provider_id = auth.uid() or public.get_current_role() = 'ADMIN');

create policy "inv_movement_admin_all"
    on public.inventory_movements
    for all
    using (public.get_current_role() = 'ADMIN')
    with check (public.get_current_role() = 'ADMIN');

-- ──────────────────────────────────────────────
-- BOOKINGS
-- ──────────────────────────────────────────────
alter table public.bookings enable row level security;

create policy "bookings_party_read"
    on public.bookings
    for select
    using (
        customer_id = auth.uid()
        or provider_id = auth.uid()
        or public.get_current_role() = 'ADMIN'
    );

create policy "bookings_customer_insert"
    on public.bookings
    for insert
    with check (customer_id = auth.uid());

create policy "bookings_customer_update"
    on public.bookings
    for update
    using (customer_id = auth.uid())
    with check (customer_id = auth.uid());

create policy "bookings_provider_update"
    on public.bookings
    for update
    using (provider_id = auth.uid())
    with check (provider_id = auth.uid());

create policy "bookings_admin_all"
    on public.bookings
    for all
    using (public.get_current_role() = 'ADMIN')
    with check (public.get_current_role() = 'ADMIN');

-- ──────────────────────────────────────────────
-- REVIEWS
-- ──────────────────────────────────────────────
alter table public.reviews enable row level security;

create policy "reviews_public_read"
    on public.reviews
    for select
    using (true);

create policy "reviews_booking_reviewer_insert"
    on public.reviews
    for insert
    with check (reviewer_id = auth.uid());

create policy "reviews_provider_respond"
    on public.reviews
    for update
    using (provider_id = auth.uid())
    with check (provider_id = auth.uid());

create policy "reviews_admin_all"
    on public.reviews
    for all
    using (public.get_current_role() = 'ADMIN')
    with check (public.get_current_role() = 'ADMIN');

-- ──────────────────────────────────────────────
-- WALLETS
-- ──────────────────────────────────────────────
alter table public.wallets enable row level security;

create policy "wallet_owner_all"
    on public.wallets
    for all
    using (profile_id = auth.uid())
    with check (profile_id = auth.uid());

create policy "wallet_admin_read"
    on public.wallets
    for select
    using (public.get_current_role() = 'ADMIN');

create policy "wallet_admin_update"
    on public.wallets
    for update
    using (public.get_current_role() = 'ADMIN')
    with check (public.get_current_role() = 'ADMIN');

-- ──────────────────────────────────────────────
-- WALLET ENTRIES
-- ──────────────────────────────────────────────
alter table public.wallet_entries enable row level security;

create policy "wallet_entries_owner_read"
    on public.wallet_entries
    for select
    using (profile_id = auth.uid() or public.get_current_role() = 'ADMIN');

create policy "wallet_entries_system_insert"
    on public.wallet_entries
    for insert
    with check (profile_id = auth.uid() or public.get_current_role() = 'ADMIN');

-- ──────────────────────────────────────────────
-- MINI WEBSITES
-- ──────────────────────────────────────────────
alter table public.mini_websites enable row level security;

create policy "mini_websites_public_read"
    on public.mini_websites
    for select
    using (is_published = true or provider_id = auth.uid() or public.get_current_role() = 'ADMIN');

create policy "mini_websites_provider_write"
    on public.mini_websites
    for all
    using (provider_id = auth.uid())
    with check (provider_id = auth.uid());

create policy "mini_websites_admin_all"
    on public.mini_websites
    for all
    using (public.get_current_role() = 'ADMIN')
    with check (public.get_current_role() = 'ADMIN');

-- ──────────────────────────────────────────────
-- MUSIC TRACKS
-- ──────────────────────────────────────────────
alter table public.music_tracks enable row level security;

create policy "music_tracks_public_read"
    on public.music_tracks
    for select
    using (is_published = true or provider_id = auth.uid() or public.get_current_role() = 'ADMIN');

create policy "music_tracks_provider_write"
    on public.music_tracks
    for all
    using (provider_id = auth.uid())
    with check (provider_id = auth.uid());

-- ──────────────────────────────────────────────
-- HOTEL ROOMS
-- ──────────────────────────────────────────────
alter table public.hotel_rooms enable row level security;

create policy "hotel_rooms_public_read"
    on public.hotel_rooms
    for select
    using (is_available = true or provider_id = auth.uid() or public.get_current_role() = 'ADMIN');

create policy "hotel_rooms_provider_write"
    on public.hotel_rooms
    for all
    using (provider_id = auth.uid())
    with check (provider_id = auth.uid());

-- ──────────────────────────────────────────────
-- HOTEL CHECK-INS
-- ──────────────────────────────────────────────
alter table public.hotel_check_ins enable row level security;

create policy "hotel_checkin_provider_read"
    on public.hotel_check_ins
    for select
    using (
        provider_id = auth.uid()
        or exists (select 1 from public.bookings b where b.id = booking_id and b.customer_id = auth.uid())
        or public.get_current_role() = 'ADMIN'
    );

create policy "hotel_checkin_provider_write"
    on public.hotel_check_ins
    for all
    using (provider_id = auth.uid())
    with check (provider_id = auth.uid());

-- ──────────────────────────────────────────────
-- CONVERSATIONS
-- ──────────────────────────────────────────────
alter table public.conversations enable row level security;

create policy "conversations_participant_read"
    on public.conversations
    for select
    using (
        customer_id = auth.uid()
        or provider_id = auth.uid()
        or public.get_current_role() = 'ADMIN'
    );

create policy "conversations_participant_insert"
    on public.conversations
    for insert
    with check (customer_id = auth.uid() or provider_id = auth.uid());

create policy "conversations_admin_all"
    on public.conversations
    for all
    using (public.get_current_role() = 'ADMIN')
    with check (public.get_current_role() = 'ADMIN');

-- ──────────────────────────────────────────────
-- MESSAGES
-- ──────────────────────────────────────────────
alter table public.messages enable row level security;

create policy "messages_participant_all"
    on public.messages
    for all
    using (
        exists (
            select 1 from public.conversations c
            where c.id = conversation_id
            and (c.customer_id = auth.uid() or c.provider_id = auth.uid())
        )
    )
    with check (
        exists (
            select 1 from public.conversations c
            where c.id = conversation_id
            and (c.customer_id = auth.uid() or c.provider_id = auth.uid())
        )
    );

-- ──────────────────────────────────────────────
-- NOTIFICATIONS
-- ──────────────────────────────────────────────
alter table public.notifications enable row level security;

create policy "notifications_owner_all"
    on public.notifications
    for all
    using (profile_id = auth.uid())
    with check (profile_id = auth.uid());

create policy "notifications_admin_read"
    on public.notifications
    for select
    using (public.get_current_role() = 'ADMIN');

-- ──────────────────────────────────────────────
-- PUSH TOKENS
-- ──────────────────────────────────────────────
alter table public.push_tokens enable row level security;

create policy "push_tokens_owner_all"
    on public.push_tokens
    for all
    using (profile_id = auth.uid())
    with check (profile_id = auth.uid());

-- ──────────────────────────────────────────────
-- CATEGORY SYNONYMS
-- ──────────────────────────────────────────────
alter table public.category_synonyms enable row level security;

create policy "category_synonyms_public_read"
    on public.category_synonyms
    for select
    using (true);

create policy "category_synonyms_admin_write"
    on public.category_synonyms
    for all
    using (public.get_current_role() = 'ADMIN')
    with check (public.get_current_role() = 'ADMIN');

-- ──────────────────────────────────────────────
-- AI INTERACTIONS
-- ──────────────────────────────────────────────
alter table public.ai_interactions enable row level security;

create policy "ai_interactions_owner_read"
    on public.ai_interactions
    for select
    using (profile_id = auth.uid() or public.get_current_role() = 'ADMIN');

create policy "ai_interactions_owner_insert"
    on public.ai_interactions
    for insert
    with check (profile_id = auth.uid());

-- ──────────────────────────────────────────────
-- AUDIT LOGS
-- ──────────────────────────────────────────────
alter table public.audit_logs enable row level security;

create policy "audit_logs_admin_read"
    on public.audit_logs
    for select
    using (public.get_current_role() = 'ADMIN');

create policy "audit_logs_system_insert"
    on public.audit_logs
    for insert
    with check (public.get_current_role() = 'ADMIN');

-- 00001_initial_schema.sql
-- Bixfind: Complete database schema with enums, tables, indexes, and constraints

-- ──────────────────────────────────────────────
-- EXTENSIONS
-- ──────────────────────────────────────────────
create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "pg_stat_statements" with schema extensions;

-- ──────────────────────────────────────────────
-- ENUMS
-- ──────────────────────────────────────────────
create type public."role" as enum ('CUSTOMER', 'PROVIDER', 'ADMIN');
create type public."user_status" as enum ('ACTIVE', 'SUSPENDED', 'DELETED');
create type public."booking_status" as enum ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED');
create type public."escrow_state" as enum ('HELD', 'RELEASED', 'REFUNDED');
create type public."entry_type" as enum ('CREDIT', 'DEBIT', 'HOLD', 'RELEASE', 'REFUND', 'PAYOUT');
create type public."price_type" as enum ('FIXED', 'HOURLY', 'QUOTE');
create type public."provider_tier" as enum ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');
create type public."notification_type" as enum ('BOOKING_NEW', 'BOOKING_UPDATE', 'MESSAGE', 'REVIEW', 'PAYOUT', 'SYSTEM', 'LOW_STOCK');

-- ──────────────────────────────────────────────
-- TABLES
-- ──────────────────────────────────────────────

-- 1. PROFILES (extends auth.users)
create table public.profiles (
    id              uuid primary key references auth.users(id) on delete cascade,
    email           text not null,
    phone           text,
    full_name       text,
    avatar_url      text,
    role            public."role" not null default 'CUSTOMER',
    status          public."user_status" not null default 'ACTIVE',
    is_verified     boolean not null default false,
    metadata        jsonb default '{}'::jsonb,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index idx_profiles_role on public.profiles(role);
create index idx_profiles_status on public.profiles(status);
create index idx_profiles_email on public.profiles(email);

-- 2. PROVIDERS (extends profiles where role=PROVIDER)
create table public.providers (
    id                  uuid primary key references public.profiles(id) on delete cascade,
    business_name       text not null,
    business_email      text,
    business_phone      text,
    description         text,
    address             text,
    city                text,
    state               text,
    country             text default 'Nigeria',
    latitude            numeric(10,7),
    longitude           numeric(10,7),
    logo_url            text,
    cover_image_url     text,
    primary_category    text,
    tags                text[] default '{}',
    tier                public."provider_tier" not null default 'BRONZE',
    is_verified         boolean not null default false,
    is_online           boolean not null default false,
    capabilities_version integer not null default 1,
    commission_rate     numeric(5,2) default 10.00,
    business_hours      jsonb default '{}'::jsonb,
    social_links        jsonb default '{}'::jsonb,
    metadata            jsonb default '{}'::jsonb,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),

    constraint valid_commission check (commission_rate >= 0 and commission_rate <= 100)
);

create index idx_providers_category on public.providers(primary_category);
create index idx_providers_tier on public.providers(tier);
create index idx_providers_location on public.providers(city, state);
create index idx_providers_verified on public.providers(is_verified);

-- 3. SERVICES
create table public.services (
    id              uuid primary key default gen_random_uuid(),
    provider_id     uuid not null references public.providers(id) on delete cascade,
    title           text not null,
    description     text,
    category        text not null,
    subcategory     text,
    price           numeric(12,2) not null default 0,
    price_type      public."price_type" not null default 'FIXED',
    currency        text not null default 'NGN',
    is_published    boolean not null default false,
    is_approved     boolean not null default false,
    images          text[] default '{}',
    duration_minutes integer,
    location        text,
    metadata        jsonb default '{}'::jsonb,
    view_count      integer not null default 0,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),

    constraint valid_price check (price >= 0)
);

create index idx_services_provider on public.services(provider_id);
create index idx_services_category on public.services(category);
create index idx_services_published on public.services(is_published) where is_published = true and is_approved = true;
create index idx_services_search on public.services using gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

-- 4. PRODUCTS
create table public.products (
    id              uuid primary key default gen_random_uuid(),
    provider_id     uuid not null references public.providers(id) on delete cascade,
    name            text not null,
    description     text,
    category        text,
    sku             text unique,
    barcode         text,
    price           numeric(12,2) not null default 0,
    compare_price   numeric(12,2),
    cost_price      numeric(12,2),
    currency        text not null default 'NGN',
    unit            text default 'piece',
    is_published    boolean not null default false,
    is_approved     boolean not null default false,
    images          text[] default '{}',
    low_stock_qty   integer not null default 10,
    metadata        jsonb default '{}'::jsonb,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),

    constraint valid_product_price check (price >= 0)
);

create index idx_products_provider on public.products(provider_id);
create index idx_products_sku on public.products(sku);
create index idx_products_published on public.products(is_published) where is_published = true and is_approved = true;

-- 5. INVENTORY ITEMS
create table public.inventory_items (
    id              uuid primary key default gen_random_uuid(),
    product_id      uuid not null references public.products(id) on delete cascade,
    provider_id     uuid not null references public.providers(id) on delete cascade,
    quantity        integer not null default 0,
    reserved_qty    integer not null default 0,
    location        text,
    batch_number    text,
    expiration_date date,
    metadata        jsonb default '{}'::jsonb,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),

    constraint valid_qty check (quantity >= 0),
    constraint valid_reserved check (reserved_qty >= 0 and reserved_qty <= quantity)
);

create unique index idx_inventory_product on public.inventory_items(product_id);
create index idx_inventory_provider on public.inventory_items(provider_id);

-- 6. INVENTORY MOVEMENTS (audit trail)
create table public.inventory_movements (
    id              uuid primary key default gen_random_uuid(),
    inventory_id    uuid not null references public.inventory_items(id) on delete cascade,
    product_id      uuid not null references public.products(id) on delete cascade,
    provider_id     uuid not null references public.providers(id) on delete cascade,
    change_qty      integer not null,
    reason          text not null,
    reference_type  text,
    reference_id    uuid,
    metadata        jsonb default '{}'::jsonb,
    created_at      timestamptz not null default now()
);

create index idx_inv_movement_inventory on public.inventory_movements(inventory_id);
create index idx_inv_movement_product on public.inventory_movements(product_id);
create index idx_inv_movement_created on public.inventory_movements(created_at);

-- 7. BOOKINGS
create table public.bookings (
    id              uuid primary key default gen_random_uuid(),
    customer_id     uuid not null references public.profiles(id) on delete cascade,
    provider_id     uuid not null references public.providers(id) on delete cascade,
    service_id      uuid references public.services(id) on delete set null,
    product_id      uuid references public.products(id) on delete set null,
    status          public."booking_status" not null default 'PENDING',
    escrow_state    public."escrow_state",
    description     text,
    quantity        integer not null default 1,
    unit_price      numeric(12,2) not null default 0,
    total_amount    numeric(12,2) not null default 0,
    commission      numeric(12,2) default 0,
    currency        text not null default 'NGN',
    scheduled_date  timestamptz,
    completed_at    timestamptz,
    cancelled_at    timestamptz,
    cancellation_reason text,
    metadata        jsonb default '{}'::jsonb,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),

    constraint valid_amount check (total_amount >= 0),
    constraint valid_quantity check (quantity > 0)
);

create index idx_bookings_customer on public.bookings(customer_id);
create index idx_bookings_provider on public.bookings(provider_id);
create index idx_bookings_status on public.bookings(status);
create index idx_bookings_created on public.bookings(created_at desc);

-- 8. REVIEWS
create table public.reviews (
    id              uuid primary key default gen_random_uuid(),
    booking_id      uuid not null references public.bookings(id) on delete cascade,
    reviewer_id     uuid not null references public.profiles(id) on delete cascade,
    provider_id     uuid not null references public.providers(id) on delete cascade,
    rating          integer not null,
    title           text,
    body            text,
    is_verified     boolean not null default false,
    response_body   text,
    responded_at    timestamptz,
    metadata        jsonb default '{}'::jsonb,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),

    constraint valid_rating check (rating >= 1 and rating <= 5),
    constraint unique_booking_review unique (booking_id)
);

create index idx_reviews_provider on public.reviews(provider_id);
create index idx_reviews_reviewer on public.reviews(reviewer_id);
create index idx_reviews_rating on public.reviews(rating);

-- 9. WALLETS
create table public.wallets (
    id              uuid primary key default gen_random_uuid(),
    profile_id      uuid not null references public.profiles(id) on delete cascade unique,
    balance         numeric(14,2) not null default 0,
    balance_hold    numeric(14,2) not null default 0,
    currency        text not null default 'NGN',
    is_frozen       boolean not null default false,
    metadata        jsonb default '{}'::jsonb,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),

    constraint valid_balance check (balance >= 0),
    constraint valid_balance_hold check (balance_hold >= 0 and balance_hold <= balance)
);

-- 10. WALLET ENTRIES (append-only ledger)
create table public.wallet_entries (
    id              uuid primary key default gen_random_uuid(),
    wallet_id       uuid not null references public.wallets(id) on delete cascade,
    profile_id      uuid not null references public.profiles(id) on delete cascade,
    entry_type      public."entry_type" not null,
    amount          numeric(14,2) not null,
    balance_before  numeric(14,2) not null,
    balance_after   numeric(14,2) not null,
    reference_type  text,
    reference_id    uuid,
    description     text,
    metadata        jsonb default '{}'::jsonb,
    created_at      timestamptz not null default now()
);

create index idx_wallet_entries_wallet on public.wallet_entries(wallet_id);
create index idx_wallet_entries_profile on public.wallet_entries(profile_id);
create index idx_wallet_entries_created on public.wallet_entries(created_at desc);

-- 11. MINI WEBSITES
create table public.mini_websites (
    id              uuid primary key default gen_random_uuid(),
    provider_id     uuid not null references public.providers(id) on delete cascade unique,
    slug            text not null unique,
    title           text,
    tagline         text,
    bio             text,
    cover_image_url text,
    logo_url        text,
    theme           jsonb default '{}'::jsonb,
    seo             jsonb default '{}'::jsonb,
    is_published    boolean not null default false,
    custom_domain   text,
    metadata        jsonb default '{}'::jsonb,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index idx_mini_websites_slug on public.mini_websites(slug);
create index idx_mini_websites_published on public.mini_websites(is_published);

-- 12. MUSIC TRACKS
create table public.music_tracks (
    id              uuid primary key default gen_random_uuid(),
    provider_id     uuid not null references public.providers(id) on delete cascade,
    title           text not null,
    artist          text not null,
    album           text,
    genre           text,
    duration_seconds integer,
    file_url        text not null,
    cover_art_url   text,
    is_published    boolean not null default false,
    price           numeric(12,2),
    currency        text default 'NGN',
    metadata        jsonb default '{}'::jsonb,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index idx_music_provider on public.music_tracks(provider_id);

-- 13. HOTEL ROOMS
create table public.hotel_rooms (
    id              uuid primary key default gen_random_uuid(),
    provider_id     uuid not null references public.providers(id) on delete cascade,
    room_number     text not null,
    room_type       text not null,
    description     text,
    capacity        integer not null default 1,
    price_per_night numeric(12,2) not null default 0,
    currency        text default 'NGN',
    amenities       text[] default '{}',
    images          text[] default '{}',
    is_available    boolean not null default true,
    metadata        jsonb default '{}'::jsonb,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index idx_hotel_rooms_provider on public.hotel_rooms(provider_id);

-- 14. HOTEL CHECK-INS
create table public.hotel_check_ins (
    id              uuid primary key default gen_random_uuid(),
    booking_id      uuid not null references public.bookings(id) on delete cascade,
    room_id         uuid not null references public.hotel_rooms(id) on delete cascade,
    check_in_at     timestamptz not null default now(),
    check_out_at    timestamptz,
    guest_count     integer not null default 1,
    id_document_url text,
    metadata        jsonb default '{}'::jsonb,
    created_at      timestamptz not null default now()
);

create index idx_hotel_checkin_booking on public.hotel_check_ins(booking_id);
create index idx_hotel_checkin_room on public.hotel_check_ins(room_id);

-- 15. CONVERSATIONS
create table public.conversations (
    id                  uuid primary key default gen_random_uuid(),
    customer_id         uuid not null references public.profiles(id) on delete cascade,
    provider_id         uuid not null references public.providers(id) on delete cascade,
    booking_id          uuid references public.bookings(id) on delete set null,
    last_message_at     timestamptz,
    last_message_body   text,
    unread_customer     integer not null default 0,
    unread_provider     integer not null default 0,
    metadata            jsonb default '{}'::jsonb,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);
create unique index idx_conversations_unique on public.conversations(customer_id, provider_id, coalesce(booking_id, '00000000-0000-0000-0000-000000000000'));

create index idx_conversations_customer on public.conversations(customer_id);
create index idx_conversations_provider on public.conversations(provider_id);
create index idx_conversations_last_msg on public.conversations(last_message_at desc);

-- 16. MESSAGES
create table public.messages (
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

create index idx_messages_conversation on public.messages(conversation_id, created_at);
create index idx_messages_sender on public.messages(sender_id);

-- 17. NOTIFICATIONS
create table public.notifications (
    id              uuid primary key default gen_random_uuid(),
    profile_id      uuid not null references public.profiles(id) on delete cascade,
    type            public."notification_type" not null,
    title           text not null,
    body            text,
    link            text,
    is_read         boolean not null default false,
    metadata        jsonb default '{}'::jsonb,
    created_at      timestamptz not null default now()
);

create index idx_notifications_profile on public.notifications(profile_id, is_read, created_at desc);

-- 18. PUSH TOKENS
create table public.push_tokens (
    id              uuid primary key default gen_random_uuid(),
    profile_id      uuid not null references public.profiles(id) on delete cascade,
    token           text not null,
    platform        text not null,
    is_active       boolean not null default true,
    metadata        jsonb default '{}'::jsonb,
    created_at      timestamptz not null default now(),

    constraint unique_push_token unique (token)
);

create index idx_push_tokens_profile on public.push_tokens(profile_id);

-- 19. CATEGORY SYNONYMS
create table public.category_synonyms (
    id              uuid primary key default gen_random_uuid(),
    term            text not null,
    category        text not null,
    language        text default 'en',
    region          text default 'NG',
    is_active       boolean not null default true,
    metadata        jsonb default '{}'::jsonb,
    created_at      timestamptz not null default now(),

    constraint unique_term_category unique (term, category)
);

create index idx_cat_synonyms_term on public.category_synonyms(term);
create index idx_cat_synonyms_category on public.category_synonyms(category);

-- 20. AI INTERACTIONS
create table public.ai_interactions (
    id              uuid primary key default gen_random_uuid(),
    profile_id      uuid references public.profiles(id) on delete set null,
    session_id      text not null,
    prompt          text not null,
    response        text not null,
    model           text not null default 'gpt-4o',
    tokens_used     integer default 0,
    duration_ms     integer,
    metadata        jsonb default '{}'::jsonb,
    created_at      timestamptz not null default now()
);

create index idx_ai_interactions_profile on public.ai_interactions(profile_id);
create index idx_ai_interactions_session on public.ai_interactions(session_id);

-- 21. AUDIT LOGS
create table public.audit_logs (
    id              uuid primary key default gen_random_uuid(),
    profile_id      uuid references public.profiles(id) on delete set null,
    action          text not null,
    entity_type     text not null,
    entity_id       uuid,
    old_values      jsonb,
    new_values      jsonb,
    ip_address      inet,
    user_agent      text,
    metadata        jsonb default '{}'::jsonb,
    created_at      timestamptz not null default now()
);

create index idx_audit_logs_profile on public.audit_logs(profile_id);
create index idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);
create index idx_audit_logs_created on public.audit_logs(created_at desc);

-- ──────────────────────────────────────────────
-- UPDATED_AT TRIGGER FUNCTION
-- ──────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql security definer;

-- Apply updated_at trigger to all tables with updated_at column
create trigger trg_profiles_updated_at before update on public.profiles
    for each row execute function public.set_updated_at();
create trigger trg_providers_updated_at before update on public.providers
    for each row execute function public.set_updated_at();
create trigger trg_services_updated_at before update on public.services
    for each row execute function public.set_updated_at();
create trigger trg_products_updated_at before update on public.products
    for each row execute function public.set_updated_at();
create trigger trg_inventory_items_updated_at before update on public.inventory_items
    for each row execute function public.set_updated_at();
create trigger trg_bookings_updated_at before update on public.bookings
    for each row execute function public.set_updated_at();
create trigger trg_reviews_updated_at before update on public.reviews
    for each row execute function public.set_updated_at();
create trigger trg_wallets_updated_at before update on public.wallets
    for each row execute function public.set_updated_at();
create trigger trg_mini_websites_updated_at before update on public.mini_websites
    for each row execute function public.set_updated_at();
create trigger trg_music_tracks_updated_at before update on public.music_tracks
    for each row execute function public.set_updated_at();
create trigger trg_hotel_rooms_updated_at before update on public.hotel_rooms
    for each row execute function public.set_updated_at();
create trigger trg_conversations_updated_at before update on public.conversations
    for each row execute function public.set_updated_at();
create trigger trg_notifications_updated_at before update on public.notifications
    for each row execute function public.set_updated_at();

-- ──────────────────────────────────────────────
-- AUTO-CREATE PROFILE ON SIGNUP
-- ──────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, email, full_name, avatar_url, role)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', new.email),
        new.raw_user_meta_data->>'avatar_url',
        coalesce((new.raw_user_meta_data->>'role')::public."role", 'CUSTOMER')
    );
    return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- 00002_triggers.sql
-- Bixfind: Business logic triggers

-- ──────────────────────────────────────────────────────
-- TRIGGER 1: sync_inventory_from_product
-- Auto-populate inventory_items on Product insert/update
-- ──────────────────────────────────────────────────────
create or replace function public.sync_inventory_from_product_fn()
returns trigger as $$
begin
    if tg_op = 'INSERT' then
        insert into public.inventory_items (product_id, provider_id, quantity)
        values (new.id, new.provider_id, 0)
        on conflict (product_id) do nothing;
    end if;
    return new;
end;
$$ language plpgsql security definer;

create trigger trg_sync_inventory_from_product
    after insert on public.products
    for each row execute function public.sync_inventory_from_product_fn();

-- ──────────────────────────────────────────────────────
-- TRIGGER 2: bump_capabilities_version
-- Increment on Provider.primaryCategory change
-- ──────────────────────────────────────────────────────
create or replace function public.bump_capabilities_version_fn()
returns trigger as $$
begin
    if old.primary_category is distinct from new.primary_category then
        new.capabilities_version = old.capabilities_version + 1;
    end if;
    return new;
end;
$$ language plpgsql security definer;

create trigger trg_bump_capabilities_version
    before update on public.providers
    for each row execute function public.bump_capabilities_version_fn();

-- ──────────────────────────────────────────────────────
-- TRIGGER 3: update_unread_counts
-- Maintain Conversation.unreadCustomer/Provider on Message insert
-- ──────────────────────────────────────────────────────
create or replace function public.update_unread_counts_fn()
returns trigger as $$
declare
    v_customer_id uuid;
    v_provider_id uuid;
begin
    select customer_id, provider_id into v_customer_id, v_provider_id
    from public.conversations
    where id = new.conversation_id;

    if new.sender_id = v_customer_id then
        update public.conversations
        set unread_provider = unread_provider + 1,
            last_message_at = new.created_at,
            last_message_body = left(new.body, 200)
        where id = new.conversation_id;
    else
        update public.conversations
        set unread_customer = unread_customer + 1,
            last_message_at = new.created_at,
            last_message_body = left(new.body, 200)
        where id = new.conversation_id;
    end if;

    return new;
end;
$$ language plpgsql security definer;

create trigger trg_update_unread_counts
    after insert on public.messages
    for each row execute function public.update_unread_counts_fn();

-- ──────────────────────────────────────────────────────
-- TRIGGER 4: enforce_review_from_booking
-- Reject reviews without COMPLETED booking
-- ──────────────────────────────────────────────────────
create or replace function public.enforce_review_from_booking_fn()
returns trigger as $$
declare
    v_status public."booking_status";
begin
    select status into v_status
    from public.bookings
    where id = new.booking_id;

    if v_status is distinct from 'COMPLETED' then
        raise exception 'Reviews can only be created for COMPLETED bookings'
            using hint = format('Booking %s has status %s', new.booking_id, v_status);
    end if;

    return new;
end;
$$ language plpgsql security definer;

create trigger trg_enforce_review_from_booking
    before insert on public.reviews
    for each row execute function public.enforce_review_from_booking_fn();

-- ──────────────────────────────────────────────────────
-- TRIGGER 5: auto_create_wallet_on_profile
-- Automatically create a wallet when a profile is created
-- ──────────────────────────────────────────────────────
create or replace function public.auto_create_wallet_fn()
returns trigger as $$
begin
    insert into public.wallets (profile_id)
    values (new.id)
    on conflict (profile_id) do nothing;
    return new;
end;
$$ language plpgsql security definer;

create trigger trg_auto_create_wallet
    after insert on public.profiles
    for each row execute function public.auto_create_wallet_fn();

-- ──────────────────────────────────────────────────────
-- TRIGGER 6: log_wallet_entries_audit
-- Ensure wallet_entries are append-only and immutable
-- ──────────────────────────────────────────────────────
create or replace function public.prevent_wallet_entry_update()
returns trigger as $$
begin
    raise exception 'wallet_entries is an append-only ledger; updates and deletes are not allowed';
end;
$$ language plpgsql security definer;

create trigger trg_prevent_wallet_entry_update
    before update on public.wallet_entries
    for each row execute function public.prevent_wallet_entry_update();

create trigger trg_prevent_wallet_entry_delete
    before delete on public.wallet_entries
    for each row execute function public.prevent_wallet_entry_update();

-- ──────────────────────────────────────────────────────
-- TRIGGER 7: notification_on_booking_change
-- Auto-create notification when booking status changes
-- ──────────────────────────────────────────────────────
create or replace function public.notify_booking_change_fn()
returns trigger as $$
begin
    if old.status is distinct from new.status then
        insert into public.notifications (profile_id, type, title, body, link, metadata)
        values (
            new.customer_id,
            case new.status
                when 'CONFIRMED' then 'BOOKING_UPDATE'::public."notification_type"
                when 'COMPLETED' then 'BOOKING_UPDATE'::public."notification_type"
                when 'CANCELLED' then 'BOOKING_UPDATE'::public."notification_type"
                else 'BOOKING_NEW'::public."notification_type"
            end,
            'Booking ' || lower(new.status::text),
            'Your booking has been ' || lower(new.status::text),
            '/bookings/' || new.id,
            jsonb_build_object('booking_id', new.id, 'old_status', old.status, 'new_status', new.status)
        );
    end if;
    return new;
end;
$$ language plpgsql security definer;

create trigger trg_notify_booking_change
    after update on public.bookings
    for each row
    when (old.status is distinct from new.status)
    execute function public.notify_booking_change_fn();

-- ──────────────────────────────────────────────────────
-- TRIGGER 8: product_low_stock_notification
-- Notify provider when stock drops below threshold
-- ──────────────────────────────────────────────────────
create or replace function public.low_stock_notification_fn()
returns trigger as $$
begin
    if new.quantity <= (select low_stock_qty from public.products where id = new.product_id)
       and (old.quantity is null or old.quantity > new.quantity)
    then
        insert into public.notifications (profile_id, type, title, body, metadata)
        values (
            (select p.id from public.providers p where p.id = new.provider_id),
            'LOW_STOCK'::public."notification_type",
            'Low Stock Alert',
            (select name || ' has only ' || new.quantity || ' units left' from public.products where id = new.product_id),
            jsonb_build_object('product_id', new.product_id, 'quantity', new.quantity)
        );
    end if;
    return new;
end;
$$ language plpgsql security definer;

create trigger trg_low_stock_notification
    after update on public.inventory_items
    for each row
    execute function public.low_stock_notification_fn();

-- Fix: Add missing columns to providers table
-- The initial migration only partially applied.

-- Create missing enums if they don't exist
DO $$ BEGIN
  CREATE TYPE public."booking_status" as enum ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public."escrow_state" as enum ('HELD', 'RELEASED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public."entry_type" as enum ('CREDIT', 'DEBIT', 'HOLD', 'RELEASE', 'REFUND', 'PAYOUT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public."price_type" as enum ('FIXED', 'HOURLY', 'QUOTE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public."provider_tier" as enum ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public."notification_type" as enum ('BOOKING_NEW', 'BOOKING_UPDATE', 'MESSAGE', 'REVIEW', 'PAYOUT', 'SYSTEM', 'LOW_STOCK');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public."role" as enum ('CUSTOMER', 'PROVIDER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public."user_status" as enum ('ACTIVE', 'SUSPENDED', 'DELETED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add missing columns to providers table
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS business_email text;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS business_phone text;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS country text default 'Nigeria';
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS latitude numeric(10,7);
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS longitude numeric(10,7);
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS cover_image_url text;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS primary_category text;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS tags text[] default '{}';
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS tier public."provider_tier" not null default 'BRONZE';
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS is_verified boolean not null default false;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS is_online boolean not null default false;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS capabilities_version integer not null default 1;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS business_hours jsonb default '{}'::jsonb;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS social_links jsonb default '{}'::jsonb;

-- Ensure profiles table has all needed columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_type text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified boolean not null default false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS metadata jsonb default '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz not null default now();

-- Ensure profiles.role uses correct type
DO $$ BEGIN
  ALTER TABLE public.profiles ALTER COLUMN role TYPE public."role" using role::public."role";
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ALTER COLUMN status TYPE public."user_status" using status::public."user_status";
EXCEPTION WHEN others THEN NULL;
END $$;

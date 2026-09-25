-- Migration: Add missing columns to mini_websites table
-- Run this in Supabase Dashboard SQL Editor

-- Add builder columns
ALTER TABLE public.mini_websites ADD COLUMN IF NOT EXISTS user_id uuid references auth.users(id) on delete cascade;
ALTER TABLE public.mini_websites ADD COLUMN IF NOT EXISTS blocks jsonb default '[]'::jsonb;
ALTER TABLE public.mini_websites ADD COLUMN IF NOT EXISTS template_id text default 'minimal';
ALTER TABLE public.mini_websites ADD COLUMN IF NOT EXISTS palette_id text default 'ocean';
ALTER TABLE public.mini_websites ADD COLUMN IF NOT EXISTS font_pair_id text default 'modern-sans';
ALTER TABLE public.mini_websites ADD COLUMN IF NOT EXISTS density text default 'comfortable';
ALTER TABLE public.mini_websites ADD COLUMN IF NOT EXISTS custom_colors jsonb;
ALTER TABLE public.mini_websites ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE public.mini_websites ADD COLUMN IF NOT EXISTS hero_title text;
ALTER TABLE public.mini_websites ADD COLUMN IF NOT EXISTS hero_tagline text;
ALTER TABLE public.mini_websites ADD COLUMN IF NOT EXISTS services jsonb default '[]'::jsonb;
ALTER TABLE public.mini_websites ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.mini_websites ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.mini_websites ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.mini_websites ADD COLUMN IF NOT EXISTS banner_url text;

-- Add unique constraint on user_id (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mini_websites_user_id_key'
  ) THEN
    ALTER TABLE public.mini_websites ADD CONSTRAINT mini_websites_user_id_key unique (user_id);
  END IF;
END $$;

-- Add index on user_id
CREATE INDEX IF NOT EXISTS idx_mini_websites_user_id ON public.mini_websites(user_id);

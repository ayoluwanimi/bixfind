-- Migration 00005: Add draft columns, logo_url, service form improvements
-- Run this in Supabase Dashboard SQL Editor

-- Draft columns for website builder (published = blocks, draft = draft_blocks)
ALTER TABLE public.mini_websites ADD COLUMN IF NOT EXISTS draft_blocks jsonb;
ALTER TABLE public.mini_websites ADD COLUMN IF NOT EXISTS draft_template_id text;
ALTER TABLE public.mini_websites ADD COLUMN IF NOT EXISTS draft_palette_id text;
ALTER TABLE public.mini_websites ADD COLUMN IF NOT EXISTS draft_font_pair_id text;
ALTER TABLE public.mini_websites ADD COLUMN IF NOT EXISTS draft_density text;
ALTER TABLE public.mini_websites ADD COLUMN IF NOT EXISTS draft_custom_colors jsonb;
ALTER TABLE public.mini_websites ADD COLUMN IF NOT EXISTS draft_logo_url text;

-- Add comprehensive columns for services
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS subcategory text;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS requires_price boolean DEFAULT true;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS requires_duration boolean DEFAULT true;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS custom_fields jsonb;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS tags text[];
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS image_url text;

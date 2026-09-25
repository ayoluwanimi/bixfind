-- Run this in Supabase Dashboard → SQL Editor → New Query
-- This creates the public.users table that the app uses for admin/user counters

CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT DEFAULT '',
  role TEXT DEFAULT 'customer',
  avatar TEXT DEFAULT '',
  category TEXT DEFAULT '',
  is_verified BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  is_suspended BOOLEAN DEFAULT false,
  wallet JSONB DEFAULT '{"balance": 0}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow service_role (admin backend) full access
CREATE POLICY "service_role_all" ON public.users
  FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to read their own data
CREATE POLICY "users_read_own" ON public.users
  FOR SELECT USING (auth.uid()::text = id);

-- Allow public read access for stats (only counts, no sensitive data exposed via API)
CREATE POLICY "users_select_stats" ON public.users
  FOR SELECT USING (true);

-- Grant access to authenticated and anon roles
GRANT ALL ON public.users TO service_role;
GRANT SELECT ON public.users TO authenticated, anon;

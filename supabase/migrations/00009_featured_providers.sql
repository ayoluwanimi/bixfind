-- 00009_featured_providers.sql
-- Bixfind: Featured/Top Service Providers (standalone, no FK dependencies)

CREATE TABLE IF NOT EXISTS public.featured_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id TEXT NOT NULL,
  business_name TEXT NOT NULL DEFAULT '',
  logo_url TEXT DEFAULT '',
  primary_category TEXT DEFAULT '',
  city TEXT DEFAULT '',
  state TEXT DEFAULT '',
  description TEXT DEFAULT '',
  featured_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_featured_providers_provider_id ON public.featured_providers(provider_id);
CREATE INDEX IF NOT EXISTS idx_featured_providers_featured_at ON public.featured_providers(featured_at);

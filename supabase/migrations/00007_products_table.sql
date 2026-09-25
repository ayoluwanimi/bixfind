-- Migration: Create/update products table
-- The products table may already exist with different columns.
-- This migration ensures the schema matches what the API expects.

-- Ensure provider_id column exists
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS provider_id UUID;
UPDATE public.products SET provider_id = '00000000-0000-0000-0000-000000000000' WHERE provider_id IS NULL;
ALTER TABLE public.products ALTER COLUMN provider_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_provider_id ON public.products(provider_id);

-- Add missing columns
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image TEXT DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS view_products ON public.products;
CREATE POLICY view_products ON public.products FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS insert_products ON public.products;
CREATE POLICY insert_products ON public.products FOR INSERT WITH CHECK (provider_id = auth.uid());

DROP POLICY IF EXISTS update_products ON public.products;
CREATE POLICY update_products ON public.products FOR UPDATE USING (provider_id = auth.uid());

DROP POLICY IF EXISTS delete_products ON public.products;
CREATE POLICY delete_products ON public.products FOR DELETE USING (provider_id = auth.uid());

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_product_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_product_updated_at();

-- Service synonyms table for search query expansion
-- Each row maps a synonym word to a canonical service_name
-- language column tracks origin: en (english), yo (yoruba), ig (igbo), ha (hausa), pcm (pidgin)

CREATE TABLE IF NOT EXISTS service_synonyms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name TEXT NOT NULL,
  synonym TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_service_synonyms_pair
  ON service_synonyms (LOWER(service_name), LOWER(synonym));

CREATE INDEX IF NOT EXISTS idx_service_synonyms_service ON service_synonyms (LOWER(service_name));
CREATE INDEX IF NOT EXISTS idx_service_synonyms_synonym ON service_synonyms (LOWER(synonym));

-- Enable RLS but allow public read for search
ALTER TABLE service_synonyms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for service_synonyms"
  ON service_synonyms FOR SELECT
  USING (true);

CREATE POLICY "Service role insert/update for service_synonyms"
  ON service_synonyms FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- SERVICE SYNONYMS TABLE + SEED DATA
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Create table
CREATE TABLE IF NOT EXISTS service_synonyms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name TEXT NOT NULL,
  synonym TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_synonyms_pair
  ON service_synonyms (LOWER(service_name), LOWER(synonym));
CREATE INDEX IF NOT EXISTS idx_service_synonyms_service
  ON service_synonyms (LOWER(service_name));
CREATE INDEX IF NOT EXISTS idx_service_synonyms_synonym
  ON service_synonyms (LOWER(synonym));

-- 3. RLS
ALTER TABLE service_synonyms ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Public read access for service_synonyms" ON service_synonyms;
  DROP POLICY IF EXISTS "Service role insert/update for service_synonyms" ON service_synonyms;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Public read access for service_synonyms"
  ON service_synonyms FOR SELECT USING (true);
CREATE POLICY "Service role insert/update for service_synonyms"
  ON service_synonyms FOR ALL USING (auth.role() = 'service_role');

-- 4. Seed data (case-deduplicated)
INSERT INTO service_synonyms (service_name, synonym, language) VALUES
('barber', 'barbing', 'en'),
('barber', 'haircut', 'en'),
('barber', 'salon', 'en'),
('barber', 'barbershop', 'en'),
('barber', 'grooming', 'en'),
('barber', 'shave', 'en'),
('barber', 'fade', 'en'),
('barber', 'hair', 'en'),
('barber', 'makyan', 'ha'),

('fashion', 'tailor', 'en'),
('fashion', 'sewing', 'en'),
('fashion', 'clothing', 'en'),
('fashion', 'dress', 'en'),
('fashion', 'boutique', 'en'),
('fashion', 'seamstress', 'en'),
('fashion', 'aso oke', 'yo'),
('fashion', 'asoebi', 'yo'),
('fashion', 'gele', 'yo'),
('fashion', 'alaso', 'yo'),
('fashion', 'riga', 'ha'),
('fashion', 'kwalba', 'ha'),
('fashion', 'hula', 'ha'),
('fashion', 'zare', 'ha'),
('fashion', 'abaya', 'yo'),
('fashion', 'sị', 'ig'),
('fashion', 'akpa', 'ig'),

('food', 'catering', 'en'),
('food', 'chef', 'en'),
('food', 'cooking', 'en'),
('food', 'restaurant', 'en'),
('food', 'jollof', 'en'),
('food', 'small chops', 'en'),
('food', 'fried rice', 'en'),
('food', 'moi moi', 'en'),
('food', 'pepper soup', 'en'),
('food', 'suya', 'en'),
('food', 'puff puff', 'en'),
('food', 'banga', 'en'),
('food', 'efo riro', 'en'),
('food', 'amala', 'en'),
('food', 'eba', 'en'),
('food', 'fufu', 'en'),
('food', 'pounded yam', 'en'),
('food', 'boli', 'en'),
('food', 'bole', 'en'),
('food', 'roasted corn', 'en'),
('food', 'buka', 'yo'),
('food', 'mama put', 'en'),
('food', 'chop', 'pcm'),
('food', 'nri', 'ig'),
('food', 'eja', 'yo'),
('food', 'kilishi', 'ha'),
('food', 'fura da nono', 'ha'),
('food', 'dawa', 'ha'),
('food', 'ina', 'yo'),

('plumbing', 'plumb', 'en'),
('plumbing', 'pipe', 'en'),
('plumbing', 'drain', 'en'),
('plumbing', 'leak', 'en'),
('plumbing', 'borehole', 'en'),
('plumbing', 'borehole drilling', 'en'),
('plumbing', 'water supply', 'en'),
('plumbing', 'gesy', 'en'),
('plumbing', 'gyser', 'en'),
('plumbing', 'omi', 'yo'),
('plumbing', 'ruwa', 'ha'),
('plumbing', 'bend down', 'pcm'),

('electrical', 'electrician', 'en'),
('electrical', 'wiring', 'en'),
('electrical', 'inverter', 'en'),
('electrical', 'generator', 'en'),
('electrical', 'solar', 'en'),
('electrical', 'ac', 'en'),
('electrical', 'air conditioning', 'en'),
('electrical', 'cctv', 'en'),
('electrical', 'light', 'en'),
('electrical', 'power', 'en'),
('electrical', 'aaro', 'yo'),
('electrical', 'ike', 'ig'),
('electrical', 'iskanci', 'ha'),
('electrical', 'inji', 'ha'),

('cleaning', 'laundry', 'en'),
('cleaning', 'wash', 'en'),
('cleaning', 'dry clean', 'en'),
('cleaning', 'housekeeping', 'en'),
('cleaning', 'fumigation', 'en'),
('cleaning', 'pest control', 'en'),
('cleaning', 'wanka', 'ha'),
('cleaning', 'ogbugbu', 'ig'),
('cleaning', 'no wahala', 'pcm'),

('painting', 'painter', 'en'),
('painting', 'wall', 'en'),
('painting', 'pop ceiling', 'en'),
('painting', 'pop', 'en'),
('painting', 'plaster', 'en'),
('painting', 'texture', 'en'),

('car repair', 'mechanic', 'en'),
('car repair', 'panel beater', 'pcm'),
('car repair', 'vulcanize', 'pcm'),
('car repair', 'tokunbo', 'yo'),
('car repair', 'tokunboh', 'yo'),
('car repair', 'fairly used', 'en'),
('car repair', 'jirgi', 'ha'),
('car repair', 'ugboala', 'ig'),

('real estate', 'property', 'en'),
('real estate', 'house', 'en'),
('real estate', 'land', 'en'),
('real estate', 'rent', 'en'),
('real estate', 'apartment', 'en'),
('real estate', 'ile', 'yo'),
('real estate', 'onile', 'yo'),
('real estate', 'omo onile', 'yo'),
('real estate', 'ulo', 'ig'),
('real estate', 'dakin', 'ha'),

('beauty', 'makeup', 'en'),
('beauty', 'skincare', 'en'),
('beauty', 'spa', 'en'),
('beauty', 'nails', 'en'),
('beauty', 'manicure', 'en'),
('beauty', 'pedicure', 'en'),
('beauty', 'lash', 'en'),
('beauty', 'omoge', 'yo'),
('beauty', 'mkpọsa', 'ig'),

('tech', 'computer', 'en'),
('tech', 'laptop', 'en'),
('tech', 'phone repair', 'en'),
('tech', 'software', 'en'),
('tech', 'web development', 'en'),
('tech', 'graphic design', 'en'),
('tech', 'oju riri', 'yo'),
('tech', 'ngwa', 'ig'),

('education', 'tutor', 'en'),
('education', 'teaching', 'en'),
('education', 'lesson', 'en'),
('education', 'training', 'en'),
('education', 'course', 'en'),
('education', 'cram', 'pcm'),
('education', 'grinds', 'pcm'),
('education', 'akwukwo', 'ig'),

('health', 'doctor', 'en'),
('health', 'pharmacy', 'en'),
('health', 'hospital', 'en'),
('health', 'nurse', 'en'),
('health', 'therapy', 'en'),
('health', 'lafiya', 'ha'),
('health', 'ndu', 'ig'),
('health', 'agbo', 'yo'),
('health', 'osho', 'yo'),

('legal', 'lawyer', 'en'),
('legal', 'attorney', 'en'),
('legal', 'cac', 'en'),
('legal', 'business registration', 'en'),

('finance', 'accountant', 'en'),
('finance', 'tax', 'en'),
('finance', 'bookkeeping', 'en'),
('finance', 'pos', 'en'),
('finance', 'chop money', 'pcm'),
('finance', 'aje', 'yo'),
('finance', 'ogo', 'ig'),

('events', 'party', 'en'),
('events', 'wedding', 'en'),
('events', 'owambe', 'yo'),
('events', 'celebration', 'en'),
('events', 'event planner', 'en'),
('events', 'spray', 'pcm'),
('events', 'gbas gbos', 'pcm'),
('events', 'oge', 'ig'),
('events', 'agbero', 'pcm'),

('photography', 'camera', 'en'),
('photography', 'photo', 'en'),
('photography', 'video', 'en'),
('photography', 'studio', 'en'),
('photography', 'shoot', 'en'),
('photography', 'nka', 'ig'),

('entertainment', 'dj', 'en'),
('entertainment', 'music', 'en'),
('entertainment', 'band', 'en'),
('entertainment', 'mc', 'en'),
('entertainment', 'comedy', 'en'),
('entertainment', 'egwu', 'ig'),

('delivery', 'dispatch', 'en'),
('delivery', 'logistics', 'en'),
('delivery', 'courier', 'en'),
('delivery', 'transport', 'en'),
('delivery', 'waka', 'pcm'),
('delivery', 'abeg', 'pcm'),
('delivery', 'esan', 'yo'),
('delivery', 'uzu', 'ig'),
('delivery', 'kaya', 'ha'),
('delivery', 'okada', 'pcm'),
('delivery', 'danfo', 'pcm'),
('delivery', 'keke', 'pcm'),
('delivery', 'basin', 'ha'),

('welding', 'weld', 'en'),
('welding', 'fabrication', 'en'),
('welding', 'metal work', 'en'),
('welding', 'gate', 'en'),
('welding', 'fence', 'en'),
('welding', 'grill', 'en'),

('carpentry', 'carpenter', 'en'),
('carpentry', 'furniture', 'en'),
('carpentry', 'woodwork', 'en'),
('carpentry', 'otobello', 'ha'),
('carpentry', 'igbo', 'yo'),
('carpentry', 'akpukpo', 'ig'),
('carpentry', 'rari', 'ha'),

('construction', 'building', 'en'),
('construction', 'masonry', 'en'),
('construction', 'cement', 'en'),
('construction', 'block', 'en'),
('construction', 'ezzu', 'ig'),
('construction', 'okuta', 'yo'),

('security', 'guard', 'en'),
('security', 'surveillance', 'en'),
('security', 'bouncer', 'en'),
('security', 'bodyguard', 'en'),
('security', 'omo se', 'pcm'),
('security', 'ole', 'yo'),

('agriculture', 'farming', 'en'),
('agriculture', 'poultry', 'en'),
('agriculture', 'crop', 'en'),
('agriculture', 'harvest', 'en'),
('agriculture', 'gonaki', 'ha'),
('agriculture', 'taki', 'ha'),
('agriculture', 'ubi', 'ig'),
('agriculture', 'agbe', 'yo'),

('printing', 'print', 'en'),
('printing', 'photocopy', 'en'),
('printing', 'business card', 'en'),
('printing', 'flyer', 'en'),
('printing', 'banner', 'en'),

('fitness', 'gym', 'en'),
('fitness', 'trainer', 'en'),
('fitness', 'workout', 'en'),
('fitness', 'yoga', 'en'),
('fitness', 'massage', 'en'),

('repair', 'maintenance', 'en'),
('repair', 'handyman', 'en'),
('repair', 'technician', 'en'),
('repair', 'fix', 'en'),
('repair', 'wahala', 'pcm'),

('drinks', 'zobo', 'en'),
('drinks', 'kunu', 'ha'),
('drinks', 'palm wine', 'en'),
('drinks', 'burukutu', 'pcm'),
('drinks', 'ogogoro', 'pcm'),
('drinks', 'gas', 'ha'),

('shopping', 'market', 'en'),
('shopping', 'shop', 'en'),
('shopping', 'oja', 'yo'),
('shopping', 'ahia', 'ig'),
('shopping', 'kasuwa', 'ha'),
('shopping', 'azuzi', 'ig'),

('landscaping', 'garden', 'en'),
('landscaping', 'lawn', 'en'),
('landscaping', 'grass', 'en'),
('landscaping', 'tree', 'en'),

('glass', 'glazing', 'en'),
('glass', 'mirror', 'en'),
('glass', 'window', 'en'),

('roofing', 'roof', 'en'),
('roofing', 'ceiling', 'en'),
('roofing', 'zinc', 'en'),

('tiling', 'tile', 'en'),
('tiling', 'ceramic', 'en'),
('tiling', 'marble', 'en'),
('tiling', 'flooring', 'en'),

('fencing', 'perimeter fence', 'en'),
('fencing', 'electric fence', 'en'),
('fencing', 'security fence', 'en'),

('solar', 'solar panel', 'en'),
('solar', 'solar battery', 'en'),
('solar', 'renewable energy', 'en'),
('solar', 'off grid', 'en'),

('consulting', 'consultant', 'en'),
('consulting', 'advice', 'en'),
('consulting', 'how far', 'pcm'),

('pet', 'dog', 'en'),
('pet', 'cat', 'en'),
('pet', 'veterinary', 'en'),

('automobile', 'car dealer', 'en'),
('automobile', 'vehicle', 'en'),
('automobile', 'uk used', 'en'),
('automobile', 'usa used', 'en'),

('interior design', 'interior', 'en'),
('interior design', 'decor', 'en'),
('interior design', 'renovation', 'en'),

('sports', 'football', 'en'),
('sports', 'academy', 'en'),
('sports', 'coaching', 'en')

ON CONFLICT (LOWER(service_name), LOWER(synonym)) DO UPDATE
  SET language = EXCLUDED.language;

-- 5. Verify
SELECT service_name, synonym, language
FROM service_synonyms
ORDER BY service_name, language, synonym;

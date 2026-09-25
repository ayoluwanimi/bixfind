-- 00004_seed_category_synonyms.sql
-- Bixfind: Seed Nigerian service category synonyms and local terms

insert into public.category_synonyms (term, category, language, region) values
    -- Event Planning & Catering
    ('owambe', 'Event Planning', 'yo', 'NG'),
    ('party rice', 'Catering', 'en', 'NG'),
    ('jollof', 'Catering', 'en', 'NG'),
    ('small chops', 'Catering', 'en', 'NG'),
    ('asoebi', 'Fashion & Tailoring', 'yo', 'NG'),
    ('aso oke', 'Fashion & Tailoring', 'yo', 'NG'),
    ('ankara', 'Fashion & Tailoring', 'en', 'NG'),
    ('ankara styles', 'Fashion & Tailoring', 'en', 'NG'),
    ('agbada', 'Fashion & Tailoring', 'yo', 'NG'),
    ('gele', 'Beauty & Makeup', 'yo', 'NG'),

    -- Transportation
    ('okada', 'Transportation', 'yo', 'NG'),
    ('keke', 'Transportation', 'en', 'NG'),
    ('agbero', 'Transportation', 'yo', 'NG'),

    -- Barbering & Beauty
    ('barbing', 'Barbering', 'en', 'NG'),
    ('alasiri', 'Barbering', 'yo', 'NG'),
    ('alata', 'Beauty & Cosmetics', 'ha', 'NG'),

    -- Electronics & Power
    ('NEPA', 'Electronics', 'en', 'NG'),
    ('gen', 'Electronics', 'en', 'NG'),
    ('inverter', 'Electronics', 'en', 'NG'),

    -- Automotive
    ('tokunbo', 'Automotive', 'yo', 'NG'),
    ('mai shai', 'Automotive', 'ha', 'NG'),

    -- Business Services
    ('POS', 'Business Services', 'en', 'NG'),
    ('CAC', 'Business Services', 'en', 'NG'),

    -- Education
    ('WAEC', 'Education', 'en', 'NG'),
    ('JAMB', 'Education', 'en', 'NG'),
    ('NECO', 'Education', 'en', 'NG'),

    -- Weddings & Events
    ('alaga', 'Event Planning', 'yo', 'NG')
on conflict (term, category) do nothing;

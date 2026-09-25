-- 00008_login_attempts.sql
-- Bixfind: Login rate limiting table

CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT DEFAULT '',
  attempt_time TIMESTAMPTZ DEFAULT now(),
  success BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_time ON public.login_attempts(attempt_time);

-- No RLS needed — accessed only via service_role key (bypasses RLS)

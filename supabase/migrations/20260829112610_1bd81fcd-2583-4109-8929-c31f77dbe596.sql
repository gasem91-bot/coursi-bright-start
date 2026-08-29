CREATE TABLE public.exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level text NOT NULL,
  score integer NOT NULL,
  total integer NOT NULL,
  passed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.exam_attempts TO authenticated;
GRANT ALL ON public.exam_attempts TO service_role;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own exam attempts" ON public.exam_attempts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "No client inserts on exam attempts" ON public.exam_attempts FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No client updates on exam attempts" ON public.exam_attempts FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "No client deletes on exam attempts" ON public.exam_attempts FOR DELETE TO anon, authenticated USING (false);
CREATE INDEX exam_attempts_user_level_idx ON public.exam_attempts (user_id, level, created_at DESC);

CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level text NOT NULL,
  certificate_id text NOT NULL,
  score integer NOT NULL,
  total integer NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, level)
);
GRANT SELECT ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own certificates" ON public.certificates FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "No client inserts on certificates" ON public.certificates FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No client updates on certificates" ON public.certificates FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "No client deletes on certificates" ON public.certificates FOR DELETE TO anon, authenticated USING (false);
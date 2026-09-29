CREATE TABLE public.task_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  level text NOT NULL,
  kind text NOT NULL,
  file_path text,
  link_url text,
  note text,
  status text NOT NULL DEFAULT 'pending',
  ai_feedback text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.task_submissions TO authenticated;
GRANT ALL ON public.task_submissions TO service_role;
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own task submissions" ON public.task_submissions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX task_submissions_user_level_idx ON public.task_submissions (user_id, level, created_at DESC);

CREATE TABLE public.level_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  level text NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text CHECK (comment IS NULL OR char_length(comment) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, level)
);
GRANT SELECT, INSERT ON public.level_ratings TO authenticated;
GRANT ALL ON public.level_ratings TO service_role;
ALTER TABLE public.level_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own ratings" ON public.level_ratings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users add own rating" ON public.level_ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.upgrade_nudges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  level text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, level)
);
GRANT ALL ON public.upgrade_nudges TO service_role;
ALTER TABLE public.upgrade_nudges ENABLE ROW LEVEL SECURITY;
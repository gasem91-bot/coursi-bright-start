ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deactivated_at timestamptz;

CREATE TABLE public.account_exits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exit_type text NOT NULL CHECK (exit_type IN ('paused','deleted')),
  exited_on date NOT NULL DEFAULT current_date,
  level_reached text,
  subscription_tier text,
  chapters_completed integer NOT NULL DEFAULT 0,
  certificates_earned integer NOT NULL DEFAULT 0,
  reason text,
  comment text
);
GRANT ALL ON public.account_exits TO service_role;
ALTER TABLE public.account_exits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read exits" ON public.account_exits FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
GRANT SELECT ON public.account_exits TO authenticated;

CREATE TABLE public.do_not_contact (
  email text PRIMARY KEY,
  added_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.do_not_contact TO service_role;
ALTER TABLE public.do_not_contact ENABLE ROW LEVEL SECURITY;
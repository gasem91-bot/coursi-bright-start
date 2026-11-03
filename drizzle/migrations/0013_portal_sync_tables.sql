CREATE TABLE public.sync_events (
  event_id text PRIMARY KEY,
  origin_portal text NOT NULL,
  type text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.sync_events TO service_role;
ALTER TABLE public.sync_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.sync_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sync_outbox_due_idx ON public.sync_outbox (status, next_attempt_at);
GRANT ALL ON public.sync_outbox TO service_role;
ALTER TABLE public.sync_outbox ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.referral_mirror (
  key text PRIMARY KEY,
  owner_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  referrer_email text NOT NULL,
  friend_email text,
  friend_name text,
  status text NOT NULL,
  vertical text NOT NULL DEFAULT 'trading',
  invited_at timestamptz,
  signed_up_at timestamptz,
  purchased_at timestamptz,
  rewarded_at timestamptz,
  origin_portal text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX referral_mirror_owner_idx ON public.referral_mirror (owner_user_id);
GRANT SELECT ON public.referral_mirror TO authenticated;
GRANT ALL ON public.referral_mirror TO service_role;
ALTER TABLE public.referral_mirror ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read own mirrored referrals" ON public.referral_mirror
  FOR SELECT TO authenticated USING (auth.uid() = owner_user_id);

CREATE TABLE public.wallet_code_mirror (
  code text PRIMARY KEY,
  owner_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_email text NOT NULL,
  referral_key text,
  kind text NOT NULL,
  amount_cents integer NOT NULL DEFAULT 500,
  status text NOT NULL,
  vertical text NOT NULL DEFAULT 'trading',
  issued_at timestamptz,
  expires_at timestamptz,
  origin_portal text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX wallet_code_mirror_owner_idx ON public.wallet_code_mirror (owner_user_id);
GRANT SELECT ON public.wallet_code_mirror TO authenticated;
GRANT ALL ON public.wallet_code_mirror TO service_role;
ALTER TABLE public.wallet_code_mirror ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read own mirrored codes" ON public.wallet_code_mirror
  FOR SELECT TO authenticated USING (auth.uid() = owner_user_id);
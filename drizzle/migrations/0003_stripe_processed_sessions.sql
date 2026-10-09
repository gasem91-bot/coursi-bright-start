CREATE TABLE public.stripe_processed_sessions (
  session_id text PRIMARY KEY,
  user_id uuid,
  kind text,
  processed_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.stripe_processed_sessions TO service_role;
ALTER TABLE public.stripe_processed_sessions ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.stripe_processed_sessions IS 'Idempotency ledger for Stripe checkout webhooks; server-only, no client access.';
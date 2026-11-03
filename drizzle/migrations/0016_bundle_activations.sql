CREATE TABLE public.bundle_activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  grant_id text NOT NULL UNIQUE,
  plan text NOT NULL CHECK (plan IN ('course','course_ai')),
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '30 days',
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  level text CHECK (level IS NULL OR level IN ('beginner','intermediate','advanced')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','activated')),
  last_email_at timestamptz
);
CREATE INDEX bundle_activations_email_idx ON public.bundle_activations (email);
GRANT ALL ON public.bundle_activations TO service_role;
ALTER TABLE public.bundle_activations ENABLE ROW LEVEL SECURITY;
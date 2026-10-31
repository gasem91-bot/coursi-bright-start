CREATE TABLE public.referral_signup_claims (
 user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
 referral_code text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.referral_signup_claims TO service_role;
ALTER TABLE public.referral_signup_claims ENABLE ROW LEVEL SECURITY;
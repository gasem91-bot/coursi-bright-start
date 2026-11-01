ALTER TABLE public.referrals ADD COLUMN vertical text NOT NULL DEFAULT 'ai';
ALTER TABLE public.referrals ADD CONSTRAINT referrals_vertical_valid CHECK (vertical IN ('ai','trading','fitness'));
ALTER TABLE public.referral_signup_claims ADD COLUMN vertical text NOT NULL DEFAULT 'ai';
ALTER TABLE public.referral_paid_purchases ADD COLUMN vertical text NOT NULL DEFAULT 'ai';
CREATE TABLE public.referral_wallet_codes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 referral_id uuid NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 vertical text NOT NULL DEFAULT 'ai' CHECK (vertical IN ('ai','trading','fitness')),
 kind text NOT NULL CHECK (kind IN ('friend','reward')),
 code text NOT NULL UNIQUE,
 amount_cents integer NOT NULL DEFAULT 500 CHECK (amount_cents=500),
 issued_at timestamptz NOT NULL,
 expires_at timestamptz NOT NULL,
 redeemed_at timestamptz,
 cancelled_at timestamptz,
 UNIQUE(referral_id,kind)
);
GRANT SELECT ON public.referral_wallet_codes TO authenticated;
GRANT ALL ON public.referral_wallet_codes TO service_role;
ALTER TABLE public.referral_wallet_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own wallet" ON public.referral_wallet_codes FOR SELECT TO authenticated USING (auth.uid()=user_id);
CREATE INDEX referral_wallet_owner_vertical ON public.referral_wallet_codes(user_id,vertical,issued_at DESC);
CREATE OR REPLACE FUNCTION public.sync_referral_wallet() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.referred_user_id IS NOT NULL AND NEW.friend_code IS NOT NULL AND NEW.friend_code_expires_at IS NOT NULL THEN
 INSERT INTO public.referral_wallet_codes(referral_id,user_id,vertical,kind,code,issued_at,expires_at,redeemed_at)
 VALUES(NEW.id,NEW.referred_user_id,NEW.vertical,'friend',NEW.friend_code,COALESCE(NEW.friend_issued_at,NEW.created_at),NEW.friend_code_expires_at,NEW.friend_code_redeemed_at)
 ON CONFLICT(referral_id,kind) DO UPDATE SET user_id=EXCLUDED.user_id,vertical=EXCLUDED.vertical,code=EXCLUDED.code,issued_at=EXCLUDED.issued_at,expires_at=EXCLUDED.expires_at,redeemed_at=EXCLUDED.redeemed_at;
 END IF;
 IF NEW.reward_code IS NOT NULL AND NEW.reward_expires_at IS NOT NULL THEN
 INSERT INTO public.referral_wallet_codes(referral_id,user_id,vertical,kind,code,issued_at,expires_at,redeemed_at,cancelled_at)
 VALUES(NEW.id,NEW.referrer_user_id,NEW.vertical,'reward',NEW.reward_code,COALESCE(NEW.reward_issued_at,NEW.created_at),NEW.reward_expires_at,NEW.reward_redeemed_at,CASE WHEN NEW.status='voided' AND NEW.reward_redeemed_at IS NULL THEN now() ELSE NULL END)
 ON CONFLICT(referral_id,kind) DO UPDATE SET vertical=EXCLUDED.vertical,code=EXCLUDED.code,issued_at=EXCLUDED.issued_at,expires_at=EXCLUDED.expires_at,redeemed_at=EXCLUDED.redeemed_at,cancelled_at=COALESCE(referral_wallet_codes.cancelled_at,EXCLUDED.cancelled_at);
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.sync_referral_wallet() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER sync_referral_wallet AFTER INSERT OR UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION public.sync_referral_wallet();
INSERT INTO public.referral_wallet_codes(referral_id,user_id,vertical,kind,code,issued_at,expires_at,redeemed_at)
SELECT id,referred_user_id,vertical,'friend',friend_code,COALESCE(friend_issued_at,created_at),friend_code_expires_at,friend_code_redeemed_at FROM public.referrals WHERE referred_user_id IS NOT NULL AND friend_code IS NOT NULL AND friend_code_expires_at IS NOT NULL;
INSERT INTO public.referral_wallet_codes(referral_id,user_id,vertical,kind,code,issued_at,expires_at,redeemed_at,cancelled_at)
SELECT id,referrer_user_id,vertical,'reward',reward_code,COALESCE(reward_issued_at,created_at),reward_expires_at,reward_redeemed_at,CASE WHEN status='voided' AND reward_redeemed_at IS NULL THEN now() ELSE NULL END FROM public.referrals WHERE reward_code IS NOT NULL AND reward_expires_at IS NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_at timestamptz;
CREATE OR REPLACE FUNCTION public.generate_referral_code() RETURNS text LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=public AS $$
DECLARE alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; candidate text; bytes bytea; i integer;
BEGIN
 LOOP
  candidate := ''; bytes := extensions.gen_random_bytes(8);
  FOR i IN 0..7 LOOP candidate := candidate || substr(alphabet, (get_byte(bytes,i) % length(alphabet))+1, 1); END LOOP;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code=candidate) THEN RETURN candidate; END IF;
 END LOOP;
END; $$;
REVOKE ALL ON FUNCTION public.generate_referral_code() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_referral_code() TO service_role;
UPDATE public.profiles SET referral_code=public.generate_referral_code() WHERE referral_code IS NULL OR referral_code !~ '^[A-HJ-NP-Z2-9]{8}$';
ALTER TABLE public.profiles ALTER COLUMN referral_code SET DEFAULT public.generate_referral_code();
CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_unique ON public.profiles(referral_code);
CREATE OR REPLACE FUNCTION public.set_profile_referral_code() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF TG_OP='INSERT' THEN NEW.referral_code := public.generate_referral_code(); END IF;
 IF auth.role() IN ('authenticated','anon') THEN
  IF TG_OP='UPDATE' AND (NEW.referral_code IS DISTINCT FROM OLD.referral_code OR NEW.referred_by_user_id IS DISTINCT FROM OLD.referred_by_user_id OR NEW.referred_at IS DISTINCT FROM OLD.referred_at) THEN RAISE EXCEPTION 'Referral attribution is server managed'; END IF;
  IF TG_OP='INSERT' AND NEW.referred_by_user_id IS NOT NULL THEN RAISE EXCEPTION 'Referral attribution is server managed'; END IF;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER profile_referral_fields BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_profile_referral_code();
CREATE TABLE public.referrals (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 referrer_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 referred_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
 referred_email text NOT NULL,
 source text NOT NULL DEFAULT 'link' CHECK(source IN ('link','whatsapp','email')),
 status text NOT NULL DEFAULT 'invited' CHECK(status IN ('invited','signed_up','purchased','rewarded','voided')),
 created_at timestamptz NOT NULL DEFAULT now(), signed_up_at timestamptz, purchased_at timestamptz,
 stripe_session_id text UNIQUE, order_amount_usd numeric,
 friend_code text UNIQUE, friend_code_expires_at timestamptz, friend_code_redeemed_at timestamptz,
 reward_code text UNIQUE, reward_issued_at timestamptz, reward_expires_at timestamptz, reward_redeemed_at timestamptz,
 friend_promotion_id text, reward_promotion_id text,
 friend_email_sent_at timestamptz, reward_email_sent_at timestamptz,
 UNIQUE(referred_email), UNIQUE(referred_user_id)
);
GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Referrers read own referrals" ON public.referrals FOR SELECT TO authenticated USING(auth.uid()=referrer_user_id);
CREATE POLICY "Admins read referrals" ON public.referrals FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'::public.app_role));
CREATE TABLE public.referral_paid_purchases (
 session_id text PRIMARY KEY, user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
 paid_at timestamptz NOT NULL, amount_usd numeric NOT NULL
);
GRANT ALL ON public.referral_paid_purchases TO service_role;
ALTER TABLE public.referral_paid_purchases ENABLE ROW LEVEL SECURITY;
INSERT INTO public.referral_paid_purchases(session_id,user_id,paid_at,amount_usd)
SELECT stripe_session_id,user_id,COALESCE(purchased_at,created_at),COALESCE(amount_paid_cents::numeric/100,amount)
FROM public.subscriptions WHERE stripe_session_id IS NOT NULL AND COALESCE(amount_paid_cents::numeric/100,amount)>0
ON CONFLICT(session_id) DO NOTHING;
CREATE OR REPLACE FUNCTION public.claim_signup_referral(p_user_id uuid,p_code text,p_source text DEFAULT 'link') RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE buyer public.profiles; referrer public.profiles; referral_id uuid;
BEGIN
 SELECT * INTO buyer FROM public.profiles WHERE id=p_user_id FOR UPDATE;
 SELECT * INTO referrer FROM public.profiles WHERE referral_code=p_code;
 IF buyer.id IS NULL OR referrer.id IS NULL OR buyer.id=referrer.id OR lower(trim(buyer.email))=lower(trim(referrer.email)) THEN RETURN NULL; END IF;
 IF buyer.referred_by_user_id IS NOT NULL AND buyer.referred_by_user_id<>referrer.id THEN RETURN NULL; END IF;
 INSERT INTO public.referrals(referrer_user_id,referred_user_id,referred_email,source,status,signed_up_at)
 VALUES(referrer.id,buyer.id,lower(trim(buyer.email)),p_source,'signed_up',now())
 ON CONFLICT(referred_email) DO UPDATE SET referred_user_id=EXCLUDED.referred_user_id,signed_up_at=COALESCE(referrals.signed_up_at,now()),status=CASE WHEN referrals.status='invited' THEN 'signed_up' ELSE referrals.status END
 WHERE referrals.referrer_user_id=EXCLUDED.referrer_user_id AND (referrals.referred_user_id IS NULL OR referrals.referred_user_id=EXCLUDED.referred_user_id)
 RETURNING id INTO referral_id;
 IF referral_id IS NOT NULL THEN UPDATE public.profiles SET referred_by_user_id=referrer.id,referred_at=COALESCE(referred_at,now()) WHERE id=buyer.id; END IF;
 RETURN referral_id;
END; $$;
REVOKE ALL ON FUNCTION public.claim_signup_referral(uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_signup_referral(uuid,text,text) TO service_role;
CREATE OR REPLACE FUNCTION public.record_referral_paid_purchase(p_user_id uuid,p_session_id text,p_paid_at timestamptz,p_amount numeric) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE first_session text;
BEGIN
 PERFORM 1 FROM public.profiles WHERE id=p_user_id FOR UPDATE;
 INSERT INTO public.referral_paid_purchases(session_id,user_id,paid_at,amount_usd) VALUES(p_session_id,p_user_id,p_paid_at,p_amount) ON CONFLICT(session_id) DO NOTHING;
 SELECT session_id INTO first_session FROM public.referral_paid_purchases WHERE user_id=p_user_id ORDER BY paid_at,session_id LIMIT 1;
 RETURN first_session;
END; $$;
REVOKE ALL ON FUNCTION public.record_referral_paid_purchase(uuid,text,timestamptz,numeric) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_referral_paid_purchase(uuid,text,timestamptz,numeric) TO service_role;
CREATE OR REPLACE FUNCTION public.erase_referral_personal_data() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 DELETE FROM public.referrals WHERE referrer_user_id=OLD.id OR referred_user_id=OLD.id OR lower(trim(referred_email))=lower(trim(OLD.email));
 RETURN OLD;
END; $$;
CREATE TRIGGER erase_referrals_before_profile_delete BEFORE DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.erase_referral_personal_data();
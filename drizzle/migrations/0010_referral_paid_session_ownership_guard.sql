CREATE OR REPLACE FUNCTION public.record_referral_paid_purchase(p_user_id uuid,p_session_id text,p_paid_at timestamptz,p_amount numeric) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE first_session text; existing_user uuid;
BEGIN
 IF p_amount<=0 THEN RAISE EXCEPTION 'Only positive paid purchases qualify'; END IF;
 PERFORM 1 FROM public.profiles WHERE id=p_user_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Buyer profile not found'; END IF;
 SELECT user_id INTO existing_user FROM public.referral_paid_purchases WHERE session_id=p_session_id;
 IF FOUND AND existing_user IS DISTINCT FROM p_user_id THEN RAISE EXCEPTION 'Paid session belongs to another account'; END IF;
 INSERT INTO public.referral_paid_purchases(session_id,user_id,paid_at,amount_usd) VALUES(p_session_id,p_user_id,p_paid_at,p_amount) ON CONFLICT(session_id) DO NOTHING;
 SELECT session_id INTO first_session FROM public.referral_paid_purchases WHERE user_id=p_user_id ORDER BY paid_at,session_id LIMIT 1;
 RETURN first_session;
END; $$;
REVOKE ALL ON FUNCTION public.record_referral_paid_purchase(uuid,text,timestamptz,numeric) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_referral_paid_purchase(uuid,text,timestamptz,numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_referral_code() TO authenticated;
ALTER TABLE public.profiles ADD CONSTRAINT profile_referral_code_format CHECK (referral_code IS NULL OR referral_code ~ '^[A-HJ-NP-Z2-9]{8}$');
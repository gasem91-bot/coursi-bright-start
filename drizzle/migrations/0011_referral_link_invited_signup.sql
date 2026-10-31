CREATE OR REPLACE FUNCTION public.link_invited_signup(p_user_id uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE buyer public.profiles; referral_id uuid; ref_owner uuid;
BEGIN
 SELECT * INTO buyer FROM public.profiles WHERE id=p_user_id FOR UPDATE;
 IF buyer.id IS NULL OR buyer.email IS NULL THEN RETURN NULL; END IF;
 UPDATE public.referrals SET referred_user_id=buyer.id, status='signed_up', signed_up_at=COALESCE(signed_up_at,now()),
   friend_email_sent_at=COALESCE(friend_email_sent_at, invite_email_sent_at)
 WHERE referred_email=lower(trim(buyer.email)) AND referred_user_id IS NULL AND status='invited' AND referrer_user_id<>buyer.id
   AND (buyer.referred_by_user_id IS NULL OR buyer.referred_by_user_id=referrer_user_id)
 RETURNING id, referrer_user_id INTO referral_id, ref_owner;
 IF referral_id IS NOT NULL THEN UPDATE public.profiles SET referred_by_user_id=ref_owner, referred_at=COALESCE(referred_at,now()) WHERE id=buyer.id; END IF;
 RETURN referral_id;
END; $$;
REVOKE ALL ON FUNCTION public.link_invited_signup(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.link_invited_signup(uuid) TO service_role;
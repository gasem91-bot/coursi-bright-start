ALTER TABLE public.referrals ADD COLUMN friend_issued_at timestamptz;
ALTER TABLE public.referrals ADD COLUMN invite_email_sent_at timestamptz;
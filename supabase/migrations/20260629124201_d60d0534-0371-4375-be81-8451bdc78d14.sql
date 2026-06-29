
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nationality_code text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nationality_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nationality_flag text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak_days integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_date date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp_points integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_prefs jsonb NOT NULL DEFAULT '{"email": true, "whatsapp": false, "reminders": true}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'dark';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telegram_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;

UPDATE public.profiles
   SET referral_code = 'COURS-' || UPPER(SUBSTRING(id::text, 1, 6))
 WHERE referral_code IS NULL;

ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS amount numeric NOT NULL DEFAULT 0;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS stripe_session_id text;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- Update handle_new_user to backfill referral_code for new signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, level, referral_code)
  VALUES (NEW.id, NEW.email, 'beginner', 'COURS-' || UPPER(SUBSTRING(NEW.id::text, 1, 6)));
  INSERT INTO public.subscriptions (user_id, tier, status)
  VALUES (NEW.id, 'course', 'active');
  RETURN NEW;
END;
$function$;

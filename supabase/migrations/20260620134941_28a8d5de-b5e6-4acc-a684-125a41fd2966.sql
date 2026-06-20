ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS country_name text,
  ADD COLUMN IF NOT EXISTS country_flag text;
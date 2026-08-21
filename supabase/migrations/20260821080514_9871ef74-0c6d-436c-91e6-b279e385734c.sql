ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'web';

ALTER TABLE public.support_tickets
  ALTER COLUMN user_id DROP NOT NULL;
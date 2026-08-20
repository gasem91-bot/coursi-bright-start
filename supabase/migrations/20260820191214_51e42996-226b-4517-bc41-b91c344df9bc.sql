CREATE TABLE public.certificate_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  level TEXT NOT NULL,
  certificate_id TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, level)
);
GRANT SELECT ON public.certificate_emails TO authenticated;
GRANT ALL ON public.certificate_emails TO service_role;
ALTER TABLE public.certificate_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own certificate emails" ON public.certificate_emails FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "No user inserts" ON public.certificate_emails FOR INSERT TO authenticated, anon WITH CHECK (false);
CREATE POLICY "No user updates" ON public.certificate_emails FOR UPDATE TO authenticated, anon USING (false);
CREATE POLICY "No user deletes" ON public.certificate_emails FOR DELETE TO authenticated, anon USING (false);
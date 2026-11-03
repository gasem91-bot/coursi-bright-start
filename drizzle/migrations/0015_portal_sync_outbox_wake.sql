-- lovable-cron-fallback-reviewed: owner requires 5-minute outbox retries; job is armed on enqueue and unscheduled when the queue drains
CREATE OR REPLACE FUNCTION public.arm_portal_sync_outbox()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'portal-sync-outbox') THEN
    PERFORM cron.schedule('portal-sync-outbox', '*/5 * * * *', $job$
      select net.http_post(
        url:='https://project--88813aa6-2cb1-47db-89bc-d8c534f1b71e.lovable.app/api/public/portal-sync-outbox',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer sb_publishable_C_nSEf4nNpi5W2gfpnNv_Q_T5YuNIam"}'::jsonb,
        body:='{}'::jsonb);
    $job$);
  END IF;
  RETURN NEW;
END;
$fn$;
REVOKE EXECUTE ON FUNCTION public.arm_portal_sync_outbox() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER sync_outbox_arm AFTER INSERT ON public.sync_outbox
  FOR EACH STATEMENT EXECUTE FUNCTION public.arm_portal_sync_outbox();

CREATE OR REPLACE FUNCTION public.disarm_portal_sync_outbox_if_idle()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  IF EXISTS (SELECT 1 FROM public.sync_outbox WHERE status = 'pending') THEN
    RETURN false;
  END IF;
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'portal-sync-outbox';
  RETURN true;
END;
$fn$;
REVOKE EXECUTE ON FUNCTION public.disarm_portal_sync_outbox_if_idle() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.disarm_portal_sync_outbox_if_idle() TO service_role;
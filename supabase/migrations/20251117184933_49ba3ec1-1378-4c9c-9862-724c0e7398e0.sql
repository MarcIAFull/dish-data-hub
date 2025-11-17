-- ⏰ Configurar cron job para processar mensagens pendentes a cada minuto
SET search_path TO extensions;

-- Criar job que roda a cada minuto
SELECT cron.schedule(
  'expire-pending-messages-job',
  '* * * * *', -- A cada minuto
  $$
  SELECT net.http_post(
    url := 'https://wsyddfdfzfkhkkxmrmxf.supabase.co/functions/v1/expire-pending-messages',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzeWRkZmRmemZraGtreG1ybXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTY1OTYsImV4cCI6MjA3MTg5MjU5Nn0.dK5-PyXsLvD60elEGQWHc3t-lDg9klBqNbjuektKIhE'
    ),
    body := jsonb_build_object('time', now()),
    timeout_milliseconds := 30000
  ) as request_id;
  $$
);
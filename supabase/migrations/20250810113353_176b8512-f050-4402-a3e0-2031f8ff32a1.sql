
ALTER TABLE public.processed_upgrade_sessions
ADD COLUMN IF NOT EXISTS email text;

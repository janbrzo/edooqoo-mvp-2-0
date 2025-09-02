-- Dodaj brakującą kolumnę email do tabeli processed_upgrade_sessions
ALTER TABLE public.processed_upgrade_sessions 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Upewnij się że rozszerzenie pgcrypto jest włączone (potrzebne dla gen_random_bytes w funkcji generate_worksheet_share_token)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
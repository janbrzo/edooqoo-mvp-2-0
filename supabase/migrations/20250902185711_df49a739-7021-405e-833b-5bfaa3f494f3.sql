-- Napraw problem z RLS dla download_sessions - error 406 może oznaczać problem z uprawnieniami
-- Dodaj policy dla anonymous użytkowników do download_sessions

CREATE POLICY IF NOT EXISTS "Anonymous can read download sessions by token" 
ON public.download_sessions 
FOR SELECT 
USING (true);

-- Również sprawdź czy gen_random_bytes działa poprawnie
-- Test czy funkcja generate_worksheet_share_token może być wywołana
-- Może problem jest z enkodowaniem tokenu

-- Sprawdź czy wszystkie potrzebne rozszerzenia są włączone
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
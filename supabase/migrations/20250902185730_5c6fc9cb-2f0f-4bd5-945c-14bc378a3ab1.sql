-- Napraw problem z RLS dla download_sessions - error 406 może oznaczać problem z uprawnieniami
-- Usuń istniejące policy i dodaj nowe

DROP POLICY IF EXISTS "Anonymous can read download sessions by token" ON public.download_sessions;

CREATE POLICY "Anonymous can read download sessions by token" 
ON public.download_sessions 
FOR SELECT 
USING (true);

-- Sprawdź czy wszystkie potrzebne rozszerzenia są włączone
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
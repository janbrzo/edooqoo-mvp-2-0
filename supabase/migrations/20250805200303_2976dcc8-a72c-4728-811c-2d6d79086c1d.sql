
-- MIGRACJA 1: Aktualizacja tabeli profiles
-- Dodanie nowych kolumn zgodnie z nowym systemem tokenów

-- Dodanie kolumny email (może być NULL dla istniejących rekordów)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Dodanie kolumny is_tokens_frozen (domyślnie FALSE)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_tokens_frozen BOOLEAN NOT NULL DEFAULT FALSE;

-- Dodanie kumulacyjnych statystyk
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_worksheets_created INTEGER DEFAULT 0;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_tokens_consumed INTEGER DEFAULT 0;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_tokens_received INTEGER DEFAULT 0;

-- Zmiana nazwy token_balance na available_tokens (zachowując dane)
ALTER TABLE public.profiles 
RENAME COLUMN token_balance TO available_tokens;

-- MIGRACJA 2: Aktualizacja tabeli subscriptions
-- Dodanie kolumny email dla lepszej synchronizacji ze Stripe
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS email TEXT;

-- MIGRACJA 3: Utworzenie tabeli subscription_events
-- Tabela do logowania wszystkich eventów subskrypcyjnych
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'upgraded', 'downgraded', 'renewed', 'cancelled', 'expired', 'reactivated')),
  event_data JSONB DEFAULT '{}',
  stripe_event_id TEXT,
  old_plan_type TEXT,
  new_plan_type TEXT,
  tokens_added INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Warsaw')
);

-- Indeksy dla wydajności
CREATE INDEX IF NOT EXISTS idx_subscription_events_teacher_id ON public.subscription_events(teacher_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_event_type ON public.subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON public.subscription_events(created_at);

-- MIGRACJA 4: RLS policies dla subscription_events
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view their own subscription events" 
ON public.subscription_events 
FOR SELECT 
USING (auth.uid() = teacher_id);

CREATE POLICY "Allow edge functions to manage subscription events" 
ON public.subscription_events 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- MIGRACJA 5: Migracja danych z istniejących rekordów
-- Aktualizuj email w profiles z auth.users jeśli brakuje
UPDATE public.profiles 
SET email = auth_users.email
FROM auth.users AS auth_users
WHERE profiles.id = auth_users.id AND profiles.email IS NULL;

-- Aktualizuj email w subscriptions z profiles jeśli brakuje  
UPDATE public.subscriptions
SET email = profiles.email
FROM public.profiles
WHERE subscriptions.teacher_id = profiles.id AND subscriptions.email IS NULL;

-- MIGRACJA 6: Inicjalizacja kumulacyjnych statystyk dla istniejących użytkowników
-- Policz całkowitą liczbę worksheetów dla każdego użytkownika
UPDATE public.profiles 
SET total_worksheets_created = (
  SELECT COUNT(*) 
  FROM public.worksheets 
  WHERE worksheets.teacher_id = profiles.id
)
WHERE total_worksheets_created = 0;

-- Policz całkowitą liczbę zużytych tokenów z token_transactions
UPDATE public.profiles 
SET total_tokens_consumed = ABS((
  SELECT COALESCE(SUM(amount), 0) 
  FROM public.token_transactions 
  WHERE token_transactions.teacher_id = profiles.id 
  AND transaction_type = 'usage'
))
WHERE total_tokens_consumed = 0;

-- Policz całkowitą liczbę otrzymanych tokenów z token_transactions
UPDATE public.profiles 
SET total_tokens_received = (
  SELECT COALESCE(SUM(amount), 0) 
  FROM public.token_transactions 
  WHERE token_transactions.teacher_id = profiles.id 
  AND transaction_type IN ('purchase', 'rollover')
)
WHERE total_tokens_received = 0;

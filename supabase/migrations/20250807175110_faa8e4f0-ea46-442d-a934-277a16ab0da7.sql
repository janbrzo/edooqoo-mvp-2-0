
-- Zmiana nazw kolumn w tabeli subscriptions dla spójności z profiles
ALTER TABLE subscriptions RENAME COLUMN status TO subscription_status;
ALTER TABLE subscriptions RENAME COLUMN plan_type TO subscription_type;

-- Sprawdzenie i aktualizacja constraint w subscription_events
-- Najpierw sprawdźmy jaki constraint blokuje wpisy
ALTER TABLE subscription_events DROP CONSTRAINT IF EXISTS subscription_events_event_type_check;

-- Dodaj nowy constraint z wszystkimi możliwymi typami eventów
ALTER TABLE subscription_events ADD CONSTRAINT subscription_events_event_type_check 
CHECK (event_type IN (
  'customer.subscription.created',
  'customer.subscription.updated', 
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'created',
  'upgraded',
  'downgraded', 
  'renewed',
  'cancelled',
  'expired',
  'reactivated'
));

-- Oczyszczenie danych dla j4n.brz0+4@gmail.com
UPDATE profiles 
SET 
  available_tokens = 15,
  total_tokens_received = 15,
  subscription_type = CASE 
    WHEN subscription_status = 'cancelled' THEN 'Inactive'
    ELSE subscription_type 
  END
WHERE email = 'j4n.brz0+4@gmail.com';

-- Usunięcie duplikatów z token_transactions dla tego użytkownika
DELETE FROM token_transactions 
WHERE teacher_id = (SELECT id FROM profiles WHERE email = 'j4n.brz0+4@gmail.com')
AND created_at > '2025-08-07 17:00:00'
AND transaction_type = 'purchase';

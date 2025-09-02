-- Problem 1: Włącz rozszerzenie pgcrypto dla funkcji gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Problem 2: Sprawdź czy funkcja generate_worksheet_share_token istnieje i działa
-- Jeśli nie ma problemów z funkcją, sprawdź czy RLS jest poprawnie skonfigurowane

-- Dodaj również debug logging do webhook stripe-webhook
-- Sprawdź czy tabele subscription_events i subscriptions mają odpowiednie triggery
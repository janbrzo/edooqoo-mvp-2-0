
-- Dodaj unikalny indeks na teacher_id w tabeli subscriptions
-- To naprawi problem z upsert w funkcji check-subscription-status
ALTER TABLE public.subscriptions 
ADD CONSTRAINT subscriptions_teacher_id_unique UNIQUE (teacher_id);

-- Dodaj również unikalny indeks na stripe_subscription_id dla większej niezawodności
-- (ten już prawdopodobnie istnieje, ale upewniamy się)
ALTER TABLE public.subscriptions 
ADD CONSTRAINT subscriptions_stripe_subscription_id_unique UNIQUE (stripe_subscription_id);

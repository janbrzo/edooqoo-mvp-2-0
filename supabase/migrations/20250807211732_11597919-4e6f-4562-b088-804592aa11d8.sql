
-- Napraw brakujący rekord w subscriptions dla j4n.brz0+5@gmail.com
-- Najpierw sprawdźmy profil użytkownika
WITH user_profile AS (
  SELECT id, email, subscription_type, subscription_status, subscription_expires_at
  FROM profiles 
  WHERE email = 'j4n.brz0+5@gmail.com'
)
-- Dodaj rekord do subscriptions jeśli nie istnieje
INSERT INTO subscriptions (
  teacher_id,
  email,
  stripe_subscription_id,
  stripe_customer_id,
  subscription_status,
  subscription_type,
  monthly_limit,
  current_period_start,
  current_period_end,
  created_at,
  updated_at
)
SELECT 
  up.id,
  up.email,
  'sub_1Rtax1H4Sb5mBNfbORHhLw5j', -- aktualny stripe_subscription_id z logów
  'cus_SpFPcw2G0xMo5n', -- stripe_customer_id z logów
  'active',
  'side-gig',
  15,
  now() - interval '1 day', -- przykładowa data rozpoczęcia
  up.subscription_expires_at,
  now(),
  now()
FROM user_profile up
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions s 
  WHERE s.teacher_id = up.id
);

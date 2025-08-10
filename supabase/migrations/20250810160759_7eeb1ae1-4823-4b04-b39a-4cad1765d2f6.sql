
-- Backfill miesięcznego licznika dla konta e-mail: j4n.brz0+18@gmail.com
-- Zasada zbieżna z consume_token:
-- - jeśli subskrypcja aktywna lub typ != 'Free Demo' => liczymy wszystkie arkusze w bieżącym miesiącu
-- - w przeciwnym razie odejmujemy 2 pierwsze "demo" (minimum 0)

WITH target AS (
  SELECT 
    id AS teacher_id,
    COALESCE(subscription_status, '') AS subscription_status,
    COALESCE(subscription_type, '') AS subscription_type
  FROM public.profiles
  WHERE email = 'j4n.brz0+18@gmail.com'
  LIMIT 1
),
month_counts AS (
  SELECT 
    t.teacher_id,
    COUNT(w.id)::int AS month_total
  FROM target t
  LEFT JOIN public.worksheets w
    ON w.teacher_id = t.teacher_id
   AND w.created_at >= date_trunc('month', now())
   AND w.created_at < (date_trunc('month', now()) + interval '1 month')
  GROUP BY t.teacher_id
)
UPDATE public.profiles p
SET monthly_worksheets_used = CASE 
  WHEN t.subscription_status IN ('active','active_cancelled') OR t.subscription_type <> 'Free Demo'
    THEN COALESCE(c.month_total, 0)
  ELSE GREATEST(COALESCE(c.month_total, 0) - 2, 0)
END
FROM target t
LEFT JOIN month_counts c ON c.teacher_id = t.teacher_id
WHERE p.id = t.teacher_id;

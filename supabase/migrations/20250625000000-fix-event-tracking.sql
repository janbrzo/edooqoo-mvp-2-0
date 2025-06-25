
-- Drop the existing conversion_funnel view
DROP VIEW IF EXISTS public.conversion_funnel;

-- Create the updated conversion_funnel view with correct event names
CREATE OR REPLACE VIEW public.conversion_funnel AS
SELECT 
  DATE(created_at) as date,
  COUNT(CASE WHEN event_type = 'form_start' THEN 1 END) as form_starts,
  COUNT(CASE WHEN event_type = 'form_abandon_page_leave' THEN 1 END) as form_abandons_page_leave,
  COUNT(CASE WHEN event_type = 'form_abandon_tab_switch' THEN 1 END) as form_abandons_tab_switch,
  COUNT(CASE WHEN event_type = 'form_submit' THEN 1 END) as form_submits,
  COUNT(CASE WHEN event_type = 'worksheet_generation_start' THEN 1 END) as worksheet_generation_starts,
  COUNT(CASE WHEN event_type = 'worksheet_generation_complete' THEN 1 END) as worksheet_generation_completes,
  COUNT(DISTINCT CASE WHEN event_type = 'worksheet_view_time' THEN user_identifier END) as worksheet_views,
  COUNT(CASE WHEN event_type = 'worksheet_view_end_page_leave' THEN 1 END) as worksheet_view_ends_page_leave,
  COUNT(CASE WHEN event_type = 'worksheet_view_end_tab_switch' THEN 1 END) as worksheet_view_ends_tab_switch,
  COUNT(CASE WHEN event_type = 'download_attempt_locked' THEN 1 END) as download_attempts_locked,
  COUNT(CASE WHEN event_type = 'download_attempt_unlocked' THEN 1 END) as download_attempts_unlocked,
  COUNT(CASE WHEN event_type = 'stripe_payment_clicks' THEN 1 END) as stripe_payment_clicks,
  COUNT(CASE WHEN event_type = 'stripe_payment_success' THEN 1 END) as stripe_payment_success
FROM public.user_events 
GROUP BY DATE(created_at)
ORDER BY date DESC;

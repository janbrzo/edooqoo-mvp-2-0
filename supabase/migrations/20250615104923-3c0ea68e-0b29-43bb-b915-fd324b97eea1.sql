
-- 1. Wyczyszczenie testowych danych
TRUNCATE TABLE public.worksheets RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.feedbacks RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.export_payments RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.download_sessions RESTART IDENTITY CASCADE;

-- 2. Utworzenie tabeli do trackingu eventów użytkowników
CREATE TABLE public.user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_identifier TEXT NOT NULL, -- IP lub user_id
  event_type TEXT NOT NULL, -- 'form_start', 'form_abandon', 'worksheet_view_time', 'download_attempt', 'payment_click'
  event_data JSONB, -- dodatkowe dane o evencie
  created_at TIMESTAMP WITH TIME ZONE DEFAULT (now() AT TIME ZONE 'Europe/Warsaw'),
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT -- do grupowania eventów w sesje
);

-- Indeksy dla lepszej wydajności
CREATE INDEX user_events_type_idx ON public.user_events (event_type);
CREATE INDEX user_events_created_at_idx ON public.user_events (created_at);
CREATE INDEX user_events_user_identifier_idx ON public.user_events (user_identifier);

-- Rozszerzenie tabeli worksheets o dodatkowe pola trackingowe
ALTER TABLE public.worksheets 
ADD COLUMN IF NOT EXISTS session_id TEXT,
ADD COLUMN IF NOT EXISTS referrer_url TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Funkcja do łatwego wstawiania eventów
CREATE OR REPLACE FUNCTION public.track_user_event(
  p_user_identifier TEXT,
  p_event_type TEXT,
  p_event_data JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_event_id UUID;
BEGIN
  INSERT INTO public.user_events (
    user_identifier,
    event_type,
    event_data,
    ip_address,
    user_agent,
    session_id
  )
  VALUES (
    p_user_identifier,
    p_event_type,
    p_event_data,
    p_ip_address,
    p_user_agent,
    p_session_id
  )
  RETURNING id INTO new_event_id;
  
  RETURN new_event_id;
END;
$$;

-- Widok do łatwego monitorowania conversion funnel
CREATE OR REPLACE VIEW public.conversion_funnel AS
SELECT 
  DATE(created_at) as date,
  COUNT(CASE WHEN event_type = 'form_start' THEN 1 END) as form_starts,
  COUNT(CASE WHEN event_type = 'form_abandon' THEN 1 END) as form_abandons,
  COUNT(DISTINCT CASE WHEN event_type = 'worksheet_view_time' THEN user_identifier END) as worksheet_views,
  COUNT(CASE WHEN event_type = 'download_attempt' THEN 1 END) as download_attempts,
  COUNT(CASE WHEN event_type = 'payment_click' THEN 1 END) as payment_clicks
FROM public.user_events 
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Widok do analizy najpopularniejszych parametrów
CREATE OR REPLACE VIEW public.popular_form_params AS
SELECT 
  form_data->>'lessonTime' as lesson_time,
  form_data->>'englishLevel' as english_level,
  form_data->>'lessonTopic' as lesson_topic,
  form_data->>'lessonGoal' as lesson_goal,
  COUNT(*) as usage_count,
  ROUND(AVG(generation_time_seconds), 2) as avg_generation_time
FROM public.worksheets 
WHERE form_data IS NOT NULL
GROUP BY 
  form_data->>'lessonTime',
  form_data->>'englishLevel',
  form_data->>'lessonTopic',
  form_data->>'lessonGoal'
ORDER BY usage_count DESC;

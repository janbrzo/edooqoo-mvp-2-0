-- KROK 1: Sprawdzenie wszystkich wersji funkcji insert_worksheet_bypass_limit
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as parameters,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'insert_worksheet_bypass_limit';

-- KROK 2: Usunięcie WSZYSTKICH wersji funkcji insert_worksheet_bypass_limit
DROP FUNCTION IF EXISTS public.insert_worksheet_bypass_limit(text, jsonb, text, text, uuid, text, text, text, integer);
DROP FUNCTION IF EXISTS public.insert_worksheet_bypass_limit(text, jsonb, text, text, uuid, text, text, text, integer, text);
DROP FUNCTION IF EXISTS public.insert_worksheet_bypass_limit(text, jsonb, text, text, uuid, text, text, text, integer, text, text);
DROP FUNCTION IF EXISTS public.insert_worksheet_bypass_limit(text, jsonb, text, text, uuid, text, text, text, integer, text, text, uuid);
DROP FUNCTION IF EXISTS public.insert_worksheet_bypass_limit(text, jsonb, text, text, uuid, text, text, text, integer, text, text, uuid, uuid);
DROP FUNCTION IF EXISTS public.insert_worksheet_bypass_limit(text, jsonb, text, jsonb, uuid, text, text, text, text);

-- KROK 3: Utworzenie TYLKO jednej poprawnej funkcji (11 parametrów)
CREATE OR REPLACE FUNCTION public.insert_worksheet_bypass_limit(
  p_prompt TEXT,
  p_form_data JSONB,
  p_ai_response TEXT,
  p_html_content TEXT,
  p_user_id UUID,
  p_ip_address TEXT,
  p_status TEXT,
  p_title TEXT,
  p_generation_time_seconds INTEGER,
  p_country TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  title TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id UUID;
  created_timestamp TIMESTAMP WITH TIME ZONE;
BEGIN
  -- No limits - insert directly without any checks
  INSERT INTO public.worksheets (
    prompt,
    form_data,
    ai_response,
    html_content,
    user_id,
    ip_address,
    status,
    generation_time_seconds,
    title,
    country,
    city
  )
  VALUES (
    p_prompt,
    p_form_data,
    p_ai_response,
    p_html_content,
    p_user_id,
    p_ip_address,
    p_status,
    p_generation_time_seconds,
    p_title,
    p_country,
    p_city
  )
  RETURNING worksheets.id, worksheets.created_at INTO new_id, created_timestamp;
  
  RETURN QUERY SELECT new_id, created_timestamp, p_title;
END;
$$;
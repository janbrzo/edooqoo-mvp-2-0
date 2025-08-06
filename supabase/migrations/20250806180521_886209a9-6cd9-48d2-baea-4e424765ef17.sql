
-- Zastąp starą funkcję consume_token nową wersją używającą uproszczony system tokenów
CREATE OR REPLACE FUNCTION public.consume_token(p_teacher_id uuid, p_worksheet_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  current_available INTEGER;
  tokens_frozen BOOLEAN;
  monthly_limit INTEGER;
  monthly_used INTEGER;
BEGIN
  -- Pobierz aktualne dane z uproszczonej struktury
  SELECT 
    available_tokens, 
    is_tokens_frozen,
    COALESCE(monthly_worksheet_limit, 0),
    COALESCE(monthly_worksheets_used, 0)
  INTO current_available, tokens_frozen, monthly_limit, monthly_used
  FROM public.profiles 
  WHERE id = p_teacher_id;
  
  -- Sprawdź czy tokeny są zamrożone
  IF tokens_frozen = TRUE THEN
    RETURN FALSE;
  END IF;
  
  -- PRIORYTET 1: Sprawdź available_tokens (purchased/subscription tokens)
  IF current_available > 0 THEN
    UPDATE public.profiles 
    SET 
      available_tokens = available_tokens - 1,
      total_tokens_consumed = total_tokens_consumed + 1,
      total_worksheets_created = total_worksheets_created + 1
    WHERE id = p_teacher_id;
    
    INSERT INTO public.token_transactions (teacher_id, transaction_type, amount, description, reference_id)
    VALUES (p_teacher_id, 'usage', -1, 'Worksheet generation (from available tokens)', p_worksheet_id);
    
    RETURN TRUE;
  END IF;
  
  -- PRIORYTET 2: Sprawdź monthly limit (tylko jeśli nie ma available_tokens)
  IF monthly_limit > 0 AND monthly_used < monthly_limit THEN
    UPDATE public.profiles 
    SET 
      monthly_worksheets_used = monthly_worksheets_used + 1,
      total_worksheets_created = total_worksheets_created + 1
    WHERE id = p_teacher_id;
    
    INSERT INTO public.token_transactions (teacher_id, transaction_type, amount, description, reference_id)
    VALUES (p_teacher_id, 'usage', 0, 'Worksheet generation (from monthly limit)', p_worksheet_id);
    
    RETURN TRUE;
  END IF;
  
  -- Brak dostępnych tokenów
  RETURN FALSE;
END;
$function$

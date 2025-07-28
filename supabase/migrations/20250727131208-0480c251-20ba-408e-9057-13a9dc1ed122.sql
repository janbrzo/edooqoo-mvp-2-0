
-- Dodaj pole rollover_tokens do tabeli profiles
ALTER TABLE public.profiles 
ADD COLUMN rollover_tokens INTEGER NOT NULL DEFAULT 0;

-- Zmodyfikuj funkcję consume_token aby obsługiwała rollover tokens
CREATE OR REPLACE FUNCTION public.consume_token(p_teacher_id uuid, p_worksheet_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  current_balance INTEGER;
  current_rollover INTEGER;
  monthly_limit INTEGER;
  monthly_used INTEGER;
BEGIN
  -- Pobierz aktualne dane
  SELECT 
    token_balance, 
    rollover_tokens,
    COALESCE(monthly_worksheet_limit, 0),
    COALESCE(monthly_worksheets_used, 0)
  INTO current_balance, current_rollover, monthly_limit, monthly_used
  FROM public.profiles 
  WHERE id = p_teacher_id;
  
  -- Sprawdź purchased tokens (priorytet 1)
  IF current_balance > 0 THEN
    UPDATE public.profiles 
    SET token_balance = token_balance - 1
    WHERE id = p_teacher_id;
    
    INSERT INTO public.token_transactions (teacher_id, transaction_type, amount, description, reference_id)
    VALUES (p_teacher_id, 'usage', -1, 'Worksheet generation (from purchased tokens)', p_worksheet_id);
    
    RETURN TRUE;
  END IF;
  
  -- Sprawdź rollover tokens (priorytet 2)
  IF current_rollover > 0 THEN
    UPDATE public.profiles 
    SET rollover_tokens = rollover_tokens - 1
    WHERE id = p_teacher_id;
    
    INSERT INTO public.token_transactions (teacher_id, transaction_type, amount, description, reference_id)
    VALUES (p_teacher_id, 'usage', -1, 'Worksheet generation (from rollover tokens)', p_worksheet_id);
    
    RETURN TRUE;
  END IF;
  
  -- Sprawdź monthly limit (priorytet 3)
  IF monthly_limit > 0 AND monthly_used < monthly_limit THEN
    UPDATE public.profiles 
    SET monthly_worksheets_used = monthly_worksheets_used + 1
    WHERE id = p_teacher_id;
    
    INSERT INTO public.token_transactions (teacher_id, transaction_type, amount, description, reference_id)
    VALUES (p_teacher_id, 'usage', 0, 'Worksheet generation (from monthly limit)', p_worksheet_id);
    
    RETURN TRUE;
  END IF;
  
  -- Brak dostępnych tokenów
  RETURN FALSE;
END;
$function$;

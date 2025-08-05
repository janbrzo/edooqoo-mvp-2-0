
CREATE OR REPLACE FUNCTION public.consume_token(p_teacher_id uuid, p_worksheet_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  current_available INTEGER;
  tokens_frozen BOOLEAN;
BEGIN
  -- Pobierz aktualne dane z uproszczonej struktury
  SELECT 
    available_tokens, 
    is_tokens_frozen
  INTO current_available, tokens_frozen
  FROM public.profiles 
  WHERE id = p_teacher_id;
  
  -- Sprawdź czy tokeny są zamrożone
  IF tokens_frozen = TRUE THEN
    RETURN FALSE;
  END IF;
  
  -- Sprawdź czy są dostępne tokeny
  IF current_available <= 0 THEN
    RETURN FALSE;
  END IF;
  
  -- Zużyj jeden token
  UPDATE public.profiles 
  SET 
    available_tokens = available_tokens - 1,
    total_tokens_consumed = total_tokens_consumed + 1,
    total_worksheets_created = total_worksheets_created + 1
  WHERE id = p_teacher_id;
  
  -- Zaloguj transakcję
  INSERT INTO public.token_transactions (teacher_id, transaction_type, amount, description, reference_id)
  VALUES (p_teacher_id, 'usage', -1, 'Worksheet generation', p_worksheet_id);
  
  RETURN TRUE;
END;
$function$

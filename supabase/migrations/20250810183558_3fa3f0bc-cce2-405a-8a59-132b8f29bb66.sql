
-- 1) Funkcja consume_token – przestajemy modyfikować available_tokens bezpośrednio,
--    zwiększamy tylko total_tokens_consumed (i pozostałe liczniki). available_tokens
--    będzie wyliczane triggerem z total_tokens_received - total_tokens_consumed.
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
  total_created INTEGER;
  sub_type TEXT;
  sub_status TEXT;
  should_count_monthly BOOLEAN := FALSE;
BEGIN
  -- Load current profile state
  SELECT 
    COALESCE(available_tokens, 0), 
    COALESCE(is_tokens_frozen, FALSE),
    COALESCE(monthly_worksheet_limit, 0),
    COALESCE(monthly_worksheets_used, 0),
    COALESCE(total_worksheets_created, 0),
    subscription_type,
    subscription_status
  INTO current_available, tokens_frozen, monthly_limit, monthly_used, total_created, sub_type, sub_status
  FROM public.profiles 
  WHERE id = p_teacher_id;

  -- Block if tokens are frozen
  IF tokens_frozen = TRUE THEN
    RETURN FALSE;
  END IF;

  -- PRIORITY 1: monthly limit
  IF monthly_limit > 0 AND monthly_used < monthly_limit THEN
    UPDATE public.profiles 
    SET 
      monthly_worksheets_used = monthly_worksheets_used + 1,
      total_worksheets_created = COALESCE(total_worksheets_created, 0) + 1,
      total_tokens_consumed = COALESCE(total_tokens_consumed, 0) + 1
    WHERE id = p_teacher_id;

    INSERT INTO public.token_transactions (teacher_id, transaction_type, amount, description, reference_id)
    VALUES (p_teacher_id, 'usage', 0, 'Worksheet generation (from monthly limit)', p_worksheet_id);

    RETURN TRUE;
  END IF;

  -- PRIORITY 2: available tokens (purchased/subscription/demo) - NIE zmieniamy available_tokens,
  --             jedynie zwiększamy total_tokens_consumed, a available_tokens policzy trigger.
  IF current_available > 0 THEN
    -- Count toward monthly_worksheets_used jeśli spełnione warunki (pozostawiamy dotychczasową logikę)
    should_count_monthly := (COALESCE(sub_status, '') IN ('active','active_cancelled'))
                            OR (COALESCE(sub_type, '') <> 'Free Demo')
                            OR (total_created >= 2);

    UPDATE public.profiles 
    SET 
      total_tokens_consumed = COALESCE(total_tokens_consumed, 0) + 1,
      total_worksheets_created = COALESCE(total_worksheets_created, 0) + 1,
      monthly_worksheets_used = monthly_worksheets_used + CASE WHEN should_count_monthly THEN 1 ELSE 0 END
    WHERE id = p_teacher_id;
    
    INSERT INTO public.token_transactions (teacher_id, transaction_type, amount, description, reference_id)
    VALUES (p_teacher_id, 'usage', -1, 'Worksheet generation (from available tokens)', p_worksheet_id);
    
    RETURN TRUE;
  END IF;

  -- No available options
  RETURN FALSE;
END;
$function$;

-- 2) Naprawa add_tokens – zwiększamy total_tokens_received i logujemy transakcję.
CREATE OR REPLACE FUNCTION public.add_tokens(p_teacher_id uuid, p_amount integer, p_description text, p_reference_id uuid DEFAULT NULL::uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Zwiększ sumę otrzymanych tokenów
  UPDATE public.profiles 
  SET total_tokens_received = COALESCE(total_tokens_received, 0) + GREATEST(p_amount, 0)
  WHERE id = p_teacher_id;
  
  -- Zaloguj transakcję "purchase"
  INSERT INTO public.token_transactions (teacher_id, transaction_type, amount, description, reference_id)
  VALUES (p_teacher_id, 'purchase', p_amount, p_description, p_reference_id);
END;
$function$;

-- 3) Funkcja triggera do spójności available_tokens = total_tokens_received - total_tokens_consumed
CREATE OR REPLACE FUNCTION public.profiles_sync_available_tokens()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Przy INSERT: jeśli total_tokens_received = 0, a available_tokens > 0 (np. 2 Free Demo z defaultu),
  --              to przenieś tę wartość do total_tokens_received, aby zachować inwariant.
  IF TG_OP = 'INSERT' THEN
    IF COALESCE(NEW.total_tokens_received, 0) = 0 AND COALESCE(NEW.available_tokens, 0) > 0 THEN
      NEW.total_tokens_received := COALESCE(NEW.available_tokens, 0) + COALESCE(NEW.total_tokens_consumed, 0);
    END IF;
  END IF;

  -- Ustal always: available_tokens = max(0, received - consumed)
  NEW.available_tokens := GREATEST(
    0, 
    COALESCE(NEW.total_tokens_received, 0) - COALESCE(NEW.total_tokens_consumed, 0)
  );

  RETURN NEW;
END;
$function$;

-- 4) Trigger na INSERT/UPDATE w profiles
DROP TRIGGER IF EXISTS trg_profiles_sync_available_tokens ON public.profiles;
CREATE TRIGGER trg_profiles_sync_available_tokens
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.profiles_sync_available_tokens();

-- 5) Jednorazowe wyrównanie danych historycznych:
--    (a) najpierw upewniamy się, że total_tokens_received >= available_tokens + total_tokens_consumed
UPDATE public.profiles
SET total_tokens_received = GREATEST(
  COALESCE(total_tokens_received, 0),
  COALESCE(available_tokens, 0) + COALESCE(total_tokens_consumed, 0)
);

--    (b) potem wyliczamy available_tokens = received - consumed
UPDATE public.profiles
SET available_tokens = GREATEST(
  0,
  COALESCE(total_tokens_received, 0) - COALESCE(total_tokens_consumed, 0)
);

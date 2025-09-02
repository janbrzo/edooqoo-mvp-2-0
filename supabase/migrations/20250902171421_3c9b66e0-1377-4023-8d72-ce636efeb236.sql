-- ===== KRYTYCZNA NAPRAWA: PRZYWRÓCENIE UPRAWNIEJ DO SCHEMA PUBLIC =====

-- KROK 1: Przywróć uprawnienia na schema public (GŁÓWNY PROBLEM!)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- KROK 2: Ustaw domyślne uprawnienia dla przyszłych obiektów
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

-- KROK 3: Napraw wszystkie funkcje database - dodaj search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = (now() AT TIME ZONE 'Europe/Warsaw');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$function$;

CREATE OR REPLACE FUNCTION public.profiles_sync_available_tokens()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.add_tokens(p_teacher_id uuid, p_amount integer, p_description text, p_reference_id uuid DEFAULT NULL::uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.consume_token(p_teacher_id uuid, p_worksheet_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

  -- PRIORITY 2: available tokens (purchased/subscription/demo)
  IF current_available > 0 THEN
    -- Count toward monthly_worksheets_used jeśli spełnione warunki
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

CREATE OR REPLACE FUNCTION public.get_token_balance(p_teacher_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN COALESCE(
    (SELECT available_tokens FROM public.profiles WHERE id = p_teacher_id),
    0
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_worksheet_share_token(p_worksheet_id uuid, p_teacher_id uuid, p_expires_hours integer DEFAULT 168)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  new_token TEXT;
BEGIN
  -- Generuj unikalny token używając hex encoding
  new_token := encode(gen_random_bytes(32), 'hex');
  
  -- Zaktualizuj worksheet z nowym tokenem
  UPDATE public.worksheets 
  SET 
    share_token = new_token,
    share_expires_at = NOW() + (p_expires_hours || ' hours')::interval
  WHERE id = p_worksheet_id 
    AND teacher_id = p_teacher_id 
    AND deleted_at IS NULL;
  
  IF FOUND THEN
    RETURN new_token;
  ELSE
    RETURN NULL;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_worksheet_by_share_token(p_share_token text)
RETURNS TABLE(id uuid, title text, ai_response text, html_content text, created_at timestamp with time zone, teacher_email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.title,
    w.ai_response,
    w.html_content,
    w.created_at,
    w.teacher_email
  FROM public.worksheets w
  WHERE w.share_token = p_share_token
    AND w.deleted_at IS NULL
    AND (w.share_expires_at IS NULL OR w.share_expires_at > NOW());
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_worksheet_download_count(p_worksheet_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE public.worksheets 
  SET 
    download_count = COALESCE(download_count, 0) + 1,
    last_modified_at = now()
  WHERE id = p_worksheet_id
  RETURNING download_count INTO new_count;
  
  RETURN COALESCE(new_count, 0);
END;
$function$;

CREATE OR REPLACE FUNCTION public.insert_worksheet_bypass_limit(p_prompt text, p_form_data jsonb, p_ai_response text, p_html_content text, p_user_id uuid, p_ip_address text, p_status text, p_title text, p_generation_time_seconds integer, p_country text DEFAULT NULL::text, p_city text DEFAULT NULL::text, p_teacher_email text DEFAULT NULL::text)
RETURNS TABLE(id uuid, created_at timestamp with time zone, title text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  new_id UUID;
  created_timestamp TIMESTAMP WITH TIME ZONE;
BEGIN
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
    city,
    teacher_id,
    teacher_email
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
    p_city,
    p_user_id, -- teacher_id = user_id
    p_teacher_email
  )
  RETURNING worksheets.id, worksheets.created_at INTO new_id, created_timestamp;
  
  RETURN QUERY SELECT new_id, created_timestamp, p_title;
END;
$function$;

CREATE OR REPLACE FUNCTION public.soft_delete_user_account(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Oznacz profil jako usunięty
  UPDATE public.profiles 
  SET deleted_at = NOW() 
  WHERE id = user_id AND deleted_at IS NULL;
  
  -- Sprawdź czy aktualizacja się powiodła
  IF FOUND THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reactivate_user_account(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Reaktywuj konto jeśli było usunięte
  UPDATE public.profiles 
  SET deleted_at = NULL 
  WHERE email = user_email AND deleted_at IS NOT NULL;
  
  IF FOUND THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.soft_delete_worksheet(p_worksheet_id uuid, p_teacher_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.worksheets 
  SET deleted_at = NOW() 
  WHERE id = p_worksheet_id 
    AND teacher_id = p_teacher_id 
    AND deleted_at IS NULL;
  
  RETURN FOUND;
END;
$function$;

-- KROK 4: Upewnij się że profile mają trigger
DROP TRIGGER IF EXISTS profiles_sync_available_tokens_trigger ON public.profiles;
CREATE TRIGGER profiles_sync_available_tokens_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_sync_available_tokens();

-- KROK 5: Upewnij się że wszystkie istniejące profile mają właściwe tokeny
UPDATE public.profiles 
SET 
  available_tokens = CASE 
    WHEN available_tokens IS NULL OR available_tokens = 0 THEN 2 
    ELSE available_tokens 
  END,
  total_tokens_received = CASE 
    WHEN total_tokens_received IS NULL OR total_tokens_received = 0 THEN 2 
    ELSE total_tokens_received 
  END
WHERE (available_tokens IS NULL OR available_tokens = 0) 
   OR (total_tokens_received IS NULL OR total_tokens_received = 0);
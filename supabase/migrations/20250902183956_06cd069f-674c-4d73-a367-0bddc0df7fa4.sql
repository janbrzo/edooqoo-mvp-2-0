-- ===== KOMPLEKSOWA NAPRAWA FUNKCJI BAZODANOWYCH =====

-- KROK 1: Aktualizacja funkcji add_tokens - dodanie teacher_email
CREATE OR REPLACE FUNCTION public.add_tokens(p_teacher_id uuid, p_amount integer, p_description text, p_reference_id uuid DEFAULT NULL::uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  teacher_email_var TEXT;
BEGIN
  -- Get teacher email
  SELECT email INTO teacher_email_var
  FROM public.profiles 
  WHERE id = p_teacher_id;
  
  -- Zwiększ sumę otrzymanych tokenów
  UPDATE public.profiles 
  SET total_tokens_received = COALESCE(total_tokens_received, 0) + GREATEST(p_amount, 0)
  WHERE id = p_teacher_id;
  
  -- Zaloguj transakcję "purchase" z emailem nauczyciela
  INSERT INTO public.token_transactions (teacher_id, teacher_email, transaction_type, amount, description, reference_id)
  VALUES (p_teacher_id, teacher_email_var, 'purchase', p_amount, p_description, p_reference_id);
END;
$function$;

-- KROK 2: Aktualizacja funkcji consume_token - dodanie teacher_email
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
  teacher_email_var TEXT;
  should_count_monthly BOOLEAN := FALSE;
BEGIN
  -- Load current profile state + email
  SELECT 
    COALESCE(available_tokens, 0), 
    COALESCE(is_tokens_frozen, FALSE),
    COALESCE(monthly_worksheet_limit, 0),
    COALESCE(monthly_worksheets_used, 0),
    COALESCE(total_worksheets_created, 0),
    subscription_type,
    subscription_status,
    email
  INTO current_available, tokens_frozen, monthly_limit, monthly_used, total_created, sub_type, sub_status, teacher_email_var
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

    INSERT INTO public.token_transactions (teacher_id, teacher_email, transaction_type, amount, description, reference_id)
    VALUES (p_teacher_id, teacher_email_var, 'usage', 0, 'Worksheet generation (from monthly limit)', p_worksheet_id);

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
    
    INSERT INTO public.token_transactions (teacher_id, teacher_email, transaction_type, amount, description, reference_id)
    VALUES (p_teacher_id, teacher_email_var, 'usage', -1, 'Worksheet generation (from available tokens)', p_worksheet_id);
    
    RETURN TRUE;
  END IF;

  -- No available options
  RETURN FALSE;
END;
$function$;

-- KROK 3: Funkcja synchronizacji subscription_events -> subscriptions
CREATE OR REPLACE FUNCTION public.sync_subscription_to_subscriptions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  sub_data JSONB;
  current_period_start_ts TIMESTAMPTZ;
  current_period_end_ts TIMESTAMPTZ;
  monthly_limit_val INTEGER := 0;
BEGIN
  -- Pobierz dane z event_data
  sub_data := NEW.event_data;
  
  -- Ustaw monthly_limit na podstawie plan type
  CASE NEW.new_plan_type
    WHEN 'Side-Gig' THEN monthly_limit_val := 15;
    WHEN 'Full-Time' THEN monthly_limit_val := 50;
    ELSE monthly_limit_val := 0;
  END CASE;
  
  -- Dla subscription.created lub subscription.updated
  IF NEW.event_type IN ('customer.subscription.created', 'customer.subscription.updated') THEN
    -- Oblicz current_period timestamps (Stripe wysyła w sekundach)
    current_period_start_ts := to_timestamp((sub_data->>'current_period_start')::bigint);
    current_period_end_ts := to_timestamp((sub_data->>'current_period_end')::bigint);
    
    -- Upsert do tabeli subscriptions
    INSERT INTO public.subscriptions (
      teacher_id,
      email,
      stripe_customer_id,
      stripe_subscription_id,
      subscription_type,
      subscription_status,
      monthly_limit,
      current_period_start,
      current_period_end
    ) 
    VALUES (
      NEW.teacher_id,
      NEW.email,
      sub_data->>'customer_id',
      sub_data->>'subscription_id',
      NEW.new_plan_type,
      CASE WHEN (sub_data->>'cancel_at_period_end')::boolean THEN 'active_cancelled' ELSE 'active' END,
      monthly_limit_val,
      current_period_start_ts,
      current_period_end_ts
    )
    ON CONFLICT (stripe_subscription_id) 
    DO UPDATE SET
      subscription_type = EXCLUDED.subscription_type,
      subscription_status = EXCLUDED.subscription_status,
      monthly_limit = EXCLUDED.monthly_limit,
      current_period_start = EXCLUDED.current_period_start,
      current_period_end = EXCLUDED.current_period_end,
      updated_at = NOW();
      
    -- Dodaj wpis do processed_upgrade_sessions jeśli to upgrade
    IF NEW.event_type = 'customer.subscription.created' AND NEW.old_plan_type != 'Free Demo' THEN
      INSERT INTO public.processed_upgrade_sessions (
        teacher_id,
        session_id,
        email,
        tokens_added,
        upgrade_details
      ) VALUES (
        NEW.teacher_id,
        NEW.stripe_event_id,
        NEW.email,
        NEW.tokens_added,
        jsonb_build_object(
          'old_plan', NEW.old_plan_type,
          'new_plan', NEW.new_plan_type,
          'event_type', NEW.event_type
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- KROK 4: Trigger na subscription_events
DROP TRIGGER IF EXISTS sync_subscription_trigger ON public.subscription_events;
CREATE TRIGGER sync_subscription_trigger
  AFTER INSERT ON public.subscription_events
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_subscription_to_subscriptions();

-- KROK 5: Dodaj unique constraint na stripe_subscription_id w subscriptions jeśli nie istnieje
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'subscriptions_stripe_subscription_id_key'
  ) THEN
    ALTER TABLE public.subscriptions 
    ADD CONSTRAINT subscriptions_stripe_subscription_id_key 
    UNIQUE (stripe_subscription_id);
  END IF;
END $$;

-- KROK 6: Aktualizuj istniejące transakcje bez teacher_email (opcjonalne - tylko nowe będą miały)
UPDATE public.token_transactions 
SET teacher_email = (
  SELECT email FROM public.profiles WHERE id = token_transactions.teacher_id
)
WHERE teacher_email IS NULL 
AND teacher_id IS NOT NULL;
-- KROK 10: Poprawka logiki processed_upgrade_sessions
-- Każda nowa subskrypcja powinna być zapisana, nie tylko upgrade między płatnymi planami

-- Wstaw wszystkie subscription.created do processed_upgrade_sessions
INSERT INTO public.processed_upgrade_sessions (
  teacher_id,
  session_id,
  email,
  tokens_added,
  upgrade_details
)
SELECT 
  se.teacher_id,
  se.stripe_event_id,
  se.email,
  se.tokens_added,
  jsonb_build_object(
    'old_plan', se.old_plan_type,
    'new_plan', se.new_plan_type,
    'event_type', se.event_type
  )
FROM public.subscription_events se
WHERE se.event_type = 'customer.subscription.created'
ON CONFLICT (session_id) DO NOTHING;

-- Zaktualizuj trigger żeby zapisywał WSZYSTKIE subscription.created
CREATE OR REPLACE FUNCTION public.sync_subscription_to_subscriptions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    -- Sprawdź czy current_period_start i current_period_end istnieją
    IF sub_data->>'current_period_start' IS NOT NULL AND sub_data->>'current_period_end' IS NOT NULL THEN
      current_period_start_ts := to_timestamp((sub_data->>'current_period_start')::bigint);
      current_period_end_ts := to_timestamp((sub_data->>'current_period_end')::bigint);
    ELSE
      -- Fallback do teraz + 30 dni jeśli nie ma timestamp
      current_period_start_ts := NOW();
      current_period_end_ts := NOW() + interval '30 days';
    END IF;
    
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
      CASE WHEN COALESCE((sub_data->>'cancel_at_period_end')::boolean, false) THEN 'active_cancelled' ELSE 'active' END,
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
      
    -- Dodaj wpis do processed_upgrade_sessions dla WSZYSTKICH subscription.created
    IF NEW.event_type = 'customer.subscription.created' THEN
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
      )
      ON CONFLICT (session_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;
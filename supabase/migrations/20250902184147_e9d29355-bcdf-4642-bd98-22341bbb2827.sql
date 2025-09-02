-- KROK 7: Synchronizuj istniejące dane z subscription_events do subscriptions
-- Wywołaj funkcję synchronizacji dla istniejących wpisów

DO $$ 
DECLARE
  rec RECORD;
BEGIN
  -- Iteruj przez wszystkie istniejące subscription_events
  FOR rec IN 
    SELECT * FROM public.subscription_events 
    WHERE event_type IN ('customer.subscription.created', 'customer.subscription.updated')
    ORDER BY created_at ASC
  LOOP
    BEGIN
      -- Wywołaj funkcję synchronizacji dla każdego rekordu
      -- Użyj TG_OP = 'INSERT' aby trigger się zachował tak jakby to był nowy wpis
      PERFORM public.sync_subscription_to_subscriptions() FROM (
        SELECT 
          rec.id,
          rec.teacher_id,
          rec.email,
          rec.event_type,
          rec.new_plan_type,
          rec.old_plan_type,
          rec.event_data,
          rec.tokens_added,
          rec.stripe_event_id
      ) AS NEW;
      
      -- Bezpośrednia synchronizacja (fallback)
      DECLARE
        sub_data JSONB := rec.event_data;
        current_period_start_ts TIMESTAMPTZ;
        current_period_end_ts TIMESTAMPTZ;
        monthly_limit_val INTEGER := 0;
      BEGIN
        -- Ustaw monthly_limit na podstawie plan type
        CASE rec.new_plan_type
          WHEN 'Side-Gig' THEN monthly_limit_val := 15;
          WHEN 'Full-Time' THEN monthly_limit_val := 50;
          ELSE monthly_limit_val := 0;
        END CASE;
        
        -- Oblicz current_period timestamps
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
          rec.teacher_id,
          rec.email,
          sub_data->>'customer_id',
          sub_data->>'subscription_id',
          rec.new_plan_type,
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
        IF rec.event_type = 'customer.subscription.created' AND rec.old_plan_type != 'Free Demo' THEN
          INSERT INTO public.processed_upgrade_sessions (
            teacher_id,
            session_id,
            email,
            tokens_added,
            upgrade_details
          ) VALUES (
            rec.teacher_id,
            rec.stripe_event_id,
            rec.email,
            rec.tokens_added,
            jsonb_build_object(
              'old_plan', rec.old_plan_type,
              'new_plan', rec.new_plan_type,
              'event_type', rec.event_type
            )
          )
          ON CONFLICT (session_id) DO NOTHING; -- Ignore duplicates
        END IF;
        
      END;
    EXCEPTION 
      WHEN OTHERS THEN
        -- Log błąd ale kontynuuj
        RAISE NOTICE 'Error processing subscription_event %: %', rec.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Synchronizacja zakończona pomyślnie.';
END $$;
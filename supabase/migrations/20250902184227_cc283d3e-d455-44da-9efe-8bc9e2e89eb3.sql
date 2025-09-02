-- KROK 8: Ręczna synchronizacja z debugowaniem

DO $$
DECLARE
  rec RECORD;
  sub_data JSONB;
  current_period_start_ts TIMESTAMPTZ;
  current_period_end_ts TIMESTAMPTZ;
  monthly_limit_val INTEGER;
BEGIN
  -- Iteruj przez wszystkie subscription_events typu created
  FOR rec IN 
    SELECT * FROM public.subscription_events 
    WHERE event_type = 'customer.subscription.created'
    ORDER BY created_at ASC
  LOOP
    sub_data := rec.event_data;
    monthly_limit_val := CASE rec.new_plan_type
      WHEN 'Side-Gig' THEN 15
      WHEN 'Full-Time' THEN 50
      ELSE 0
    END;
    
    -- Debug info
    RAISE NOTICE 'Processing subscription event ID: %, subscription_id: %', rec.id, sub_data->>'subscription_id';
    
    -- Sprawdź czy current_period_start i current_period_end istnieją
    IF sub_data->>'current_period_start' IS NOT NULL AND sub_data->>'current_period_end' IS NOT NULL THEN
      current_period_start_ts := to_timestamp((sub_data->>'current_period_start')::bigint);
      current_period_end_ts := to_timestamp((sub_data->>'current_period_end')::bigint);
    ELSE
      -- Fallback do teraz + 30 dni jeśli nie ma timestamp
      current_period_start_ts := NOW();
      current_period_end_ts := NOW() + interval '30 days';
      RAISE NOTICE 'Missing period timestamps for %, using fallback', rec.id;
    END IF;
    
    -- Wstaw do subscriptions
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
      
    RAISE NOTICE 'Inserted/updated subscription for teacher_id: %', rec.teacher_id;
    
    -- Wstaw do processed_upgrade_sessions jeśli nie jest Free Demo -> Side-Gig
    IF rec.old_plan_type != 'Free Demo' THEN
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
      ON CONFLICT (session_id) DO NOTHING;
      
      RAISE NOTICE 'Inserted upgrade session for teacher_id: %', rec.teacher_id;
    END IF;
    
  END LOOP;
  
  RAISE NOTICE 'Synchronizacja ręczna zakończona.';
END $$;
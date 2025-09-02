-- KROK 10b: Dodaj unique constraint dla session_id i wypełnij processed_upgrade_sessions

-- Najpierw dodaj unique constraint na session_id
ALTER TABLE public.processed_upgrade_sessions 
ADD CONSTRAINT processed_upgrade_sessions_session_id_unique 
UNIQUE (session_id);

-- Teraz wstaw wszystkie subscription.created do processed_upgrade_sessions
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
-- ===== KOMPLEKSOWA NAPRAWA SYSTEMU AUTHENTICATION =====

-- KROK 1: Napraw trigger handle_new_user() - usuń warunek email, dodawaj profile dla WSZYSTKICH użytkowników
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Stwórz profil dla KAŻDEGO nowego użytkownika (także anonimowego)
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name,
    school_institution,
    email,
    available_tokens,
    total_tokens_received
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'school_institution', ''),
    COALESCE(NEW.email, ''),
    2, -- 2 darmowe tokeny dla każdego nowego użytkownika
    2  -- total_tokens_received = 2 żeby trigger sync działał poprawnie
  );
  
  -- Dodaj rolę tylko dla użytkowników z email (zarejestrowanych)
  IF NEW.email IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'teacher');
  END IF;
  
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;

-- KROK 2: Stwórz profile dla wszystkich istniejących użytkowników którzy ich nie mają
INSERT INTO public.profiles (
  id, 
  first_name, 
  last_name, 
  school_institution, 
  email,
  available_tokens,
  total_tokens_received
)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data ->> 'first_name', ''),
  COALESCE(au.raw_user_meta_data ->> 'last_name', ''),
  COALESCE(au.raw_user_meta_data ->> 'school_institution', ''),
  COALESCE(au.email, ''),
  2, -- 2 darmowe tokeny
  2  -- total_tokens_received
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL -- użytkownicy którzy nie mają profili
ON CONFLICT (id) DO NOTHING; -- zabezpieczenie przed duplikatami

-- KROK 3: Napraw funkcję track_user_event - upewnij się że ma SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.track_user_event(
  p_user_identifier text, 
  p_event_type text, 
  p_event_data jsonb DEFAULT NULL::jsonb, 
  p_ip_address text DEFAULT NULL::text, 
  p_user_agent text DEFAULT NULL::text, 
  p_session_id text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER -- To jest kluczowe!
SET search_path TO 'public'
AS $function$
DECLARE
  new_event_id UUID;
BEGIN
  INSERT INTO public.user_events (
    user_identifier,
    event_type,
    event_data,
    ip_address,
    user_agent,
    session_id
  )
  VALUES (
    p_user_identifier,
    p_event_type,
    p_event_data,
    p_ip_address,
    p_user_agent,
    p_session_id
  )
  RETURNING id INTO new_event_id;
  
  RETURN new_event_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to track event: %', SQLERRM;
    RETURN NULL;
END;
$function$;

-- KROK 4: Dodaj brakujące service_role policies dla user_events (dla edge functions)
DROP POLICY IF EXISTS "Service role full access user_events" ON public.user_events;
CREATE POLICY "Service role full access user_events"
  ON public.user_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
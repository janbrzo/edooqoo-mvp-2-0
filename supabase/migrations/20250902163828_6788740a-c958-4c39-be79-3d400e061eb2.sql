-- ===== NAPRAW SYSTEM PROFILI - ODTWÓRZ TRIGGERY I PROFILE =====

-- KROK 1: Odtwórz funkcję handle_new_user()
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  -- Tylko dla użytkowników którzy mają email (zarejestrowanych, nie anonimowych)
  IF NEW.email IS NOT NULL THEN
    INSERT INTO public.profiles (
      id, 
      first_name, 
      last_name,
      school_institution,
      email
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'school_institution', ''),
      NEW.email
    );
    
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

-- KROK 2: Odtwórz trigger na tabeli auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- KROK 3: Stwórz profile dla WSZYSTKICH istniejących użytkowników którzy ich nie mają
-- To naprawia problem 327 z 328 użytkowników bez profili
INSERT INTO public.profiles (
  id,
  first_name,
  last_name, 
  school_institution,
  email,
  available_tokens,
  total_tokens_received,
  total_tokens_consumed,
  onboarding_progress
)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data ->> 'first_name', ''),
  COALESCE(au.raw_user_meta_data ->> 'last_name', ''),
  COALESCE(au.raw_user_meta_data ->> 'school_institution', ''),
  au.email,
  2, -- 2 darmowe tokeny
  2, -- otrzymane tokeny = 2 
  0, -- zużyte tokeny = 0
  '{"steps": {"add_student": false, "share_worksheet": false, "generate_worksheet": false}, "completed": false, "dismissed": false}'::jsonb
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL; -- tylko ci którzy nie mają profili

-- KROK 4: Stwórz role 'teacher' dla użytkowników którzy ich nie mają
INSERT INTO public.user_roles (user_id, role)
SELECT 
  au.id,
  'teacher'::app_role
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id AND ur.role = 'teacher'
WHERE au.email IS NOT NULL -- tylko zarejestrowani użytkownicy
  AND ur.user_id IS NULL; -- którzy nie mają roli teacher

-- KROK 5: Napraw policy dla user_events aby edge functions mogły pisać
DROP POLICY IF EXISTS "Allow all operations for user events" ON public.user_events;
CREATE POLICY "Allow edge functions to manage user events"
  ON public.user_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Dodaj policy dla authenticated użytkowników do odczytu własnych eventów  
CREATE POLICY "Users can view their own events"
  ON public.user_events
  FOR SELECT
  TO authenticated
  USING (user_identifier = auth.uid()::text);

-- KROK 6: Upewnij się że profiles mają trigger synchronizacji tokenów
DROP TRIGGER IF EXISTS profiles_sync_tokens_trigger ON public.profiles;
CREATE TRIGGER profiles_sync_tokens_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_sync_available_tokens();
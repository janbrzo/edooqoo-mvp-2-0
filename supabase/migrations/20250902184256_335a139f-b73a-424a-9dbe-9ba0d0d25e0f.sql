-- KROK 9: Naprawa problemu z onboarding dla anonimowych użytkowników
-- Aktualizacja useOnboardingProgress logic na poziomie bazy danych

-- Dodaj funkcję pomocniczą do sprawdzenia czy user jest anonimowy  
CREATE OR REPLACE FUNCTION public.is_user_anonymous(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT COALESCE(
    (SELECT email IS NULL OR email = '' FROM public.profiles WHERE id = user_id),
    true
  );
$function$;

-- Dodaj funkcję do sprawdzenia onboarding visibility
CREATE OR REPLACE FUNCTION public.should_show_onboarding(user_id uuid)
RETURNS boolean  
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT 
    NOT COALESCE(is_user_anonymous(user_id), true) AND 
    COALESCE((SELECT (onboarding_progress->>'dismissed')::boolean FROM public.profiles WHERE id = user_id), false) = false AND
    COALESCE((SELECT (onboarding_progress->>'completed')::boolean FROM public.profiles WHERE id = user_id), false) = false;
$function$;
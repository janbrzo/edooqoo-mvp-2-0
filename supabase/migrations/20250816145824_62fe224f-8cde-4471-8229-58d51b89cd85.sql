
-- ETAP 1: Modyfikacja funkcji handle_new_user - tylko użytkownicy z emailem
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
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

-- ETAP 2A: Dodanie kolumny teacher_email do tabeli students
ALTER TABLE public.students 
ADD COLUMN teacher_email TEXT;

-- ETAP 2B: Wypełnienie teacher_email w tabeli students na podstawie istniejących danych
UPDATE public.students 
SET teacher_email = p.email 
FROM public.profiles p 
WHERE students.teacher_id = p.id 
AND p.email IS NOT NULL;

-- ETAP 2C: Dodanie kolumny teacher_email do tabeli token_transactions
ALTER TABLE public.token_transactions 
ADD COLUMN teacher_email TEXT;

-- ETAP 2D: Wypełnienie teacher_email w tabeli token_transactions na podstawie istniejących danych
UPDATE public.token_transactions 
SET teacher_email = p.email 
FROM public.profiles p 
WHERE token_transactions.teacher_id = p.id 
AND p.email IS NOT NULL;

-- ETAP 2E: Opcjonalne usunięcie profili bez emaila (sesje anonimowe)
-- Te profile nie powinny być w tabeli profiles według wymagań
DELETE FROM public.profiles 
WHERE email IS NULL OR email = '';

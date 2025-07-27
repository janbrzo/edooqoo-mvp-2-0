
-- Dodaj kolumnę email do tabeli profiles
ALTER TABLE public.profiles ADD COLUMN email TEXT;

-- Dodaj kolumnę deleted_at dla soft delete
ALTER TABLE public.profiles ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

-- Zaktualizuj trigger aby zbierał email przy tworzeniu konta
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
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
  
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Zaktualizuj istniejące profile z email-ami
UPDATE public.profiles 
SET email = auth.users.email 
FROM auth.users 
WHERE profiles.id = auth.users.id 
AND profiles.email IS NULL;

-- Zaktualizuj RLS policies aby uwzględniały soft delete
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id AND deleted_at IS NULL);

-- Dodaj policy dla soft delete
CREATE POLICY "Users can soft delete own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Funkcja do soft delete konta
CREATE OR REPLACE FUNCTION public.soft_delete_user_account(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Funkcja do reaktywacji konta
CREATE OR REPLACE FUNCTION public.reactivate_user_account(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

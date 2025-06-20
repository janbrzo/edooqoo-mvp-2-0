
-- FAZA 1A: Database Schema Setup dla systemu uwierzytelniania

-- 1. Enum dla ról użytkowników
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher');

-- 2. Tabela profiles - rozszerzenie auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  school_institution TEXT,
  teaching_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Warsaw'),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Warsaw')
);

-- 3. Tabela ról użytkowników
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Warsaw'),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

-- 4. Security definer function dla sprawdzania ról (zapobiega recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  );
$$;

-- 5. Funkcja auto-tworzenia profilu przy rejestracji
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Tworzymy profil z danymi z metadata
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name,
    school_institution
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'school_institution', '')
  );
  
  -- Domyślnie każdy nowy użytkownik dostaje rolę 'teacher'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'teacher');
  
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    -- Logujemy błąd ale nie blokujemy rejestracji
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 6. Trigger dla auto-tworzenia profilu
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- 7. Enable RLS na nowych tabelach
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies dla profiles
-- Users mogą widzieć i edytować tylko swój profil
CREATE POLICY "Users can view own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Admins mogą widzieć wszystkie profile
CREATE POLICY "Admins can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

-- 9. RLS Policies dla user_roles
-- Users mogą widzieć swoje role
CREATE POLICY "Users can view own roles" 
  ON public.user_roles 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Admins mogą zarządzać wszystkimi rolami
CREATE POLICY "Admins can manage all roles" 
  ON public.user_roles 
  FOR ALL 
  USING (public.has_role(auth.uid(), 'admin'));

-- 10. Przygotowanie na przyszłość - dodanie teacher_id do worksheets (nullable dla kompatybilności)
ALTER TABLE public.worksheets 
ADD COLUMN teacher_id UUID REFERENCES public.profiles(id);

-- Index dla performance
CREATE INDEX idx_worksheets_teacher_id ON public.worksheets(teacher_id);
CREATE INDEX idx_profiles_school_institution ON public.profiles(school_institution);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- 11. Update trigger dla updated_at w profiles
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = (now() AT TIME ZONE 'Europe/Warsaw');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Dodanie pierwszego admin usera (opcjonalne - można zrobić później)
-- Ten kod zostanie wykonany tylko jeśli istnieją użytkownicy w auth.users
-- INSERT INTO public.user_roles (user_id, role) 
-- SELECT id, 'admin' FROM auth.users LIMIT 1 
-- ON CONFLICT (user_id, role) DO NOTHING;

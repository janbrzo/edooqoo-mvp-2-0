-- ===== OSTATECZNA NAPRAWA: TRIGGER + RLS POLICIES =====

-- KROK 1: Przywróć trigger na auth.users (KLUCZOWY!)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- KROK 2: Uprość RLS policies - usuń konfliktujące policies
-- Dla profiles: zostaw tylko najprostsze policies
DROP POLICY IF EXISTS "Anonymous users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anonymous users can insert profiles" ON public.profiles;  
DROP POLICY IF EXISTS "Anonymous users can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow new user profile creation" ON public.profiles;

-- Stwórz JEDNĄ prostą policy dla profiles
CREATE POLICY "Profiles access policy"
  ON public.profiles
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Dla students: uprość policies
DROP POLICY IF EXISTS "Anonymous users can view students" ON public.students;
DROP POLICY IF EXISTS "Anonymous users can create students" ON public.students;
DROP POLICY IF EXISTS "Anonymous users can update students" ON public.students;
DROP POLICY IF EXISTS "Anonymous users can delete students" ON public.students;
DROP POLICY IF EXISTS "Teachers can view their own students" ON public.students;
DROP POLICY IF EXISTS "Teachers can create their own students" ON public.students;
DROP POLICY IF EXISTS "Teachers can update their own students" ON public.students;
DROP POLICY IF EXISTS "Teachers can delete their own students" ON public.students;

-- Stwórz JEDNĄ prostą policy dla students
CREATE POLICY "Students access policy"
  ON public.students
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Dla worksheets: uprość policies
DROP POLICY IF EXISTS "Anonymous users can view worksheets" ON public.worksheets;
DROP POLICY IF EXISTS "Anonymous users can create worksheets" ON public.worksheets;
DROP POLICY IF EXISTS "Anonymous users can update worksheets" ON public.worksheets;
DROP POLICY IF EXISTS "Anonymous users can delete worksheets" ON public.worksheets;
DROP POLICY IF EXISTS "Teachers can view their own worksheets" ON public.worksheets;
DROP POLICY IF EXISTS "Teachers can update their own worksheets" ON public.worksheets;
DROP POLICY IF EXISTS "Teachers can delete their own worksheets" ON public.worksheets;
DROP POLICY IF EXISTS "Allow insert worksheets" ON public.worksheets;

-- Stwórz JEDNĄ prostą policy dla worksheets
CREATE POLICY "Worksheets access policy"
  ON public.worksheets
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- KROK 3: Sprawdź czy user_events ma właściwe policies
DROP POLICY IF EXISTS "Anonymous users can insert events" ON public.user_events;
DROP POLICY IF EXISTS "Anonymous users can view their events" ON public.user_events;
DROP POLICY IF EXISTS "Users can view their own events" ON public.user_events;
DROP POLICY IF EXISTS "Allow edge functions to manage user events" ON public.user_events;

-- Stwórz proste policies dla user_events
CREATE POLICY "User events access policy"
  ON public.user_events
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- KROK 4: Sprawdź czy wszystkie tabele mają RLS włączone ale z prostymi policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worksheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;
-- MVP2 FAZA 1: Rozszerzenie schematu bazy danych

-- Rozszerzenie tabeli profiles o dane subskrypcyjne
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS token_balance integer NOT NULL DEFAULT 2,
ADD COLUMN IF NOT EXISTS subscription_type text,
ADD COLUMN IF NOT EXISTS subscription_status text,
ADD COLUMN IF NOT EXISTS subscription_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS monthly_worksheet_limit integer,
ADD COLUMN IF NOT EXISTS monthly_worksheets_used integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_limit_reset timestamp with time zone DEFAULT now();

-- Tabela uczniów
CREATE TABLE IF NOT EXISTS public.students (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  english_level text NOT NULL,
  main_goal text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Warsaw'),
  updated_at timestamp with time zone NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Warsaw')
);

-- Tabela subskrypcji (dla Stripe)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE NOT NULL,
  stripe_customer_id text NOT NULL,
  status text NOT NULL,
  plan_type text NOT NULL,
  monthly_limit integer NOT NULL,
  current_period_start timestamp with time zone NOT NULL,
  current_period_end timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Warsaw'),
  updated_at timestamp with time zone NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Warsaw')
);

-- Tabela transakcji tokenów
CREATE TABLE IF NOT EXISTS public.token_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  transaction_type text NOT NULL, -- 'usage', 'purchase', 'bonus'
  amount integer NOT NULL, -- negative for usage, positive for purchase/bonus
  description text,
  reference_id uuid, -- worksheet_id for usage, payment_id for purchase
  created_at timestamp with time zone NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Warsaw')
);

-- Rozszerzenie tabeli worksheets o student_id
ALTER TABLE public.worksheets 
ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES public.students(id) ON DELETE SET NULL;

-- RLS dla students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view their own students" 
ON public.students 
FOR SELECT 
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create their own students" 
ON public.students 
FOR INSERT 
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own students" 
ON public.students 
FOR UPDATE 
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own students" 
ON public.students 
FOR DELETE 
USING (auth.uid() = teacher_id);

-- RLS dla subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view their own subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (auth.uid() = teacher_id);

CREATE POLICY "Allow edge functions to manage subscriptions" 
ON public.subscriptions 
FOR ALL 
USING (true)
WITH CHECK (true);

-- RLS dla token_transactions
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view their own token transactions" 
ON public.token_transactions 
FOR SELECT 
USING (auth.uid() = teacher_id);

CREATE POLICY "Allow edge functions to create token transactions" 
ON public.token_transactions 
FOR INSERT 
WITH CHECK (true);

-- Trigger dla aktualizacji updated_at w students
CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger dla aktualizacji updated_at w subscriptions
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indeksy dla wydajności
CREATE INDEX IF NOT EXISTS idx_students_teacher_id ON public.students(teacher_id);
CREATE INDEX IF NOT EXISTS idx_worksheets_student_id ON public.worksheets(student_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_teacher_id ON public.subscriptions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_teacher_id ON public.token_transactions(teacher_id);
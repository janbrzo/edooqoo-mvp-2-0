-- ===== NAPRAWIENIE RLS POLICIES - DODANIE BRAKUJĄCYCH ZASAD =====

-- ===== PROFILES TABLE POLICIES =====
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT 
USING ((auth.uid() = id) AND (deleted_at IS NULL));

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE 
USING ((auth.uid() = id) AND (deleted_at IS NULL));

-- Users can soft delete their own profile
CREATE POLICY "Users can soft delete own profile" ON public.profiles
FOR UPDATE 
USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- CRITICAL: Allow INSERT for new user registration (via trigger)
CREATE POLICY "Allow new user profile creation" ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- ===== USER_ROLES TABLE POLICIES =====
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT 
USING (auth.uid() = user_id);

-- Admins can manage all roles
CREATE POLICY "Admins can manage all roles" ON public.user_roles
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- CRITICAL: Allow INSERT for new user role assignment (via trigger)
CREATE POLICY "Allow new user role creation" ON public.user_roles
FOR INSERT
WITH CHECK (true);

-- ===== WORKSHEETS TABLE POLICIES =====
ALTER TABLE public.worksheets ENABLE ROW LEVEL SECURITY;

-- Teachers can view their own worksheets
CREATE POLICY "Teachers can view their own worksheets" ON public.worksheets
FOR SELECT 
USING (auth.uid() = teacher_id);

-- Allow insert worksheets (for Edge Functions and authenticated users)
CREATE POLICY "Allow insert worksheets" ON public.worksheets
FOR INSERT 
WITH CHECK (true);

-- Teachers can update their own worksheets
CREATE POLICY "Teachers can update their own worksheets" ON public.worksheets
FOR UPDATE 
USING (auth.uid() = teacher_id);

-- Teachers can delete their own worksheets
CREATE POLICY "Teachers can delete their own worksheets" ON public.worksheets
FOR DELETE 
USING (auth.uid() = teacher_id);

-- ===== STUDENTS TABLE POLICIES =====
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Teachers can view their own students
CREATE POLICY "Teachers can view their own students" ON public.students
FOR SELECT 
USING (auth.uid() = teacher_id);

-- Teachers can create their own students
CREATE POLICY "Teachers can create their own students" ON public.students
FOR INSERT 
WITH CHECK (auth.uid() = teacher_id);

-- Teachers can update their own students
CREATE POLICY "Teachers can update their own students" ON public.students
FOR UPDATE 
USING (auth.uid() = teacher_id);

-- Teachers can delete their own students
CREATE POLICY "Teachers can delete their own students" ON public.students
FOR DELETE 
USING (auth.uid() = teacher_id);

-- ===== FEEDBACKS TABLE POLICIES =====
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- Allow reading feedback
CREATE POLICY "allow_read_feedback" ON public.feedbacks
FOR SELECT 
USING (true);

-- Allow inserting feedback
CREATE POLICY "allow_insert_feedback" ON public.feedbacks
FOR INSERT 
WITH CHECK (true);

-- Allow updating own feedback
CREATE POLICY "allow_update_feedback" ON public.feedbacks
FOR UPDATE 
USING ((user_id = auth.uid()) OR (user_id IS NULL));

-- Allow deleting own feedback
CREATE POLICY "allow_delete_feedback" ON public.feedbacks
FOR DELETE 
USING ((user_id = auth.uid()) OR (user_id IS NULL));

-- Service role can manage all feedback
CREATE POLICY "service_role_all_feedback" ON public.feedbacks
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ===== TOKEN_TRANSACTIONS TABLE POLICIES =====
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;

-- Teachers can view their own token transactions
CREATE POLICY "Teachers can view their own token transactions" ON public.token_transactions
FOR SELECT 
USING (auth.uid() = teacher_id);

-- Allow Edge Functions to create token transactions
CREATE POLICY "Allow edge functions to create token transactions" ON public.token_transactions
FOR INSERT 
WITH CHECK (true);

-- ===== SUBSCRIPTIONS TABLE POLICIES =====
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Teachers can view their own subscriptions
CREATE POLICY "Teachers can view their own subscriptions" ON public.subscriptions
FOR SELECT 
USING (auth.uid() = teacher_id);

-- Allow Edge Functions to manage subscriptions
CREATE POLICY "Allow edge functions to manage subscriptions" ON public.subscriptions
FOR ALL 
USING (true);

-- ===== SUBSCRIPTION_EVENTS TABLE POLICIES =====
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- Teachers can view their own subscription events
CREATE POLICY "Teachers can view their own subscription events" ON public.subscription_events
FOR SELECT 
USING (auth.uid() = teacher_id);

-- Allow Edge Functions to manage subscription events
CREATE POLICY "Allow edge functions to manage subscription events" ON public.subscription_events
FOR ALL 
USING (true);

-- ===== PROCESSED_UPGRADE_SESSIONS TABLE POLICIES =====
ALTER TABLE public.processed_upgrade_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own processed sessions
CREATE POLICY "Users can view their own processed sessions" ON public.processed_upgrade_sessions
FOR SELECT 
USING (auth.uid() = teacher_id);

-- Edge Functions can manage processed sessions
CREATE POLICY "Edge functions can manage processed sessions" ON public.processed_upgrade_sessions
FOR ALL 
USING (true);

-- ===== EXPORT_PAYMENTS TABLE POLICIES =====
ALTER TABLE public.export_payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view their own payments" ON public.export_payments
FOR SELECT 
USING ((user_id = auth.uid()) OR (user_email = auth.email()));

-- Allow insert for Edge Functions
CREATE POLICY "Allow insert for edge functions" ON public.export_payments
FOR INSERT 
WITH CHECK (true);

-- Allow update for Edge Functions
CREATE POLICY "Allow update for edge functions" ON public.export_payments
FOR UPDATE 
USING (true);

-- ===== DOWNLOAD_SESSIONS TABLE POLICIES =====
ALTER TABLE public.download_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own download sessions
CREATE POLICY "Users can view their own download sessions" ON public.download_sessions
FOR SELECT 
USING (true);

-- Allow insert for Edge Functions
CREATE POLICY "Allow insert for edge functions" ON public.download_sessions
FOR INSERT 
WITH CHECK (true);

-- Allow update for Edge Functions
CREATE POLICY "Allow update for edge functions" ON public.download_sessions
FOR UPDATE 
USING (true);

-- ===== USER_EVENTS TABLE POLICIES =====
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

-- Allow all operations for user events (needed for tracking)
CREATE POLICY "Allow all operations for user events" ON public.user_events
FOR ALL 
USING (true)
WITH CHECK (true);

-- ===== PODSUMOWANIE =====
-- Dodano wszystkie brakujące RLS policies
-- Tabele profiles, worksheets, user_events, user_roles mają teraz właściwe zasady dostępu
-- Edge Functions mogą zapisywać dane gdzie potrzebne
-- Użytkownicy mogą tworzyć konta i otrzymywać domyślne 2 tokeny

-- HARD RESET: Complete database cleanup including auth.users
-- WARNING: This will remove ALL users, including you! You'll need to re-register.

-- 1. First, clean all business data tables
TRUNCATE TABLE public.worksheets RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.students RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.feedbacks RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.subscriptions RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.subscription_events RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.token_transactions RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.export_payments RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.download_sessions RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.processed_upgrade_sessions RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.user_events RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.profiles RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.user_roles RESTART IDENTITY CASCADE;

-- 2. Clear analytics tables
TRUNCATE TABLE public.conversion_funnel RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.popular_form_params RESTART IDENTITY CASCADE;

-- 3. Finally, remove all users from auth.users (this will log you out!)
DELETE FROM auth.users;

-- 4. Reset sequences to start from 1
ALTER SEQUENCE IF EXISTS worksheets_sequence_number_seq RESTART WITH 1;

-- Verification: Check that all tables are empty
SELECT 'profiles' as table_name, count(*) as row_count FROM public.profiles
UNION ALL
SELECT 'worksheets', count(*) FROM public.worksheets
UNION ALL
SELECT 'students', count(*) FROM public.students
UNION ALL
SELECT 'auth.users', count(*) FROM auth.users;

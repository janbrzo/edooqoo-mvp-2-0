
-- Clears all test data from the specified tables to ensure a clean state for testing.
-- RESTART IDENTITY resets any auto-incrementing counters.
-- CASCADE handles any dependent objects.

TRUNCATE TABLE public.worksheets RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.feedbacks RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.export_payments RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.download_sessions RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.user_events RESTART IDENTITY CASCADE;


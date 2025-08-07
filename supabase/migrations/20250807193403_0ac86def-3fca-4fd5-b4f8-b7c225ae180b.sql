
-- Dodaj kolumnę email do tabeli subscription_events
ALTER TABLE public.subscription_events 
ADD COLUMN email TEXT;

-- Opcjonalnie: zaktualizuj istniejące rekordy email z tabeli profiles
UPDATE public.subscription_events 
SET email = profiles.email 
FROM public.profiles 
WHERE subscription_events.teacher_id = profiles.id 
AND subscription_events.email IS NULL;

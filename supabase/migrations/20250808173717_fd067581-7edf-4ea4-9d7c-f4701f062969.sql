
-- 1) Dodaj unikatowe constrainty, aby upsert onConflict działał poprawnie
ALTER TABLE public.subscriptions 
ADD CONSTRAINT subscriptions_teacher_id_unique UNIQUE (teacher_id);

ALTER TABLE public.subscriptions 
ADD CONSTRAINT subscriptions_stripe_subscription_id_unique UNIQUE (stripe_subscription_id);

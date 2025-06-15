
ALTER TABLE public.feedbacks
ADD COLUMN status TEXT NOT NULL DEFAULT 'submitted';

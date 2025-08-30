
-- Add onboarding_progress column to profiles table to store user's checklist progress
ALTER TABLE public.profiles 
ADD COLUMN onboarding_progress JSONB DEFAULT '{"steps": {"add_student": false, "generate_worksheet": false, "share_worksheet": false}, "completed": false, "dismissed": false}'::jsonb;

-- Add index for better performance when querying onboarding progress
CREATE INDEX idx_profiles_onboarding_progress ON public.profiles USING gin(onboarding_progress);

-- Add comment to document the column structure
COMMENT ON COLUMN public.profiles.onboarding_progress IS 'Stores user onboarding checklist progress with steps completion status, overall completion and dismissal status';

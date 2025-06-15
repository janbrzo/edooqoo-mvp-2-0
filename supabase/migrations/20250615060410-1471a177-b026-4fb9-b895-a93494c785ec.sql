
-- Check if foreign key constraint exists and add it if missing
ALTER TABLE public.feedbacks 
DROP CONSTRAINT IF EXISTS feedbacks_worksheet_id_fkey;

ALTER TABLE public.feedbacks 
ADD CONSTRAINT feedbacks_worksheet_id_fkey 
FOREIGN KEY (worksheet_id) REFERENCES public.worksheets(id) ON DELETE CASCADE;

-- Enable RLS on feedbacks table if not already enabled
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "users_view_accessible_feedback" ON public.feedbacks;
DROP POLICY IF EXISTS "authenticated_users_create_feedback" ON public.feedbacks;
DROP POLICY IF EXISTS "users_update_own_feedback" ON public.feedbacks;
DROP POLICY IF EXISTS "users_delete_own_feedback" ON public.feedbacks;

-- Create comprehensive RLS policies for feedbacks table
CREATE POLICY "allow_read_feedback" ON public.feedbacks
FOR SELECT 
USING (true);

CREATE POLICY "allow_insert_feedback" ON public.feedbacks
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "allow_update_feedback" ON public.feedbacks
FOR UPDATE 
USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "allow_delete_feedback" ON public.feedbacks
FOR DELETE 
USING (user_id = auth.uid() OR user_id IS NULL);

-- Ensure service role can bypass RLS
CREATE POLICY "service_role_all_feedback" ON public.feedbacks
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

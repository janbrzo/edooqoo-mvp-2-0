
-- Create table to track processed upgrade sessions to prevent duplicate token additions
CREATE TABLE public.processed_upgrade_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tokens_added INTEGER NOT NULL DEFAULT 0,
  old_plan_type TEXT,
  new_plan_type TEXT
);

-- Enable RLS
ALTER TABLE public.processed_upgrade_sessions ENABLE ROW LEVEL SECURITY;

-- Allow teachers to view their own processed sessions
CREATE POLICY "Teachers can view their own processed sessions"
ON public.processed_upgrade_sessions
FOR SELECT
USING (auth.uid() = teacher_id);

-- Allow edge functions to manage processed sessions
CREATE POLICY "Allow edge functions to manage processed sessions"
ON public.processed_upgrade_sessions
FOR ALL
USING (true)
WITH CHECK (true);


-- Create table to track processed upgrade sessions for idempotency
CREATE TABLE IF NOT EXISTS public.processed_upgrade_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  teacher_id UUID NOT NULL REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  tokens_added INTEGER NOT NULL DEFAULT 0,
  upgrade_details JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.processed_upgrade_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own processed sessions" ON public.processed_upgrade_sessions
FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "Edge functions can manage processed sessions" ON public.processed_upgrade_sessions
FOR ALL USING (true) WITH CHECK (true);

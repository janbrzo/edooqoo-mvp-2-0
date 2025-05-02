
-- Create function to bypass worksheet creation limits
CREATE OR REPLACE FUNCTION public.insert_worksheet_bypass_limit(
  p_prompt TEXT,
  p_content TEXT,
  p_user_id UUID,
  p_ip_address TEXT,
  p_status TEXT,
  p_title TEXT
) RETURNS TABLE (
  id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  title TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id UUID;
  created_timestamp TIMESTAMP WITH TIME ZONE;
BEGIN
  INSERT INTO public.worksheets (
    prompt,
    html_content,
    user_id,
    ip_address,
    status,
    title
  )
  VALUES (
    p_prompt,
    p_content,
    p_user_id,
    p_ip_address,
    p_status,
    p_title
  )
  RETURNING id, created_at INTO new_id, created_timestamp;
  
  RETURN QUERY SELECT new_id, created_timestamp, p_title;
END;
$$;

-- Add index to worksheets table to speed up ID lookups
CREATE INDEX IF NOT EXISTS idx_worksheets_id ON public.worksheets (id);

-- Add index for events by user_id
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events (user_id);

-- Add index for events by worksheet_id
CREATE INDEX IF NOT EXISTS idx_events_worksheet_id ON public.events (worksheet_id);

-- Add index for feedbacks by user_id
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON public.feedbacks (user_id);

-- Add index for feedbacks by worksheet_id
CREATE INDEX IF NOT EXISTS idx_feedbacks_worksheet_id ON public.feedbacks (worksheet_id);

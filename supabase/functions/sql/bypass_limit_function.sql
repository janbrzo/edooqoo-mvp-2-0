
-- This file needs to be executed on the Supabase database to create the function
-- that bypasses the IP limit check for worksheet inserts

CREATE OR REPLACE FUNCTION public.insert_worksheet_bypass_limit(
  p_prompt TEXT,
  p_content TEXT,
  p_user_id UUID,
  p_ip_address TEXT,
  p_status TEXT,
  p_title TEXT
) RETURNS TABLE (
  id UUID,
  prompt TEXT,
  html_content TEXT,
  user_id UUID,
  ip_address TEXT,
  status TEXT,
  title TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.worksheets (
    prompt,
    html_content,
    user_id,
    ip_address,
    status,
    title
  ) VALUES (
    p_prompt,
    p_content,
    p_user_id,
    p_ip_address,
    p_status,
    p_title
  )
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.insert_worksheet_bypass_limit IS 'Inserts a worksheet record bypassing the IP limit trigger';


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
    content,
    html_content,
    user_id,
    ip_address,
    status,
    title
  )
  VALUES (
    p_prompt,
    p_content,
    p_content, -- HTML content will be same as content
    p_user_id,
    p_ip_address,
    p_status,
    p_title
  )
  RETURNING id, created_at INTO new_id, created_timestamp;
  
  RETURN QUERY SELECT new_id, created_timestamp, p_title;
END;
$$;

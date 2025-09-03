-- Fix the generate_worksheet_share_token function to properly access pgcrypto
DROP FUNCTION IF EXISTS public.generate_worksheet_share_token(uuid, uuid, integer);

CREATE OR REPLACE FUNCTION public.generate_worksheet_share_token(
  p_worksheet_id uuid, 
  p_teacher_id uuid, 
  p_expires_hours integer DEFAULT 168
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  new_token TEXT;
BEGIN
  -- Ensure pgcrypto extension is available
  -- Generate unique token using hex encoding from pgcrypto
  new_token := encode(extensions.gen_random_bytes(32), 'hex');
  
  -- Update worksheet with new token
  UPDATE public.worksheets 
  SET 
    share_token = new_token,
    share_expires_at = NOW() + (p_expires_hours || ' hours')::interval
  WHERE id = p_worksheet_id 
    AND teacher_id = p_teacher_id 
    AND deleted_at IS NULL;
  
  IF FOUND THEN
    RETURN new_token;
  ELSE
    RETURN NULL;
  END IF;
END;
$function$;
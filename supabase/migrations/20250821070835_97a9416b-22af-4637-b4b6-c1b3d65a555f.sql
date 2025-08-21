
-- Popraw funkcję generate_worksheet_share_token aby używała kompatybilnego kodowania
CREATE OR REPLACE FUNCTION public.generate_worksheet_share_token(p_worksheet_id uuid, p_teacher_id uuid, p_expires_hours integer DEFAULT 168)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  new_token TEXT;
BEGIN
  -- Generuj unikalny token używając hex encoding (kompatybilne ze wszystkimi wersjami PostgreSQL)
  new_token := encode(gen_random_bytes(32), 'hex');
  
  -- Zaktualizuj worksheet z nowym tokenem
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
$function$

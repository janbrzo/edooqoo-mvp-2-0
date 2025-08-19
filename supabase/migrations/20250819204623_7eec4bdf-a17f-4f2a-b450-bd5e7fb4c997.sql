
-- Etap 1: Dodanie kolumn dla soft delete i udostępniania worksheetów
ALTER TABLE public.worksheets 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS share_token TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS share_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Dodanie indeksu dla share_token (dla szybszego wyszukiwania)
CREATE INDEX IF NOT EXISTS idx_worksheets_share_token ON public.worksheets(share_token) WHERE share_token IS NOT NULL;

-- Dodanie indeksu dla deleted_at (dla szybszego filtrowania)
CREATE INDEX IF NOT EXISTS idx_worksheets_deleted_at ON public.worksheets(deleted_at) WHERE deleted_at IS NULL;

-- Dodanie funkcji do soft delete worksheetów
CREATE OR REPLACE FUNCTION public.soft_delete_worksheet(p_worksheet_id uuid, p_teacher_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.worksheets 
  SET deleted_at = NOW() 
  WHERE id = p_worksheet_id 
    AND teacher_id = p_teacher_id 
    AND deleted_at IS NULL;
  
  RETURN FOUND;
END;
$$;

-- Dodanie funkcji do generowania share token
CREATE OR REPLACE FUNCTION public.generate_worksheet_share_token(p_worksheet_id uuid, p_teacher_id uuid, p_expires_hours integer DEFAULT 168)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_token TEXT;
BEGIN
  -- Generuj unikalny token
  new_token := encode(gen_random_bytes(32), 'base64url');
  
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
$$;

-- Dodanie funkcji do pobierania worksheetów przez share token
CREATE OR REPLACE FUNCTION public.get_worksheet_by_share_token(p_share_token text)
RETURNS TABLE(
  id uuid,
  title text,
  ai_response text,
  html_content text,
  created_at timestamp with time zone,
  teacher_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.title,
    w.ai_response,
    w.html_content,
    w.created_at,
    w.teacher_email
  FROM public.worksheets w
  WHERE w.share_token = p_share_token
    AND w.deleted_at IS NULL
    AND (w.share_expires_at IS NULL OR w.share_expires_at > NOW());
END;
$$;

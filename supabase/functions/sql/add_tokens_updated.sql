
CREATE OR REPLACE FUNCTION public.add_tokens(p_teacher_id uuid, p_amount integer, p_description text, p_reference_id uuid DEFAULT NULL::uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  teacher_email_var TEXT;
BEGIN
  -- Get teacher email
  SELECT email INTO teacher_email_var
  FROM public.profiles 
  WHERE id = p_teacher_id;
  
  -- Zwiększ sumę otrzymanych tokenów
  UPDATE public.profiles 
  SET total_tokens_received = COALESCE(total_tokens_received, 0) + GREATEST(p_amount, 0)
  WHERE id = p_teacher_id;
  
  -- Zaloguj transakcję "purchase" z emailem nauczyciela
  INSERT INTO public.token_transactions (teacher_id, teacher_email, transaction_type, amount, description, reference_id)
  VALUES (p_teacher_id, teacher_email_var, 'purchase', p_amount, p_description, p_reference_id);
END;
$function$

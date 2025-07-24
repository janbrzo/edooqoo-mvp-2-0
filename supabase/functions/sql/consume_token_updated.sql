
CREATE OR REPLACE FUNCTION public.consume_token(p_teacher_id uuid, p_worksheet_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  current_balance INTEGER;
  monthly_limit INTEGER;
  monthly_used INTEGER;
  can_use_monthly BOOLEAN := FALSE;
BEGIN
  -- Get current balance and monthly data
  SELECT 
    token_balance, 
    COALESCE(monthly_worksheet_limit, 0),
    COALESCE(monthly_worksheets_used, 0)
  INTO current_balance, monthly_limit, monthly_used
  FROM public.profiles 
  WHERE id = p_teacher_id;
  
  -- Check if user has token balance
  IF current_balance > 0 THEN
    -- Deduct from token balance
    UPDATE public.profiles 
    SET token_balance = token_balance - 1
    WHERE id = p_teacher_id;
    
    -- Log transaction
    INSERT INTO public.token_transactions (teacher_id, transaction_type, amount, description, reference_id)
    VALUES (p_teacher_id, 'usage', -1, 'Worksheet generation (from token balance)', p_worksheet_id);
    
    RETURN TRUE;
  END IF;
  
  -- Check if user can use monthly limit
  IF monthly_limit > 0 AND monthly_used < monthly_limit THEN
    -- Increment monthly usage
    UPDATE public.profiles 
    SET monthly_worksheets_used = monthly_worksheets_used + 1
    WHERE id = p_teacher_id;
    
    -- Log transaction
    INSERT INTO public.token_transactions (teacher_id, transaction_type, amount, description, reference_id)
    VALUES (p_teacher_id, 'usage', 0, 'Worksheet generation (from monthly limit)', p_worksheet_id);
    
    RETURN TRUE;
  END IF;
  
  -- No tokens available
  RETURN FALSE;
END;
$function$

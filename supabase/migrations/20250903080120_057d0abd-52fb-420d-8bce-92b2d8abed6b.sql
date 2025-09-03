-- Complete the failed upgrade from Side-Gig to Full-Time 30 for j4n.brz0+31@gmail.com
-- Fixed version with proper period data for the trigger

-- 1. Add the missing subscription event for the upgrade with proper period data
INSERT INTO public.subscription_events (
  teacher_id,
  email,
  event_type,
  stripe_event_id,
  old_plan_type,
  new_plan_type,
  tokens_added,
  event_data
) VALUES (
  '42f7a025-eb6c-4506-874b-2608e8ccabf0',
  'j4n.brz0+31@gmail.com',
  'customer.subscription.updated',
  'cs_live_b1Y27qL0rHvpJoVaAydQaayZWslVdSbebyCQwwM3i3p3xEpkSSk5QCkxEg',
  'Side-Gig',
  'Full-Time',
  15,
  jsonb_build_object(
    'subscription_id', 'sub_1S2yrVH4Sb5mBNfb0PtBThfe',
    'customer_id', 'cus_SywkdFBaPjcFjo',
    'status', 'active',
    'cancel_at_period_end', false,
    'amount', 1900,
    'currency', 'usd',
    'current_period_start', extract(epoch from (SELECT current_period_start FROM public.subscriptions WHERE stripe_subscription_id = 'sub_1S2yrVH4Sb5mBNfb0PtBThfe'))::text,
    'current_period_end', extract(epoch from (SELECT current_period_end FROM public.subscriptions WHERE stripe_subscription_id = 'sub_1S2yrVH4Sb5mBNfb0PtBThfe'))::text
  )
);

-- 2. Add the missing processed upgrade session
INSERT INTO public.processed_upgrade_sessions (
  teacher_id,
  session_id,
  email,
  tokens_added,
  upgrade_details
) VALUES (
  '42f7a025-eb6c-4506-874b-2608e8ccabf0',
  'cs_live_b1Y27qL0rHvpJoVaAydQaayZWslVdSbebyCQwwM3i3p3xEpkSSk5QCkxEg',
  'j4n.brz0+31@gmail.com',
  15,
  jsonb_build_object(
    'old_plan', 'Side-Gig',
    'new_plan', 'Full-Time',
    'type', 'subscription_upgrade',
    'target_monthly_limit', 30
  )
);

-- 3. Add the missing token transaction for upgrade
INSERT INTO public.token_transactions (
  teacher_id,
  teacher_email,
  transaction_type,
  amount,
  description,
  reference_id
) VALUES (
  '42f7a025-eb6c-4506-874b-2608e8ccabf0',
  'j4n.brz0+31@gmail.com',
  'purchase',
  15,
  'Upgrade tokens - Full-Time Plan (30 worksheets)',
  '42f7a025-eb6c-4506-874b-2608e8ccabf0'
);

-- 4. Update the profiles table to reflect Full-Time plan (add tokens manually since trigger already updated subscriptions)
UPDATE public.profiles 
SET 
  subscription_type = 'Full-Time 30',
  monthly_worksheet_limit = 30,
  total_tokens_received = COALESCE(total_tokens_received, 0) + 15,
  updated_at = NOW()
WHERE 
  id = '42f7a025-eb6c-4506-874b-2608e8ccabf0' 
  AND email = 'j4n.brz0+31@gmail.com';
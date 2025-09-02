-- ===== KOMPLEKSOWA NAPRAWA RLS POLICIES DLA ANONYMOUS USERS =====

-- KROK 1: Dodaj policies dla anonymous users (rola anon) do tabeli profiles
CREATE POLICY "Anonymous users can view profiles"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert profiles"
  ON public.profiles
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update profiles"
  ON public.profiles
  FOR UPDATE
  TO anon
  USING (true);

-- KROK 2: Dodaj policies dla anonymous users do tabeli students
CREATE POLICY "Anonymous users can view students"
  ON public.students
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can create students"
  ON public.students
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update students"
  ON public.students
  FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can delete students"
  ON public.students
  FOR DELETE
  TO anon
  USING (true);

-- KROK 3: Dodaj policies dla anonymous users do tabeli worksheets
CREATE POLICY "Anonymous users can view worksheets"
  ON public.worksheets
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can create worksheets"
  ON public.worksheets
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update worksheets"
  ON public.worksheets
  FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can delete worksheets"
  ON public.worksheets
  FOR DELETE
  TO anon
  USING (true);

-- KROK 4: Napraw policies dla user_events - dodaj anon access
CREATE POLICY "Anonymous users can insert events"
  ON public.user_events
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can view their events"
  ON public.user_events
  FOR SELECT
  TO anon
  USING (true);

-- KROK 5: Dodaj service_role policies dla wszystkich tabel (edge functions)
CREATE POLICY "Service role full access profiles"
  ON public.profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access students" 
  ON public.students
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access worksheets"
  ON public.worksheets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access subscriptions"
  ON public.subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access subscription_events"
  ON public.subscription_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access token_transactions"
  ON public.token_transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access processed_upgrade_sessions"
  ON public.processed_upgrade_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access export_payments"
  ON public.export_payments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access download_sessions"
  ON public.download_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access feedbacks"
  ON public.feedbacks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- KROK 6: Upewnij się że funkcja track_user_event istnieje
-- (funkcja już istnieje w bazie więc nie trzeba jej tworzyć ponownie)

-- KROK 7: Dodaj policies dla anon w pozostałych tabelach używanych przez aplikację
CREATE POLICY "Anonymous users can view feedbacks"
  ON public.feedbacks
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can create feedbacks"
  ON public.feedbacks
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update feedbacks"
  ON public.feedbacks
  FOR UPDATE
  TO anon
  USING (true);

-- KROK 8: Subscription tables - dodaj policies dla anon (dla checkout flow)
CREATE POLICY "Anonymous users can view subscriptions"
  ON public.subscriptions
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can view subscription_events"
  ON public.subscription_events
  FOR SELECT
  TO anon
  USING (true);

-- KROK 9: Token transactions - dodaj anon access
CREATE POLICY "Anonymous users can view token_transactions"
  ON public.token_transactions
  FOR SELECT
  TO anon
  USING (true);
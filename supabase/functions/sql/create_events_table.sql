
-- Plik SQL został zachowany, ale nie będziemy z niego korzystać w obecnej strukturze

CREATE OR REPLACE FUNCTION public.create_events_table_if_not_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the table exists
  IF NOT EXISTS (
    SELECT FROM pg_catalog.pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'events'
  ) THEN
    -- Create the table if it doesn't exist
    CREATE TABLE public.events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      worksheet_id UUID REFERENCES public.worksheets(id),
      user_id UUID,
      type TEXT NOT NULL,
      event_type TEXT,
      metadata JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT (now() AT TIME ZONE 'Europe/Warsaw'),
      ip_address TEXT,
      device_type TEXT,
      referrer_url TEXT,
      geo_location TEXT
    );

    CREATE INDEX events_worksheet_id_idx ON public.events (worksheet_id);
    CREATE INDEX events_user_id_idx ON public.events (user_id);
    CREATE INDEX events_type_idx ON public.events (type);
  END IF;
END;
$$;


import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Adding RLS policies for security...');

    // Enable RLS on export_payments table
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.export_payments ENABLE ROW LEVEL SECURITY;
        
        -- Policy for users to view their own payments (using user_identifier)
        CREATE POLICY IF NOT EXISTS "view_own_payments" ON public.export_payments
        FOR SELECT 
        USING (user_identifier = current_setting('request.jwt.claims', true)::json->>'sub');
        
        -- Policy for edge functions to insert/update payments
        CREATE POLICY IF NOT EXISTS "service_manage_payments" ON public.export_payments
        FOR ALL
        USING (true)
        WITH CHECK (true);
      `
    });

    // Enable RLS on download_sessions table  
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.download_sessions ENABLE ROW LEVEL SECURITY;
        
        -- Policy for edge functions to manage download sessions
        CREATE POLICY IF NOT EXISTS "service_manage_sessions" ON public.download_sessions
        FOR ALL
        USING (true)
        WITH CHECK (true);
      `
    });

    console.log('RLS policies added successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'RLS policies configured' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error adding RLS policies:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to add RLS policies' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

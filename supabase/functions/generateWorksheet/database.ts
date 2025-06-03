
// Database operations
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

export async function saveWorksheetToDatabase(
  sanitizedPrompt: string,
  formData: any,
  jsonContent: string,
  worksheetData: any,
  userId: string | null,
  ip: string
) {
  try {
    const sanitizedFormData = formData ? JSON.parse(JSON.stringify(formData)) : {};
    
    const { data: worksheet, error: worksheetError } = await supabase.rpc(
      'insert_worksheet_bypass_limit',
      {
        p_prompt: sanitizedPrompt,
        p_form_data: sanitizedFormData,
        p_ai_response: jsonContent?.substring(0, 50000) || '',
        p_html_content: JSON.stringify(worksheetData),
        p_user_id: userId || null,
        p_ip_address: ip,
        p_status: 'created',
        p_title: worksheetData.title?.substring(0, 255) || 'Generated Worksheet',
        p_generation_time_seconds: null
      }
    );

    if (worksheetError) {
      console.error('Error saving worksheet to database:', worksheetError);
      return null;
    }

    if (worksheet && worksheet.length > 0 && worksheet[0].id) {
      const worksheetId = worksheet[0].id;
      console.log('Worksheet generated and saved successfully with ID:', worksheetId);
      return worksheetId;
    }
    
    return null;
  } catch (dbError) {
    console.error('Database operation failed:', dbError);
    return null;
  }
}


import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from "../utils/corsHeaders.ts";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Save worksheet to database
export async function saveWorksheetToDatabase(
  worksheetData: any,
  prompt: string,
  userId: string,
  ip: string
): Promise<string | null> {
  try {
    const htmlContent = `<div id="worksheet-content">${JSON.stringify(worksheetData)}</div>`;
    
    const { data: worksheet, error: worksheetError } = await supabase.rpc(
      'insert_worksheet_bypass_limit',
      {
        p_prompt: prompt,
        p_content: JSON.stringify(worksheetData),
        p_user_id: userId,
        p_ip_address: ip,
        p_status: 'created',
        p_title: worksheetData.title
      }
    );

    if (worksheetError) {
      console.error('Error saving worksheet to database:', worksheetError);
      return null;
    }

    // Track generation event if we have a worksheet ID
    if (worksheet && worksheet.length > 0 && worksheet[0].id) {
      const worksheetId = worksheet[0].id;
      await supabase.from('events').insert({
        type: 'generate',
        event_type: 'generate',
        worksheet_id: worksheetId,
        user_id: userId,
        metadata: { prompt, ip },
        ip_address: ip
      });
      console.log('Worksheet generated and saved successfully with ID:', worksheetId);
      return worksheetId;
    }
    return null;
  } catch (dbError) {
    console.error('Database operation failed:', dbError);
    return null;
  }
}


import { supabase } from '@/integrations/supabase/client';

/**
 * Captures HTML content from the worksheet display and saves it to the database
 */
export async function saveWorksheetHtmlContent(worksheetId: string): Promise<boolean> {
  try {
    console.log(`📄 Capturing HTML content for worksheet: ${worksheetId}`);
    
    // Get the worksheet content element
    const worksheetElement = document.getElementById('worksheet-content');
    if (!worksheetElement) {
      console.error('📄 Worksheet content element not found');
      return false;
    }

    // Get the document head content for styles
    const headContent = document.head.innerHTML;
    
    // Create complete HTML document
    const completeHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>English Worksheet</title>
    ${headContent}
    <style>
        /* Additional styles for standalone HTML */
        body {
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        /* Print styles */
        @media print {
            body { background: white; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        ${worksheetElement.outerHTML}
    </div>
</body>
</html>`;

    console.log(`📄 Generated HTML content (${completeHtml.length} characters)`);

    // Update the worksheet with HTML content
    const { error } = await supabase
      .from('worksheets')
      .update({ 
        html_content: completeHtml,
        last_modified_at: new Date().toISOString()
      })
      .eq('id', worksheetId);

    if (error) {
      console.error('📄 Error saving HTML content:', error);
      return false;
    }

    console.log('📄 ✅ HTML content saved successfully');
    return true;
  } catch (error) {
    console.error('📄 Error capturing HTML content:', error);
    return false;
  }
}

/**
 * Saves HTML content with a delay to ensure the worksheet is fully rendered
 */
export async function saveWorksheetHtmlContentDelayed(worksheetId: string, delay: number = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(async () => {
      const success = await saveWorksheetHtmlContent(worksheetId);
      resolve(success);
    }, delay);
  });
}

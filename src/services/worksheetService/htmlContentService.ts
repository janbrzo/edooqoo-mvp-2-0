
import { supabase } from '@/integrations/supabase/client';

/**
 * Captures HTML content from the worksheet display and saves it to the database
 */
export async function saveWorksheetHtmlContent(worksheetId: string): Promise<boolean> {
  try {
    console.log(`📄 Starting HTML capture for worksheet: ${worksheetId}`);
    
    // Wait a bit more for DOM to be fully rendered
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get the worksheet content element with better error handling
    const worksheetElement = document.getElementById('worksheet-content');
    if (!worksheetElement) {
      console.error('📄 Worksheet content element not found with ID: worksheet-content');
      // Try alternative selectors
      const altElement = document.querySelector('.worksheet-content');
      if (!altElement) {
        console.error('📄 No worksheet content found with any selector');
        return false;
      }
      console.log('📄 Found worksheet content with alternative selector');
    }

    const elementToCapture = worksheetElement || document.querySelector('.worksheet-content');
    
    if (!elementToCapture) {
      console.error('📄 No worksheet element found for HTML capture');
      return false;
    }

    console.log(`📄 Element found, capturing content. Element has ${elementToCapture.children.length} children`);

    // Get the document head content for styles
    const headContent = document.head.innerHTML;
    
    // Capture the full HTML content
    const worksheetHtml = elementToCapture.outerHTML;
    console.log(`📄 Captured worksheet HTML: ${worksheetHtml.length} characters`);
    console.log(`📄 HTML preview: ${worksheetHtml.substring(0, 200)}...`);
    
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
        ${worksheetHtml}
    </div>
</body>
</html>`;

    console.log(`📄 Generated complete HTML: ${completeHtml.length} characters`);

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
 * Saves HTML content with enhanced retry logic and better timing
 */
export async function saveWorksheetHtmlContentDelayed(worksheetId: string, delay: number = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(async () => {
      // First attempt
      let success = await saveWorksheetHtmlContent(worksheetId);
      
      // If failed, retry once more after additional delay
      if (!success) {
        console.log('📄 First attempt failed, retrying in 2 seconds...');
        await new Promise(r => setTimeout(r, 2000));
        success = await saveWorksheetHtmlContent(worksheetId);
      }
      
      resolve(success);
    }, delay);
  });
}

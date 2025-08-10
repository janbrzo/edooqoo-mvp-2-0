
import { supabase } from '@/integrations/supabase/client';

/**
 * Updates a worksheet in the database with edited content
 */
export async function updateWorksheetAPI(
  worksheetId: string, 
  editableWorksheet: any, 
  userId: string
) {
  try {
    console.log('🔄 Updating worksheet in database:', worksheetId);
    
    // Serialize the editable worksheet to JSON string for ai_response
    const updatedAiResponse = JSON.stringify(editableWorksheet);
    
    // Generate updated HTML content based on the current editable worksheet
    const updatedHtmlContent = generateWorksheetHTML(editableWorksheet);
    
    const updateData = {
      ai_response: updatedAiResponse,
      title: editableWorksheet.title || 'Untitled Worksheet',
      html_content: updatedHtmlContent,
      last_modified_at: new Date().toISOString()
    };
    
    console.log('📝 Update data prepared:', { 
      worksheetId, 
      title: updateData.title,
      hasHtmlContent: !!updateData.html_content,
      htmlLength: updateData.html_content?.length || 0
    });

    const { data, error } = await supabase
      .from('worksheets')
      .update(updateData)
      .eq('id', worksheetId)
      .eq('teacher_id', userId) // Ensure user can only update their own worksheets
      .select('id, title, last_modified_at')
      .single();

    if (error) {
      console.error('❌ Error updating worksheet:', error);
      throw new Error(`Failed to update worksheet: ${error.message}`);
    }

    console.log('✅ Worksheet updated successfully:', data);
    return { success: true, data };
    
  } catch (error) {
    console.error('💥 Update worksheet error:', error);
    throw error;
  }
}

/**
 * Generates HTML content from worksheet data
 */
function generateWorksheetHTML(worksheet: any): string {
  if (!worksheet) return '';
  
  try {
    // Start building HTML structure
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${worksheet.title || 'English Worksheet'}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .title { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .subtitle { font-size: 18px; color: #666; margin-bottom: 15px; }
        .introduction { background: #f9f9f9; padding: 15px; border-left: 4px solid #007acc; margin-bottom: 25px; }
        .exercise { margin-bottom: 30px; page-break-inside: avoid; }
        .exercise-header { background: #f0f0f0; padding: 10px; margin-bottom: 15px; border-radius: 5px; }
        .exercise-title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
        .exercise-time { color: #666; font-size: 14px; }
        .exercise-instructions { margin-bottom: 15px; }
        .question { margin-bottom: 10px; }
        .vocabulary-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .vocabulary-table th, .vocabulary-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        .vocabulary-table th { background-color: #f2f2f2; font-weight: bold; }
        .teacher-tip { background: #e8f4fd; border: 1px solid #b3d7ff; border-radius: 5px; padding: 15px; margin-top: 10px; }
        .teacher-tip-title { font-weight: bold; color: #0066cc; margin-bottom: 5px; }
        @media print { body { margin: 0; padding: 10mm; } .teacher-tip { page-break-inside: avoid; } }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">${worksheet.title || 'English Worksheet'}</div>
        <div class="subtitle">${worksheet.subtitle || ''}</div>
        <div class="introduction">${worksheet.introduction || ''}</div>
    </div>
`;

    // Add grammar rules if present
    if (worksheet.grammar_rules) {
      html += `
    <div class="exercise">
        <div class="exercise-header">
            <div class="exercise-title">📚 Grammar Focus</div>
        </div>
        <div>${worksheet.grammar_rules}</div>
    </div>`;
    }

    // Add exercises
    if (worksheet.exercises && Array.isArray(worksheet.exercises)) {
      worksheet.exercises.forEach((exercise: any, index: number) => {
        html += `
    <div class="exercise">
        <div class="exercise-header">
            <div class="exercise-title">${exercise.icon || '📝'} ${exercise.title || `Exercise ${index + 1}`}</div>
            <div class="exercise-time">⏱️ ${exercise.time || 10} minutes</div>
        </div>
        <div class="exercise-instructions">${exercise.instructions || ''}</div>`;
        
        // Add exercise content based on type
        if (exercise.content) {
          html += `<div>${exercise.content}</div>`;
        }
        
        if (exercise.questions && Array.isArray(exercise.questions)) {
          exercise.questions.forEach((question: any, qIndex: number) => {
            html += `<div class="question">${qIndex + 1}. ${question.question || question.text || ''}</div>`;
          });
        }
        
        if (exercise.teacher_tip) {
          html += `
        <div class="teacher-tip">
            <div class="teacher-tip-title">💡 Teacher Tip:</div>
            <div>${exercise.teacher_tip}</div>
        </div>`;
        }
        
        html += `</div>`;
      });
    }

    // Add vocabulary sheet
    if (worksheet.vocabulary_sheet && Array.isArray(worksheet.vocabulary_sheet) && worksheet.vocabulary_sheet.length > 0) {
      html += `
    <div class="exercise">
        <div class="exercise-header">
            <div class="exercise-title">📖 Vocabulary</div>
        </div>
        <table class="vocabulary-table">
            <tr>
                <th>Term</th>
                <th>Meaning</th>
            </tr>`;
      
      worksheet.vocabulary_sheet.forEach((item: any) => {
        html += `
            <tr>
                <td>${item.term || ''}</td>
                <td>${item.meaning || ''}</td>
            </tr>`;
      });
      
      html += `
        </table>
    </div>`;
    }

    html += `
    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
        Created with edooqoo.com
    </div>
</body>
</html>`;

    return html;
    
  } catch (error) {
    console.error('Error generating HTML:', error);
    return `<html><body><h1>${worksheet.title || 'English Worksheet'}</h1><p>Error generating content</p></body></html>`;
  }
}

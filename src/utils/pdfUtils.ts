
import html2pdf from 'html2pdf.js';

/**
 * Generate a PDF from an element's content
 * @param elementId The ID of the element to convert
 * @param filename The name for the generated PDF file 
 * @param includeAnswers Whether to include teacher answers in the PDF
 * @param title Title for the PDF document
 * @returns boolean Indicates success/failure
 */
export const generatePDF = async (
  elementId: string, 
  filename: string = 'worksheet.pdf',
  includeAnswers: boolean = false,
  title: string = 'Worksheet'
): Promise<boolean> => {
  console.log('Starting PDF generation for element:', elementId, 'with answers:', includeAnswers);
  
  try {
    // Get the target element
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('Element not found:', elementId);
      return false;
    }
    console.log('Element found, creating clone');
    
    // Create a clone of the element to modify for PDF
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Hide elements marked with data-no-pdf
    const noPdfElements = clone.querySelectorAll('[data-no-pdf]');
    console.log('Hiding', noPdfElements.length, 'elements with data-no-pdf attribute');
    noPdfElements.forEach(el => {
      (el as HTMLElement).style.display = 'none';
    });
    
    // Apply styles to hide student answer areas in teacher mode
    if (!includeAnswers) {
      // Hide student answer portions
      const answerElements = clone.querySelectorAll('.teacher-only');
      console.log('Hiding', answerElements.length, 'teacher-only elements');
      answerElements.forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });
    }
    
    // Add PDF-specific styling
    const style = document.createElement('style');
    style.textContent = `
      body {
        font-family: Arial, sans-serif;
        font-size: 12px;
        line-height: 1.5;
      }
      h1 {
        font-size: 16px;
        line-height: 1.2;
        margin-bottom: 8px;
      }
      h2 {
        font-size: 14px;
        line-height: 1.3;
        margin-bottom: 6px;
      }
      h3 {
        font-size: 13px;
        line-height: 1.4;
        margin-bottom: 5px;
      }
      p {
        font-size: 11px;
        line-height: 1.4;
        margin-bottom: 6px;
      }
      .vocabulary-card {
        break-inside: avoid;
      }
      .exercise-header {
        font-size: 13px;
        font-weight: bold;
        break-after: avoid;
      }
      .exercise-question {
        font-size: 11px;
        margin-bottom: 8px;
        break-inside: avoid;
      }
      .exercise-instruction {
        font-size: 11px;
        font-style: italic;
        margin-bottom: 8px;
      }
      .reading-content {
        font-size: 11px;
        line-height: 1.4;
      }
      .multiple-choice-question {
        font-size: 11px;
        margin-bottom: 12px;
        break-inside: avoid;
      }
      .fill-in-blank-sentence {
        font-size: 11px;
        margin-bottom: 8px;
        break-inside: avoid;
      }
      .matching-item {
        font-size: 11px;
        margin-bottom: 4px;
        break-inside: avoid;
      }
      .vocabulary-definition-label {
        font-size: 10px;
        font-style: italic;
        display: block;
        margin-top: 3px;
        color: #666;
      }
      .teacher-note {
        font-size: 10px;
        font-style: italic;
        color: #555;
        padding: 6px;
        border: 1px solid #ccc;
        background-color: #f9f9f9;
        margin-top: 6px;
        margin-bottom: 6px;
      }
      @media print {
        .page-break {
          page-break-after: always;
        }
      }
    `;
    clone.appendChild(style);
    console.log('PDF-specific styles added');
    
    // Configure PDF options
    const options = {
      margin: 10,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    
    console.log('Starting HTML2PDF conversion with options:', JSON.stringify(options));
    
    // Generate PDF
    await html2pdf()
      .from(clone)
      .set(options)
      .save();
    
    console.log('PDF generation completed successfully');
    return true;
  } catch (error) {
    console.error('PDF generation error:', error);
    return false;
  }
};

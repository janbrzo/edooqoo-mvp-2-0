
import html2pdf from 'html2pdf.js';

/**
 * Adds page numbers to the PDF document
 */
const addPageNumbers = (pdf: any) => {
  const totalPages = pdf.internal.getNumberOfPages();
  
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(10);
    pdf.setTextColor(100);
    pdf.text(`Page ${i} of ${totalPages}`, pdf.internal.pageSize.getWidth() - 50, 
             pdf.internal.pageSize.getHeight() - 10);
  }
  
  return pdf;
};

/**
 * Generates a PDF from the worksheet content
 */
export const generatePDF = async (
  elementId: string, 
  filename: string, 
  isTeacherView: boolean, 
  title: string
): Promise<boolean> => {
  try {
    // Get the element to convert to PDF
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('Element not found for PDF generation');
      return false;
    }
    
    // Hide elements that shouldn't be in the PDF
    const noPdfElements = element.querySelectorAll('[data-no-pdf="true"]');
    noPdfElements.forEach(el => {
      (el as HTMLElement).style.display = 'none';
    });
    
    // Create a clone to avoid modifying the original DOM
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Add a class to force page break before Vocabulary Sheet
    const vocabSection = clone.querySelector('.vocabulary-sheet') as HTMLElement;
    if (vocabSection) {
      vocabSection.style.pageBreakBefore = 'always';
    }
    
    // Set margin to reduce empty space in exercises
    const exerciseContainers = clone.querySelectorAll('.exercise-content, .vocabulary-card');
    exerciseContainers.forEach(el => {
      (el as HTMLElement).style.marginBottom = '10px';
    });

    // Zmniejszamy odstępy między elementami, aby uniknąć pustej przestrzeni
    const exerciseSections = clone.querySelectorAll('.exercise-section');
    exerciseSections.forEach(el => {
      (el as HTMLElement).style.marginBottom = '5px';
      (el as HTMLElement).style.paddingBottom = '5px';
    });

    // Usuwamy zbyt duże marginesy w sekcjach zadań
    const exerciseContents = clone.querySelectorAll('.exercise-content > div');
    exerciseContents.forEach(el => {
      (el as HTMLElement).style.marginBottom = '8px';
    });

    // Generate PDF
    const opt = {
      margin: [15, 15],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], avoid: '.avoid-page-break' }
    };
    
    // Generate the PDF
    const pdf = await html2pdf().from(clone).set(opt).toPdf();
    
    // Add page numbers
    const pdfWithNumbers = addPageNumbers(pdf.raw);
    
    // Save the final PDF
    await pdfWithNumbers.save(filename);
    
    // Restore display of hidden elements
    noPdfElements.forEach(el => {
      (el as HTMLElement).style.display = '';
    });
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};

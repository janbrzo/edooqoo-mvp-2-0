
import html2pdf from 'html2pdf.js';

/**
 * Generates a PDF from the content of the given element
 */
export async function generatePDF(elementId: string, filename = 'worksheet', isTeacher: boolean = false, title: string = 'Worksheet') {
  try {
    console.log(`Generating PDF for ${elementId}...`);
    const element = document.getElementById(elementId);

    if (!element) {
      console.error(`Element with ID ${elementId} not found.`);
      return false;
    }

    // Clone the element so we can modify it without affecting the original
    const clonedElement = element.cloneNode(true) as HTMLElement;

    // Process PDF-specific elements
    processPdfElements(clonedElement, isTeacher);
    
    // Add page numbers to the bottom of each page
    const customFooter = function(pdf: any, document: any) {
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setTextColor(150);
        const pageSize = pdf.internal.pageSize;
        const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
        pdf.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pdf.internal.pageSize.height - 10, { align: "center" });
      }
    };

    // Options for html2pdf
    const opt = {
      margin: [0.75, 0.75, 1, 0.75], // Add more margin at bottom for page numbers [top, right, bottom, left]
      filename: `${filename}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
      },
      jsPDF: {
        unit: 'in', 
        format: 'a4', 
        orientation: 'portrait',
      },
      pagebreak: { mode: 'avoid-all' }, // Try to avoid breaking inside elements
      enableLinks: true,
      footer: {
        height: "0.5in",
        contents: {
          default: customFooter
        }
      }
    };

    // Generate the PDF
    return new Promise((resolve) => {
      html2pdf().from(clonedElement).set(opt).toPdf().get('pdf').then((pdf: any) => {
        // Add page numbers
        customFooter(pdf, document);
        
        // Add title to PDF metadata
        const dateStr = new Date().toISOString().split('T')[0];
        const docTitle = `${title} (${dateStr})`;
        pdf.setProperties({
          title: docTitle,
          subject: 'ESL Worksheet',
          author: 'Worksheet Generator',
          keywords: 'ESL, English, Worksheet, Education',
          creator: 'Worksheet Generator App'
        });
        
        // Save and resolve
        pdf.save(`${filename}.pdf`);
        resolve(true);
      }).catch((err: Error) => {
        console.error('Error generating PDF:', err);
        resolve(false);
      });
    });
  } catch (error) {
    console.error('Error in generatePDF:', error);
    return false;
  }
}

/**
 * Process elements for PDF output
 */
function processPdfElements(element: HTMLElement, isTeacher: boolean) {
  // Remove elements that should not be in the PDF
  const noPdfElements = element.querySelectorAll('[data-no-pdf]');
  noPdfElements.forEach((el) => {
    el.parentNode?.removeChild(el);
  });
  
  // Remove teacher tips if not teacher view
  if (!isTeacher) {
    const teacherTips = element.querySelectorAll('.teacher-tip');
    teacherTips.forEach((el) => {
      el.parentNode?.removeChild(el);
    });
  }
  
  // Adjust exercises for PDF format (add page breaks, etc.)
  const exercises = element.querySelectorAll('.exercise-section');
  exercises.forEach((exercise, index) => {
    // Add page break before exercises except the first one
    if (index > 0) {
      (exercise as HTMLElement).style.pageBreakBefore = 'always';
      (exercise as HTMLElement).style.paddingTop = '0.5in';
    }
    
    // Add specific CSS class for PDF styling
    exercise.classList.add('pdf-exercise');
  });
  
  // Reduce white space between elements
  const spacers = element.querySelectorAll('.mb-6, .mb-8, .mb-4');
  spacers.forEach((spacer) => {
    (spacer as HTMLElement).style.marginBottom = '0.3in';
  });
  
  // Remove buttons and interactive elements
  const buttons = element.querySelectorAll('button');
  buttons.forEach((button) => {
    button.parentNode?.removeChild(button);
  });
  
  // Remove any large empty spaces
  const paragraphs = element.querySelectorAll('p');
  paragraphs.forEach((p) => {
    if (p.textContent?.trim() === '') {
      p.parentNode?.removeChild(p);
    }
  });
  
  // Add appropriate spacing and breaks
  addPageBreaksForPdf(element);
}

/**
 * Adds strategic page breaks for better PDF output
 */
function addPageBreaksForPdf(element: HTMLElement) {
  // Add page break before vocabulary sheet if exists
  const vocabSheet = element.querySelector('.vocabulary-sheet');
  if (vocabSheet) {
    (vocabSheet as HTMLElement).style.pageBreakBefore = 'always';
    (vocabSheet as HTMLElement).style.paddingTop = '0.5in';
  }
  
  // Ensure reading passages don't break across pages
  const readingContents = element.querySelectorAll('.reading-content');
  readingContents.forEach((content) => {
    content.classList.add('avoid-page-break');
    (content as HTMLElement).style.pageBreakInside = 'avoid';
  });
  
  // Make sure exercise headers stay with their content
  const exerciseHeaders = element.querySelectorAll('.exercise-header');
  exerciseHeaders.forEach((header) => {
    (header as HTMLElement).style.pageBreakAfter = 'avoid';
  });
}

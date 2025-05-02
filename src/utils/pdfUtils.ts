
import html2pdf from 'html2pdf.js';

/**
 * Generates a PDF from a given element ID
 * @param elementId The ID of the element to convert to PDF
 * @param filename The filename for the PDF
 * @param isTeacherVersion Whether this is a teacher version (with answers)
 * @param title The title of the worksheet for PDF metadata
 */
export async function generatePDF(
  elementId: string,
  filename: string,
  isTeacherVersion: boolean = false,
  title: string = 'English Worksheet'
): Promise<boolean> {
  try {
    // Get the element
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('Element not found:', elementId);
      return false;
    }

    // Create a deep clone of the element to avoid modifying the original
    const clonedElement = element.cloneNode(true) as HTMLElement;

    // Remove elements marked as no-pdf
    const noPdfElements = clonedElement.querySelectorAll('[data-no-pdf="true"]');
    noPdfElements.forEach(el => el.remove());

    // Add page numbers with CSS
    const pageNumberStyle = document.createElement('style');
    pageNumberStyle.textContent = `
      .pdf-page-number {
        position: absolute;
        bottom: 10px;
        right: 10px;
        font-size: 10px;
        color: #666;
      }
      @media print {
        .pdf-page-number {
          position: fixed;
          bottom: 10px;
          right: 10px;
        }
        .pdf-content-wrapper {
          font-size: 90%;
        }
        .pdf-content-wrapper h1 {
          font-size: 24px !important;
        }
        .pdf-content-wrapper h2 {
          font-size: 20px !important;
        }
        .pdf-content-wrapper h3 {
          font-size: 18px !important;
        }
        .pdf-content-wrapper .exercise-content p {
          font-size: 14px !important;
        }
        .pdf-content-wrapper .exercise-questions {
          font-size: 14px !important;
        }
        .pdf-content-wrapper .dialogue-section {
          margin-bottom: 0.5rem !important;
        }
        .pdf-content-wrapper .dialogue-line {
          margin-bottom: 0.25rem !important;
        }
        .avoid-page-break {
          page-break-inside: avoid;
        }
      }
    `;
    
    clonedElement.appendChild(pageNumberStyle);
    
    // Add wrapper for content scaling
    const wrapper = document.createElement('div');
    wrapper.className = 'pdf-content-wrapper';
    
    // Move all children to the wrapper
    while(clonedElement.firstChild) {
      wrapper.appendChild(clonedElement.firstChild);
    }
    
    // Add wrapper back to the element
    clonedElement.appendChild(wrapper);

    // Configure html2pdf options
    const opt = {
      margin: [10, 10, 15, 10], // Reduced margins [top, right, bottom, left] in mm
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: false
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        compressPDF: true
      },
      pagebreak: { 
        mode: ['avoid-all', 'css', 'legacy'],
        avoid: '.avoid-page-break'
      },
      enableLinks: true
    };
    
    // Add page numbering
    const worker = html2pdf().from(clonedElement).set(opt);
    
    // Add page numbers
    worker.toContainer().then(function(container) {
      // Add page numbers after rendering
      let pages = container.querySelectorAll('.html2pdf__page-break');
      let pageCount = pages.length + 1; // +1 because page breaks are between pages
      
      for (let i = 0; i < pageCount; i++) {
        const pageNumberDiv = document.createElement('div');
        pageNumberDiv.className = 'pdf-page-number';
        pageNumberDiv.textContent = `Page ${i + 1} of ${pageCount}`;
        
        // Position the page number at the correct page
        if (i === 0) {
          container.firstChild.appendChild(pageNumberDiv);
        } else if (i < pages.length) {
          const pageBreak = pages[i-1];
          pageBreak.parentNode.insertBefore(pageNumberDiv, pageBreak.nextSibling);
        } else {
          container.lastChild.appendChild(pageNumberDiv);
        }
      }
    });
      
    // Remove any previous "Preparing PDF" message
    const existingMessage = document.getElementById('pdf-generation-message');
    if (existingMessage) {
      existingMessage.remove();
    }
      
    return new Promise((resolve) => {
      worker.save().then(() => {
        // PDF generation complete
        resolve(true);
      }).catch((error) => {
        console.error('PDF generation error:', error);
        resolve(false);
      });
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
}


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

    // Dodanie stylów do poprawy generowania PDF
    const pdfStyles = document.createElement('style');
    pdfStyles.textContent = `
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
      }
      /* Usuwanie dużych pustych przestrzeni */
      .avoid-page-break {
        margin-bottom: 10px !important;
        padding-bottom: 0 !important;
      }
      /* Poprawa przestrzeni między zadaniami */
      .mb-4 {
        margin-bottom: 0.5rem !important;
      }
    `;
    
    clonedElement.appendChild(pdfStyles);
    
    // Dodanie wrappera dla zawartości
    const wrapper = document.createElement('div');
    wrapper.className = 'pdf-content-wrapper';
    
    // Przeniesienie wszystkich dzieci do wrappera
    while(clonedElement.firstChild) {
      wrapper.appendChild(clonedElement.firstChild);
    }
    
    // Dodanie wrappera z powrotem do elementu
    clonedElement.appendChild(wrapper);

    // Ustawienie opcji html2pdf
    const opt = {
      margin: [10, 10, 15, 10], // Zmniejszone marginesy [góra, prawo, dół, lewo] w mm
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
    
    // Dodanie funkcji do obsługi numerowania stron
    const worker = html2pdf().from(clonedElement).set(opt);

    worker.toContainer().then(function() {
      worker.toPdf().get('pdf').then(function(pdf) {
        const totalPages = pdf.internal.getNumberOfPages();
        
        // Dodaj numery stron do każdej strony
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.setFontSize(8);
          pdf.setTextColor(100);
          pdf.text('Page ' + i + ' of ' + totalPages, pdf.internal.pageSize.getWidth() - 25, pdf.internal.pageSize.getHeight() - 10);
        }
      });
    });
    
    // Usunięcie istniejących komunikatów "Preparing PDF"
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

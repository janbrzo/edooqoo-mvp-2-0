
import html2pdf from 'html2pdf.js';

/**
 * Generate PDF from DOM element
 * 
 * @param elementId ID of element to convert to PDF
 * @param filename Filename for the PDF
 * @param includeTeacherContent Whether to include teacher notes
 * @returns Promise resolving to true if PDF was successfully generated
 */
export const generatePDF = async (elementId: string, filename: string, includeTeacherContent: boolean = false, title: string = 'Worksheet'): Promise<boolean> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) return false;
    
    // Create a clone of the element to modify for PDF
    const clonedElement = element.cloneNode(true) as HTMLElement;
    
    // Remove elements that should not appear in PDFs
    const noPdfElements = clonedElement.querySelectorAll('[data-no-pdf="true"]');
    noPdfElements.forEach(el => el.remove());
    
    // Get the current view mode (student/teacher) from the toolbar
    // This way we dynamically know which version we're exporting
    const viewMode = includeTeacherContent ? 'Teacher' : 'Student';
    
    // Create view mode banner element to add to the PDF
    const viewModeBanner = document.createElement('div');
    viewModeBanner.className = includeTeacherContent ? 
      'bg-indigo-100 p-3 mb-4 text-center text-indigo-700 font-bold' : 
      'bg-blue-100 p-3 mb-4 text-center text-blue-700 font-bold';
    viewModeBanner.textContent = `${viewMode} View`;
    
    // Insert the banner at the top of the cloned element
    if (clonedElement.firstChild) {
      clonedElement.insertBefore(viewModeBanner, clonedElement.firstChild);
    } else {
      clonedElement.appendChild(viewModeBanner);
    }
    
    // If this is the student view, hide teacher-specific elements
    if (!includeTeacherContent) {
      const teacherElements = clonedElement.querySelectorAll('.teacher-view-only');
      teacherElements.forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });
    }
    
    // Remove the toolbar (student/teacher toggle)
    const toolbar = clonedElement.querySelector('[class*="sticky top-0"]');
    if (toolbar) {
      toolbar.remove();
    }
    
    // Options for PDF generation
    const opt = {
      margin: [10, 15, 10, 15], // [top, right, bottom, left]
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    
    // Workaround for html2pdf not showing background colors
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      * {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    `;
    clonedElement.appendChild(styleElement);
    
    // Generate and download the PDF
    await html2pdf().from(clonedElement).set(opt).save();
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};

/**
 * Export element content as HTML file
 * 
 * @param elementId ID or reference to element to export as HTML
 * @param filename Filename for the HTML file
 * @returns Promise resolving to true if HTML was successfully exported
 */
export const exportAsHTML = async (elementOrId: string | HTMLElement, filename: string): Promise<boolean> => {
  try {
    let element: HTMLElement | null = null;
    
    if (typeof elementOrId === 'string') {
      element = document.getElementById(elementOrId);
    } else {
      element = elementOrId;
    }
    
    if (!element) return false;
    
    // Create a clone of the element to modify for export
    const clonedElement = element.cloneNode(true) as HTMLElement;
    
    // Remove elements that should not appear in exports
    const noExportElements = clonedElement.querySelectorAll('[data-no-pdf="true"]');
    noExportElements.forEach(el => el.remove());
    
    // Remove the toolbar if it exists (we'll add our own banner)
    const toolbar = clonedElement.querySelector('[class*="sticky top-0"]');
    if (toolbar) {
      toolbar.remove();
    }
    
    // Create a full HTML document
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${document.title || 'Worksheet'}</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f9f9f9;
            padding: 1rem;
          }
          .container {
            max-width: 900px;
            margin: 0 auto;
            background-color: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .page-break {
            page-break-before: always;
          }
          @media print {
            body {
              background-color: white;
              padding: 0;
            }
            .container {
              box-shadow: none;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${clonedElement.outerHTML}
        </div>
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            // Initialize any interactive elements if needed
          });
        </script>
      </body>
      </html>
    `;
    
    // Create a blob from the HTML
    const blob = new Blob([html], { type: 'text/html' });
    
    // Create a URL for the blob and trigger a download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    return true;
  } catch (error) {
    console.error('Error exporting HTML:', error);
    return false;
  }
};

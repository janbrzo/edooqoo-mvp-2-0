
import html2pdf from "html2pdf.js";

/**
 * Generates a PDF from a DOM element
 * @param elementId ID of the element to convert to PDF
 * @param filename Name of the PDF file to download
 * @param isTeacherView Whether this is the teacher's view or student's view
 * @param title The title of the worksheet for the header
 * @returns Promise that resolves when PDF is generated
 */
export async function generatePDF(
  elementId: string,
  filename: string,
  isTeacherView: boolean = false,
  title: string = "English Worksheet"
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      // Clone the element to avoid modifying the original DOM
      const element = document.getElementById(elementId);
      if (!element) {
        reject(new Error("Element not found"));
        return;
      }

      // Clone the element to avoid modifying the original DOM
      const clonedElement = element.cloneNode(true) as HTMLElement;
      
      // Remove buttons and any other elements we don't want in the PDF
      const buttonsToRemove = clonedElement.querySelectorAll('button, .button, .btn');
      buttonsToRemove.forEach(button => button.remove());
      
      // Remove any interactive elements
      const interactiveElements = clonedElement.querySelectorAll('input, select, textarea');
      interactiveElements.forEach(el => {
        const span = document.createElement('span');
        if ((el as HTMLInputElement).value) {
          span.textContent = (el as HTMLInputElement).value;
        }
        el.parentNode?.replaceChild(span, el);
      });
      
      // Add page numbers and headers to each page
      const headerHtml = `
        <div style="text-align: center; font-size: 10pt; color: #666; margin-bottom: 10px;">
          ${title} - ${isTeacherView ? "Teacher's Version" : "Student's Version"}
        </div>
      `;
      
      const footerHtml = `
        <div style="text-align: center; font-size: 10pt; color: #666; margin-top: 10px;">
          Page _PAGE_ of _TOTAL_
        </div>
      `;
      
      // PDF Options
      const options = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'], before: '.pagebreak-before', after: '.pagebreak-after', avoid: '.avoid-pagebreak' },
        header: { height: '0.5in', contents: headerHtml },
        footer: { height: '0.5in', contents: footerHtml }
      };
      
      // Generate PDF
      html2pdf()
        .set(options)
        .from(clonedElement)
        .save()
        .then(() => {
          console.log("PDF generated successfully");
          resolve(true);
        })
        .catch(error => {
          console.error("PDF generation error:", error);
          reject(error);
        });
    } catch (error) {
      console.error("PDF generation error:", error);
      reject(error);
    }
  });
}


import html2pdf from 'html2pdf.js';
import { format } from 'date-fns';

export const generatePDF = async (elementId: string, filename: string, isTeacherVersion: boolean, title: string) => {
  try {
    // Create a clone of the element to modify it for PDF
    const element = document.getElementById(elementId);
    if (!element) return false;
    
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Remove any elements with data-no-pdf attribute
    const noPdfElements = clone.querySelectorAll('[data-no-pdf="true"]');
    noPdfElements.forEach(el => el.remove());
    
    // Remove the teacher notes section for both versions
    const teacherNotesSection = clone.querySelector('.teacher-notes');
    if (teacherNotesSection) {
      teacherNotesSection.remove();
    }
    
    // Remove rating section
    const ratingSection = clone.querySelector('.rating-section');
    if (ratingSection) {
      ratingSection.remove();
    }
    
    // Create a temporary container for the cloned content
    const container = document.createElement('div');
    container.appendChild(clone);
    
    // Set the wrapper style for the PDF
    clone.style.padding = '15px'; // Smaller side margins
    
    // Create a formatted filename in the correct format: YYYY-MM-DD-Role-title
    const today = format(new Date(), 'yyyy-MM-dd');
    const role = isTeacherVersion ? 'Teacher' : 'Student';
    const formattedTitle = title.toLowerCase().replace(/\s+/g, '-').substring(0, 30);
    const formattedFilename = `${today}-${role}-${formattedTitle}.pdf`;
    
    // Add a header to show whether it's a student or teacher version
    const header = document.createElement('div');
    header.style.position = 'running(header)';
    header.style.fontWeight = 'bold';
    header.style.textAlign = 'center';
    header.style.padding = '5px 0'; // Smaller padding
    header.style.borderBottom = '1px solid #ddd';
    header.style.color = '#3d348b';
    header.style.fontSize = '14px'; // Moderate font size
    header.innerHTML = `${title} - ${isTeacherVersion ? 'Teacher' : 'Student'} Version`;
    container.prepend(header);
    
    // Add a footer with page numbers
    const footer = document.createElement('div');
    footer.style.position = 'running(footer)';
    footer.style.textAlign = 'center';
    footer.style.padding = '5px 0';
    footer.style.fontSize = '10px'; // Slightly larger font
    footer.style.color = '#666';
    footer.innerHTML = 'Page <span class="pageNumber"></span> of <span class="totalPages"></span>';
    container.appendChild(footer);
    
    // Add a loading indicator
    const loadingElement = document.createElement('div');
    loadingElement.style.position = 'fixed';
    loadingElement.style.top = '50%';
    loadingElement.style.left = '50%';
    loadingElement.style.transform = 'translate(-50%, -50%)';
    loadingElement.style.background = 'rgba(255, 255, 255, 0.8)';
    loadingElement.style.padding = '20px';
    loadingElement.style.borderRadius = '8px';
    loadingElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    loadingElement.style.zIndex = '9999';
    loadingElement.innerHTML = '<div style="display: flex; flex-direction: column; align-items: center;"><div style="border: 4px solid #f3f3f3; border-top: 4px solid #3d348b; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite;"></div><div style="margin-top: 15px; font-weight: bold; color: #3d348b;">Preparing PDF...</div></div>';
    document.body.appendChild(loadingElement);
    
    // Add a style for the loading animation
    const style = document.createElement('style');
    style.innerHTML = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
    document.head.appendChild(style);
    
    // Font size adjustments (moderate increase)
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .pdf-content * {
        font-size: 1.1em;
      }
      
      /* Font sizes for different heading levels */
      .pdf-content h1 { font-size: 1.5em !important; font-weight: bold !important; }
      .pdf-content h2 { font-size: 1.3em !important; font-weight: bold !important; }
      .pdf-content h3 { font-size: 1.2em !important; font-weight: bold !important; }
      
      /* Exercise components */
      .pdf-content .exercise-title { font-size: 1.2em !important; font-weight: bold !important; }
      .pdf-content .question-text { font-size: 1.1em !important; font-weight: bold !important; }
      .pdf-content .instruction { font-size: 1.05em !important; font-style: italic !important; }
      .pdf-content .reading-content { font-size: 1.05em !important; line-height: 1.4 !important; }
      
      /* Spacing adjustments */
      .pdf-content .exercise-section {
        margin-bottom: 10px !important;
        page-break-inside: avoid;
      }
      
      /* Reduce excessive spacing */
      .pdf-content .matching-exercise .matching-item,
      .pdf-content .fill-in-blanks-exercise .sentence-item,
      .pdf-content .multiple-choice-exercise .question-item,
      .pdf-content .exercise-section + .exercise-section {
        margin-top: 0 !important;
        padding-top: 0 !important;
        margin-bottom: 8px !important;
      }
      
      /* Optimize spacing */
      .pdf-content p, 
      .pdf-content div, 
      .pdf-content li {
        margin-bottom: 5px !important;
        line-height: 1.3 !important;
      }
      
      /* Fix large whitespace gaps */
      .pdf-content .exercise-section {
        padding-bottom: 0 !important;
      }
    `;
    clone.classList.add('pdf-content');
    container.appendChild(styleElement);
    
    // Find and process exercise sections to reduce whitespace
    const exerciseSections = clone.querySelectorAll('.exercise-section');
    exerciseSections.forEach(section => {
      // Remove excessive margins and paddings
      (section as HTMLElement).style.marginBottom = '10px';
      (section as HTMLElement).style.paddingBottom = '0px';
      
      // Add page break rules
      (section as HTMLElement).style.pageBreakInside = 'avoid';
    });
    
    // Configure html2pdf options with smaller margins
    const options = {
      margin: [15, 10, 15, 10], // top, right, bottom, left - smaller side margins
      filename: formattedFilename, // Use the formatted filename
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { 
        scale: 2,
        useCORS: true, 
        letterRendering: true,
        logging: false, 
        dpi: 192, 
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true,
        quality: 100
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'], before: '.page-break' },
      enableLinks: true
    };
    
    // Generate the PDF
    const result = await html2pdf().set(options).from(container.innerHTML).save();
    
    // Remove the temporary elements
    document.body.removeChild(loadingElement);
    document.head.removeChild(style);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};

export const exportAsHTML = (elementId: string, filename: string) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) return false;
    
    // Create a clone of the element to modify it
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Remove elements with data-no-pdf attribute (they also shouldn't be in HTML export)
    const noPdfElements = clone.querySelectorAll('[data-no-pdf="true"]');
    noPdfElements.forEach(el => el.remove());
    
    // Get the HTML content
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${filename}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #3d348b; }
            h2 { color: #5e44a0; }
            .exercise { margin-bottom: 2em; border: 1px solid #eee; padding: 1em; border-radius: 5px; }
            .exercise-header { display: flex; align-items: center; margin-bottom: 1em; }
            .exercise-icon { margin-right: 0.5em; }
            .instruction { background-color: #f9f9f9; padding: 0.8em; border-left: 3px solid #5e44a0; margin-bottom: 1em; }
          </style>
        </head>
        <body>
          ${clone.innerHTML}
        </body>
      </html>
    `;
    
    // Create a Blob from the HTML content
    const blob = new Blob([html], { type: 'text/html' });
    
    // Create an anchor element and set properties for download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    
    // Append to body, click and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error('Error exporting as HTML:', error);
    return false;
  }
};

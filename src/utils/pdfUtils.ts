
import html2pdf from 'html2pdf.js';

export const generatePDF = async (elementId: string, filename: string, isTeacherVersion: boolean, title: string) => {
  try {
    // Create a clone of the element to modify it for PDF
    const element = document.getElementById(elementId);
    if (!element) return false;
    
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Remove any elements with data-no-pdf attribute
    const noPdfElements = clone.querySelectorAll('[data-no-pdf="true"]');
    noPdfElements.forEach(el => el.remove());
    
    // Also remove the TeacherNotes section
    const teacherNotesSection = clone.querySelector('.teacher-notes');
    if (teacherNotesSection) {
      teacherNotesSection.remove();
    }
    
    // Create a temporary container for the cloned content
    const container = document.createElement('div');
    container.appendChild(clone);
    
    // Set the wrapper style for the PDF
    clone.style.padding = '20px';
    
    // Add a header to show whether it's a student or teacher version
    const header = document.createElement('div');
    header.style.position = 'running(header)';
    header.style.fontWeight = 'bold';
    header.style.textAlign = 'center';
    header.style.padding = '10px 0';
    header.style.borderBottom = '1px solid #ddd';
    header.style.color = '#3d348b';
    header.innerHTML = `${title} - ${isTeacherVersion ? 'Teacher' : 'Student'} Version`;
    container.prepend(header);
    
    // Add a footer with page numbers
    const footer = document.createElement('div');
    footer.style.position = 'running(footer)';
    footer.style.textAlign = 'center';
    footer.style.padding = '10px 0';
    footer.style.fontSize = '10px';
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

    // Format the current date for the filename
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Sanitize title for filename
    const sanitizedTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
      
    // Create the formatted filename
    const formattedFilename = `${currentDate}-${isTeacherVersion ? 'Teacher' : 'Student'}-${sanitizedTitle}.pdf`;
    
    // Configure html2pdf options with reduced margins
    const options = {
      margin: [15, 7.5, 20, 7.5], // top, right, bottom, left - reduced side margins by half
      filename: formattedFilename,
      image: { type: 'jpeg', quality: 0.98 },
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
      pagebreak: { mode: 'avoid-all', before: '.page-break' },
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

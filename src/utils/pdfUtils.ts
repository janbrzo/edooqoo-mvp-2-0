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
    
    // Remove all teacher tips sections when generating student version (they should not appear in PDF)
    if (!isTeacherVersion) {
      const teacherTips = clone.querySelectorAll('.teacher-tip');
      teacherTips.forEach(el => el.remove());
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
    header.style.fontSize = '12.6px'; // Reduced by 10% from 14px
    header.innerHTML = `${title} - ${isTeacherVersion ? 'Teacher' : 'Student'} Version`;
    container.prepend(header);
    
    // Add a footer with page numbers
    const footer = document.createElement('div');
    footer.style.position = 'running(footer)';
    footer.style.textAlign = 'center';
    footer.style.padding = '10px 0';
    footer.style.fontSize = '9px'; // Reduced by 10% from 10px
    footer.style.color = '#666';
    footer.innerHTML = 'Page <span class="pageNumber"></span> of <span class="totalPages"></span>';
    container.appendChild(footer);
    
    // Apply font size reductions and space optimization
    const fontSizeAdjustments = `
      <style>
        /* Base font size reductions */
        h1 { font-size: 27px !important; } /* Reduced from 30px */
        h2 { font-size: 21.6px !important; } /* Reduced from 24px */
        h3 { font-size: 18px !important; } /* Reduced from 20px */
        h4 { font-size: 16.2px !important; } /* Reduced from 18px */
        p, li, td, th { font-size: 13.5px !important; } /* Reduced from 15px */
        
        /* Exercise specific reductions */
        .exercise-header { font-size: 18px !important; } /* Reduced from 20px */
        .exercise-instructions { font-size: 13.5px !important; } /* Reduced from 15px */
        .exercise-content { font-size: 13.5px !important; } /* Reduced from 15px */
        .question-text { font-size: 13.5px !important; } /* Reduced from 15px */
        .answer-text { font-size: 12.6px !important; } /* Reduced from 14px */
        
        /* Reduce whitespace - aggressive space reduction */
        .mb-6 { margin-bottom: 0.5rem !important; }
        .mb-8 { margin-bottom: 0.5rem !important; }
        .mb-4 { margin-bottom: 0.4rem !important; }
        .p-6 { padding: 0.5rem !important; }
        .p-5 { padding: 0.5rem !important; }
        .p-4 { padding: 0.4rem !important; }
        .py-2 { padding-top: 0.15rem !important; padding-bottom: 0.15rem !important; }
        
        /* Fix spacing between exercises */
        .exercise + .exercise { margin-top: 2px !important; }
        
        /* Remove vertical white space */
        .space-y-4 > * + * { margin-top: 0.25rem !important; }
        .space-y-2 > * + * { margin-top: 0.15rem !important; }
        
        /* Target specific exercise types for space optimization */
        .bg-gray-50 { padding: 0.3rem !important; margin-bottom: 0.3rem !important; }
        
        /* Make sure text is compact but still readable */
        .whitespace-pre-line { white-space: normal !important; }
        
        /* Optimize page breaks */
        .page-break { page-break-before: always; }
        h1, h2, h3, h4 { page-break-after: avoid; }
      </style>
    `;
    container.insertAdjacentHTML('afterbegin', fontSizeAdjustments);
    
    // Configure html2pdf options
    const options = {
      margin: [15, 3.75, 20, 3.75], // top, right, bottom, left (reduced side margins by half from [15, 7.5, 20, 7.5])
      filename: filename,
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
        putOnlyUsedFonts: true
      },
      pagebreak: { 
        mode: ['avoid-all', 'css', 'legacy'], 
        before: '.page-break', 
        avoid: ['img', 'table', 'div.avoid-page-break'] 
      },
      enableLinks: true
    };
    
    // Generate the PDF
    const result = await html2pdf().set(options).from(container.innerHTML).save();
    console.log('PDF generated successfully:', filename);
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
            h1 { color: #3d348b; font-size: 24px; }
            h2 { color: #5e44a0; font-size: 20px; }
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

export const downloadCurrentViewAsHtml = async (elementId: string, filename: string, isTeacherVersion: boolean, title: string) => {
  try {
    // Clone the document
    const documentClone = document.documentElement.cloneNode(true) as HTMLElement;
    
    // Get the main content element
    const element = documentClone.querySelector(`#${elementId}`);
    if (!element) return false;
    
    // Remove elements with data-no-pdf attribute (they also shouldn't be in HTML export)
    const noPdfElements = documentClone.querySelectorAll('[data-no-pdf="true"]');
    noPdfElements.forEach(el => el.remove());
    
    // Remove all teacher tips sections when generating student version
    if (!isTeacherVersion) {
      const teacherTips = documentClone.querySelectorAll('.teacher-tip');
      teacherTips.forEach(el => el.remove());
    }
    
    // Remove external script tags but keep inline scripts for Student/Teacher toggle
    const externalScripts = documentClone.querySelectorAll('script[src]');
    externalScripts.forEach(script => script.remove());
    
    // Fetch and inline all external CSS
    const linkElements = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
    const head = documentClone.querySelector('head');
    
    if (head) {
      // Add version information at the top
      const versionHeader = documentClone.createElement('div');
      versionHeader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #3d348b;
        color: white;
        text-align: center;
        padding: 10px;
        font-weight: bold;
        z-index: 1000;
        font-family: Arial, sans-serif;
      `;
      versionHeader.innerHTML = `${title} - ${isTeacherVersion ? 'Teacher' : 'Student'} Version`;
      documentClone.body.insertBefore(versionHeader, documentClone.body.firstChild);
      
      // Add margin to body to account for fixed header
      const bodyStyle = documentClone.createElement('style');
      bodyStyle.textContent = `
        body { 
          margin-top: 60px !important; 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 1200px; 
          margin-left: auto; 
          margin-right: auto; 
          padding: 20px; 
        }
      `;
      head.appendChild(bodyStyle);
      
      // Fetch and inline external stylesheets
      for (const link of linkElements) {
        try {
          const response = await fetch(link.href);
          if (response.ok) {
            const cssText = await response.text();
            const styleElement = documentClone.createElement('style');
            styleElement.textContent = cssText;
            head.appendChild(styleElement);
          }
        } catch (error) {
          console.warn(`Failed to fetch CSS from ${link.href}:`, error);
        }
      }
      
      // Also collect and inline rules from document.styleSheets
      try {
        for (const styleSheet of Array.from(document.styleSheets)) {
          try {
            const rules = Array.from(styleSheet.cssRules || styleSheet.rules || []);
            if (rules.length > 0) {
              const styleElement = documentClone.createElement('style');
              styleElement.textContent = rules.map(rule => rule.cssText).join('\n');
              head.appendChild(styleElement);
            }
          } catch (e) {
            // Skip stylesheets that can't be accessed due to CORS
            console.warn('Skipping stylesheet due to CORS:', e);
          }
        }
      } catch (error) {
        console.warn('Error accessing document.styleSheets:', error);
      }
      
      // Add additional styles for better layout
      const additionalStyles = documentClone.createElement('style');
      additionalStyles.textContent = `
        /* Ensure proper centering and layout */
        .container { max-width: 1200px; margin: 0 auto; }
        .worksheet-content { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #3d348b; font-size: 28px; margin-bottom: 16px; }
        h2 { color: #5e44a0; font-size: 22px; margin-bottom: 12px; }
        h3 { color: #3d348b; font-size: 18px; margin-bottom: 10px; }
        .exercise { margin-bottom: 2em; border: 1px solid #eee; padding: 1em; border-radius: 5px; }
        .exercise-header { display: flex; align-items: center; margin-bottom: 1em; font-weight: bold; }
        .exercise-icon { margin-right: 0.5em; }
        .instruction { background-color: #f9f9f9; padding: 0.8em; border-left: 3px solid #5e44a0; margin-bottom: 1em; }
        .teacher-tip { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 12px; border-radius: 6px; margin: 12px 0; }
        .bg-amber-50 { background-color: #fefbf3; }
        .border-amber-400 { border-color: #fbbf24; }
        .text-amber-800 { color: #92400e; }
        .border-l-4 { border-left-width: 4px; }
        .rounded-md { border-radius: 6px; }
        .p-4 { padding: 1rem; }
        .mb-4 { margin-bottom: 1rem; }
        .leading-snug { line-height: 1.375; }
      `;
      head.appendChild(additionalStyles);
    }
    
    // Serialize the document
    const htmlContent = '<!DOCTYPE html>\n' + documentClone.outerHTML;
    
    // Create and download the file
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('HTML exported successfully:', filename);
    return true;
  } catch (error) {
    console.error('Error exporting HTML:', error);
    return false;
  }
};

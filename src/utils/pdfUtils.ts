
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

const fetchExternalStyles = async (): Promise<string> => {
  let combinedStyles = '';
  
  try {
    // Get all link elements that reference stylesheets
    const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
    
    for (const link of linkElements) {
      const href = (link as HTMLLinkElement).href;
      
      try {
        // Skip if it's not a valid URL or is a data URL
        if (!href || href.startsWith('data:')) continue;
        
        const response = await fetch(href, { mode: 'cors' });
        if (response.ok) {
          const cssText = await response.text();
          combinedStyles += `\n/* Styles from ${href} */\n${cssText}\n`;
        }
      } catch (fetchError) {
        console.warn(`Failed to fetch styles from ${href}:`, fetchError);
        // Continue with other stylesheets
      }
    }
    
    // Also get inline styles from document.styleSheets
    try {
      for (const stylesheet of Array.from(document.styleSheets)) {
        try {
          if (stylesheet.cssRules) {
            const rules = Array.from(stylesheet.cssRules);
            const inlineCSS = rules.map(rule => rule.cssText).join('\n');
            combinedStyles += `\n/* Inline styles */\n${inlineCSS}\n`;
          }
        } catch (e) {
          // Skip stylesheets that can't be accessed due to CORS
          console.warn('Could not access stylesheet rules:', e);
        }
      }
    } catch (e) {
      console.warn('Could not access document stylesheets:', e);
    }
    
  } catch (error) {
    console.error('Error fetching external styles:', error);
  }
  
  return combinedStyles;
};

export const exportAsHTML = async (elementId: string, filename: string, isTeacherVersion: boolean, title: string) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) return false;
    
    // Create a clone of the element to modify it
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Remove elements with data-no-pdf attribute (they also shouldn't be in HTML export)
    const noPdfElements = clone.querySelectorAll('[data-no-pdf="true"]');
    noPdfElements.forEach(el => el.remove());
    
    // Remove all teacher tips sections when generating student version
    if (!isTeacherVersion) {
      const teacherTips = clone.querySelectorAll('.teacher-tip');
      teacherTips.forEach(el => el.remove());
    }
    
    // Remove all script tags from the clone
    const scriptElements = clone.querySelectorAll('script');
    scriptElements.forEach(script => script.remove());
    
    // Fetch all external styles
    const externalStyles = await fetchExternalStyles();
    
    // Create version header
    const versionHeader = `
      <div style="background-color: #f8f9fa; border: 2px solid #3d348b; padding: 15px; margin-bottom: 20px; text-align: center; border-radius: 8px;">
        <h2 style="color: #3d348b; margin: 0; font-size: 18px; font-weight: bold;">
          ${title} - ${isTeacherVersion ? 'Teacher' : 'Student'} Version
        </h2>
      </div>
    `;
    
    // Get the HTML content with version header
    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${filename}</title>
          <style>
            /* External CSS Styles */
            ${externalStyles}
            
            /* Custom Styles for HTML Export */
            body { 
              font-family: 'Inter', Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 1200px; 
              margin: 0 auto; 
              padding: 20px; 
              background-color: #f8f9fa;
            }
            
            .worksheet-content {
              background-color: white;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              margin: 20px auto;
              max-width: 800px;
            }
            
            h1 { 
              color: #3d348b; 
              font-size: 28px; 
              margin-bottom: 15px;
              text-align: center;
            }
            
            h2 { 
              color: #5e44a0; 
              font-size: 22px; 
              margin-bottom: 12px;
              text-align: center;
            }
            
            h3 {
              color: #3d348b;
              font-size: 18px;
              margin-bottom: 10px;
            }
            
            .exercise { 
              margin-bottom: 2em; 
              border: 1px solid #e0e0e0; 
              padding: 20px; 
              border-radius: 8px; 
              background-color: #fafafa;
            }
            
            .exercise-header { 
              display: flex; 
              align-items: center; 
              margin-bottom: 1em; 
              background-color: #3d348b;
              color: white;
              padding: 10px 15px;
              border-radius: 5px;
              margin: -20px -20px 15px -20px;
            }
            
            .exercise-icon { 
              margin-right: 10px; 
              font-size: 18px;
            }
            
            .instruction { 
              background-color: #f0f8ff; 
              padding: 15px; 
              border-left: 4px solid #3d348b; 
              margin-bottom: 1em; 
              border-radius: 0 5px 5px 0;
            }
            
            .bg-amber-50 {
              background-color: #fffbeb;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              border-radius: 0 5px 5px 0;
              margin-bottom: 15px;
            }
            
            .vocabulary-card {
              border: 1px solid #d1d5db;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 10px;
              background-color: white;
            }
            
            .teacher-tip {
              background-color: #fef3c7;
              border: 1px solid #f59e0b;
              padding: 12px;
              border-radius: 6px;
              margin-top: 10px;
              font-size: 14px;
            }
            
            /* Form elements styling */
            input[type="text"], input[type="radio"], select {
              margin: 5px;
              padding: 5px;
              border: 1px solid #ccc;
              border-radius: 3px;
            }
            
            /* Blanks styling */
            .fill-blank, .word-formation-blank {
              display: inline-block;
              min-width: 150px;
              height: 1.2em;
              border-bottom: 2px solid #333;
              margin: 0 5px;
              text-align: center;
            }
            
            /* Center everything */
            .container {
              max-width: 800px;
              margin: 0 auto;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="worksheet-content">
              ${versionHeader}
              ${clone.innerHTML}
            </div>
          </div>
        </body>
      </html>
    `;
    
    // Create a Blob from the HTML content
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    
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

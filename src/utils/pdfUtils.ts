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

export const exportAsHTML = async (
  elementId: string, 
  filename: string, 
  isTeacher: boolean = false,
  title: string = "Worksheet"
): Promise<boolean> => {
  try {
    // Get the element to export
    const element = document.getElementById(elementId);
    if (!element) {
      console.error("Element not found:", elementId);
      return false;
    }
    
    // Create a new document to build our HTML output
    const doc = document.implementation.createHTMLDocument(title);
    
    // Add meta tags
    const meta = doc.createElement('meta');
    meta.setAttribute('charset', 'utf-8');
    doc.head.appendChild(meta);
    
    const viewportMeta = doc.createElement('meta');
    viewportMeta.setAttribute('name', 'viewport');
    viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0');
    doc.head.appendChild(viewportMeta);
    
    // Add a title
    const titleElement = doc.createElement('title');
    titleElement.textContent = title;
    doc.head.appendChild(titleElement);
    
    // Version banner at the top
    const versionBanner = doc.createElement('div');
    versionBanner.style.backgroundColor = isTeacher ? '#f0f4ff' : '#f0fff4';
    versionBanner.style.color = isTeacher ? '#3b82f6' : '#10b981';
    versionBanner.style.padding = '8px 16px';
    versionBanner.style.marginBottom = '16px';
    versionBanner.style.textAlign = 'center';
    versionBanner.style.fontWeight = 'bold';
    versionBanner.style.borderRadius = '4px';
    versionBanner.textContent = isTeacher ? 'TEACHER VERSION' : 'STUDENT VERSION';
    
    // Initialize style string we'll populate with all external and internal styles
    let allStyles = '';
    
    // Capture all stylesheet rules from the page
    // First, get all external CSS stylesheets
    const stylesheetPromises = [];
    const styleLinks = document.querySelectorAll('link[rel="stylesheet"]');
    
    for (let i = 0; i < styleLinks.length; i++) {
      const href = styleLinks[i].getAttribute('href');
      if (href) {
        // Try to fetch the CSS content
        const promise = fetch(href)
          .then(response => {
            if (response.ok) return response.text();
            return '/* Failed to load external CSS */';
          })
          .catch(error => {
            console.error('Error fetching external CSS:', error);
            return '/* Failed to load external CSS */';
          });
        
        stylesheetPromises.push(promise);
      }
    }
    
    // Wait for all stylesheet fetches to complete
    const externalStyles = await Promise.all(stylesheetPromises);
    
    // Add external CSS
    externalStyles.forEach(cssText => {
      allStyles += cssText + '\n';
    });
    
    // Add internal CSS from style tags
    const internalStyles = document.querySelectorAll('style');
    for (let i = 0; i < internalStyles.length; i++) {
      allStyles += internalStyles[i].textContent + '\n';
    }
    
    // Add document.styleSheets rules that are accessible (non-CORS protected)
    for (let i = 0; i < document.styleSheets.length; i++) {
      try {
        const styleSheet = document.styleSheets[i];
        const rules = styleSheet.cssRules;
        if (rules) {
          for (let j = 0; j < rules.length; j++) {
            allStyles += rules[j].cssText + '\n';
          }
        }
      } catch (e) {
        // CORS policy might prevent accessing cssRules
        console.log('Could not access cssRules for stylesheet', i);
      }
    }
    
    // Create a style element and add all the CSS
    const style = doc.createElement('style');
    style.textContent = allStyles;
    doc.head.appendChild(style);
    
    // Additional styles for center alignment and margins
    const additionalStyles = doc.createElement('style');
    additionalStyles.textContent = `
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      h1, h2, h3, h4, h5, h6 {
        color: #333;
        margin-top: 1.2em;
        margin-bottom: 0.6em;
      }
      .worksheet-container {
        max-width: 800px;
        margin: 0 auto;
      }
    `;
    doc.head.appendChild(additionalStyles);
    
    // Clone the element and append to body
    const clonedElement = element.cloneNode(true) as HTMLElement;
    
    // Create worksheet container div for proper centering
    const worksheetContainer = doc.createElement('div');
    worksheetContainer.className = 'worksheet-container';
    
    // Add version banner first
    worksheetContainer.appendChild(versionBanner);
    
    // Then add the cloned worksheet content
    worksheetContainer.appendChild(clonedElement);
    
    // Clear the body and add the container
    doc.body.innerHTML = '';
    doc.body.appendChild(worksheetContainer);
    
    // Remove scripts from the cloned document
    const scripts = doc.getElementsByTagName('script');
    while (scripts[0]) {
      scripts[0].parentNode?.removeChild(scripts[0]);
    }
    
    // Serialize to HTML string
    const htmlContent = '<!DOCTYPE html>' + doc.documentElement.outerHTML;
    
    // Create a Blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
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

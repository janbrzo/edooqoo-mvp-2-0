
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

// Funkcja do pobierania zewnętrznych stylów CSS
async function fetchExternalStylesheets() {
  try {
    const stylesheetLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    const cssPromises = stylesheetLinks.map(async (link) => {
      try {
        const href = link.getAttribute('href');
        if (!href) return '';
        
        const response = await fetch(href);
        if (!response.ok) return '';
        
        return await response.text();
      } catch (e) {
        console.warn('Could not fetch external stylesheet:', e);
        return '';
      }
    });
    
    const results = await Promise.all(cssPromises);
    return results.filter(Boolean).join('\n');
  } catch (error) {
    console.warn('Error fetching external stylesheets:', error);
    return '';
  }
}

// Funkcja do pobierania wewnętrznych stylów
function getInternalStyles() {
  let internalStyles = '';
  try {
    Array.from(document.styleSheets).forEach(sheet => {
      try {
        const cssRules = Array.from(sheet.cssRules);
        cssRules.forEach(rule => {
          internalStyles += rule.cssText + '\n';
        });
      } catch (e) {
        // Ignoruj błędy CORS dla external stylesheets
        console.warn('Could not access cssRules (probably CORS issue):', e);
      }
    });
  } catch (error) {
    console.warn('Error extracting internal styles:', error);
  }
  return internalStyles;
}

export const exportAsHTML = async (elementId: string, filename: string) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) return false;
    
    // Create a clone of the element to modify it
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Remove elements with data-no-pdf attribute (they also shouldn't be in HTML export)
    const noPdfElements = clone.querySelectorAll('[data-no-pdf="true"]');
    noPdfElements.forEach(el => el.remove());
    
    // Pobierz zewnętrzne i wewnętrzne style
    const externalCss = await fetchExternalStylesheets();
    const internalCss = getInternalStyles();
    
    // Przygotuj JS do przełączania widoków
    const viewToggleJs = `
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          // Get view toggle buttons
          const studentViewBtn = document.getElementById('student-view-btn');
          const teacherViewBtn = document.getElementById('teacher-view-btn');
          
          // Get teacher tip elements
          const teacherTips = document.querySelectorAll('.teacher-tip');
          
          // Initialize with student view
          let currentView = 'student';
          
          // Function to toggle view
          const toggleView = (view) => {
            currentView = view;
            
            if (studentViewBtn) studentViewBtn.classList.toggle('active', view === 'student');
            if (teacherViewBtn) teacherViewBtn.classList.toggle('active', view === 'teacher');
            
            // Toggle teacher tips visibility
            teacherTips.forEach(tip => {
              tip.style.display = view === 'teacher' ? 'block' : 'none';
            });
          };
          
          // Set initial view
          toggleView('student');
          
          // Add event listeners
          if (studentViewBtn) {
            studentViewBtn.addEventListener('click', () => toggleView('student'));
          }
          
          if (teacherViewBtn) {
            teacherViewBtn.addEventListener('click', () => toggleView('teacher'));
          }
        });
      </script>
    `;
    
    // Podstawowe style potrzebne do poprawnego wyświetlania
    const essentialCss = `
      .lovable-root {
        max-width: 900px;
        margin: 0 auto;
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        padding: 20px;
        background-color: #f9f9f9;
      }
      h1 { color: #3d348b; font-size: 24px; margin-bottom: 16px; }
      h2 { color: #5e44a0; font-size: 20px; margin-bottom: 12px; }
      .exercise { margin-bottom: 2em; border: 1px solid #eee; padding: 1em; border-radius: 5px; background-color: white; }
      .exercise-header { display: flex; align-items: center; margin-bottom: 1em; }
      .exercise-icon { margin-right: 0.5em; }
      .instruction { background-color: #f9f9f9; padding: 0.8em; border-left: 3px solid #5e44a0; margin-bottom: 1em; }
      .teacher-tip { background-color: #e6f7ff; border-left: 3px solid #1890ff; padding: 8px 16px; margin: 16px 0; }
      .view-toggle { display: flex; gap: 8px; margin-bottom: 16px; }
      .view-toggle button { padding: 8px 16px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; background: white; }
      .view-toggle button.active { background: #3d348b; color: white; }
      .content-section { background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
      .bg-worksheet-purple { background-color: #3d348b; color: white; }
      .bg-worksheet-purpleDark { background-color: #2a2360; color: white; }
      .text-worksheet-purple { color: #3d348b; }
      .text-worksheet-purpleDark { color: #2a2360; }
    `;
    
    // Przygotuj viewToggle HTML
    const viewToggleHtml = `
      <div class="view-toggle content-section">
        <button id="student-view-btn" class="active">Student View</button>
        <button id="teacher-view-btn">Teacher View</button>
      </div>
    `;
    
    // Get the HTML content
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${filename}</title>
          <style>
            ${essentialCss}
            ${internalCss}
            ${externalCss}
            /* Domyślnie ukryj wskazówki nauczyciela w widoku ucznia */
            .teacher-tip { display: none; }
          </style>
        </head>
        <body>
          <div class="lovable-root">
            ${viewToggleHtml}
            ${clone.innerHTML}
          </div>
          ${viewToggleJs}
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

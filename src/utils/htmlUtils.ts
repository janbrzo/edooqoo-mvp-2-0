
/**
 * Exports the current view as a standalone HTML file with all styles inlined
 */
export async function exportAsHTML(elementId: string, filename: string, viewMode: 'student' | 'teacher' = 'student', title: string = 'English Worksheet'): Promise<boolean> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('Element not found:', elementId);
      return false;
    }

    // Clone the entire document
    const docClone = document.cloneNode(true) as Document;
    
    // Remove all script tags to prevent JavaScript execution
    const scripts = docClone.querySelectorAll('script');
    scripts.forEach(script => script.remove());
    
    // Remove any existing style elements to avoid duplication
    const existingStyles = docClone.querySelectorAll('style[data-inline="true"]');
    existingStyles.forEach(style => style.remove());

    // Get all external stylesheets and inline CSS
    const externalStylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
    const cssPromises = externalStylesheets.map(async (link) => {
      const href = link.href;
      console.log('Fetching CSS from:', href);
      
      try {
        const absoluteUrl = new URL(href, window.location.origin).href;
        const cssContent = await fetchCSSContent(absoluteUrl);
        
        if (cssContent) {
          return `/* CSS from ${href} */\n${cssContent}\n`;
        }
      } catch (error) {
        console.warn(`Failed to process CSS from ${href}:`, error);
      }
      return '';
    });

    const allCSS = await Promise.all(cssPromises);
    const combinedCSS = allCSS.filter(css => css.length > 0).join('\n');

    // Collect CSS from existing <style> elements and document.styleSheets
    let inlineCSS = '';
    
    const styleElements = document.querySelectorAll('style');
    styleElements.forEach(style => {
      if (style.textContent) {
        inlineCSS += `/* Inline styles */\n${style.textContent}\n`;
      }
    });

    try {
      Array.from(document.styleSheets).forEach((sheet) => {
        try {
          if (sheet.cssRules) {
            const rules = Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
            if (rules) {
              inlineCSS += `/* Document stylesheet rules */\n${rules}\n`;
            }
          }
        } catch (e) {
          console.warn('Could not access stylesheet rules (likely CORS):', e);
        }
      });
    } catch (error) {
      console.warn('Error accessing document.styleSheets:', error);
    }

    // Add styles with restored page counter but hidden file path
    const additionalCSS = `
      /* Additional styles for standalone HTML */
      body {
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 20px;
        background-color: #f8f9fa;
      }
      
      .container {
        max-width: 1200px;
        margin: 0 auto;
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      
      .worksheet-content {
        background: white;
        padding: 20px;
      }
      
      /* Print button styles */
      .print-button {
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #3d348b;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        z-index: 1000;
      }
      
      .print-button:hover {
        background-color: #2d1b7b;
      }
      
      /* Hide rating section in HTML export */
      [data-no-pdf="true"]:not(.teacher-tip):not(.bg-amber-50) {
        display: none !important;
      }
      
      /* Show teacher tips in teacher version */
      .teacher-tip, .bg-amber-50 {
        display: ${viewMode === 'teacher' ? 'block' : 'none'} !important;
        background: linear-gradient(90deg, #FEF7CD 85%, #FAF5E3 100%) !important;
        border: 1.5px solid #ffeab9 !important;
        padding: 12px !important;
        margin: 8px 0 !important;
        border-radius: 6px !important;
        visibility: visible !important;
      }
      
      /* Print styles - hide browser headers/footers but keep page numbers */
      @media print {
        @page {
          margin: 0.5cm 1.5cm 0.5cm 1.5cm !important;
          size: A4 !important;
        }
        
        /* Hide print button when printing */
        .print-button {
          display: none !important;
        }
        
        /* Browser header/footer hiding */
        html {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        /* Keep page numbers visible but hide file path - target specific elements */
        @page {
          @bottom-left { content: none !important; }
          @bottom-center { content: none !important; }
          @bottom-right { content: counter(page) "/" counter(pages) !important; }
          @top-left { content: none !important; }
          @top-center { content: none !important; }
          @top-right { content: none !important; }
        }
        
        /* Alternative approach - hide specific browser generated content */
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        /* Try to override browser default styles while preserving page counter */
        @media print {
          html, body {
            height: auto !important;
            overflow: visible !important;
            background: white !important;
          }
        }
      }
      
      /* Tailwind-like utility classes for fallback */
      .bg-white { background-color: #ffffff; }
      .p-6 { padding: 1.5rem; }
      .mb-6 { margin-bottom: 1.5rem; }
      .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
      .font-bold { font-weight: 700; }
      .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
      .border { border-width: 1px; border-color: #d1d5db; }
      .rounded-lg { border-radius: 0.5rem; }
      .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
    `;

    const finalCSS = [combinedCSS, inlineCSS, additionalCSS].filter(css => css.length > 0).join('\n');

    if (finalCSS) {
      const newStyleElement = docClone.createElement('style');
      newStyleElement.setAttribute('data-inline', 'true');
      newStyleElement.textContent = finalCSS;
      
      const head = docClone.querySelector('head');
      if (head) {
        head.insertBefore(newStyleElement, head.firstChild);
      }
    }

    const clonedLinks = docClone.querySelectorAll('link[rel="stylesheet"]');
    clonedLinks.forEach(link => link.remove());

    const clonedElement = docClone.getElementById(elementId);
    if (!clonedElement) {
      console.error('Cloned element not found:', elementId);
      return false;
    }

    // Handle teacher tips and data-no-pdf elements
    if (viewMode === 'teacher') {
      const nonTeacherTipElements = clonedElement.querySelectorAll('[data-no-pdf="true"]:not([class*="teacher-tip"]):not(.bg-amber-50)');
      nonTeacherTipElements.forEach(el => el.remove());
      
      const teacherTips = clonedElement.querySelectorAll('[class*="teacher-tip"], .bg-amber-50');
      teacherTips.forEach(tip => {
        (tip as HTMLElement).style.display = 'block';
        (tip as HTMLElement).style.visibility = 'visible';
      });
    } else {
      const allNoPublishElements = clonedElement.querySelectorAll('[data-no-pdf="true"]');
      allNoPublishElements.forEach(el => el.remove());
      
      const teacherTipElements = clonedElement.querySelectorAll('[class*="teacher-tip"], .bg-amber-50');
      teacherTipElements.forEach(el => el.remove());
    }

    const versionHeader = docClone.createElement('div');
    versionHeader.style.textAlign = 'center';
    versionHeader.style.padding = '20px 0';
    versionHeader.style.borderBottom = '2px solid #3d348b';
    versionHeader.style.marginBottom = '20px';
    versionHeader.style.color = '#3d348b';
    versionHeader.style.fontSize = '18px';
    versionHeader.style.fontWeight = 'bold';
    versionHeader.innerHTML = `${title} - ${viewMode === 'teacher' ? 'Teacher' : 'Student'} Version`;

    const printButton = docClone.createElement('button');
    printButton.className = 'print-button';
    printButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6,9 6,2 18,2 18,9"></polyline>
        <path d="M6,18 L4,18 C2.9,18 2,17.1 2,16 L2,10 C2,8.9 2.9,8 4,8 L20,8 C21.1,8 22,8.9 22,10 L22,16 C22,17.1 21.1,18 20,18 L18,18"></path>
        <rect x="6" y="14" width="12" height="8"></rect>
      </svg>
      PRINT
    `;
    printButton.setAttribute('onclick', 'window.print()');

    const minimalHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - ${viewMode === 'teacher' ? 'Teacher' : 'Student'} Version</title>
    <style>
${finalCSS}
    </style>
</head>
<body>
    ${printButton.outerHTML}
    <div class="container">
        ${versionHeader.outerHTML}
        ${clonedElement.outerHTML}
    </div>
</body>
</html>`;

    const blob = new Blob([minimalHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    console.log('HTML export completed successfully');
    return true;
  } catch (error) {
    console.error('Error exporting HTML:', error);
    return false;
  }
}

/**
 * Fetches CSS content from a URL
 */
async function fetchCSSContent(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (response.ok) {
      return await response.text();
    }
  } catch (error) {
    console.warn(`Failed to fetch CSS from ${url}:`, error);
  }
  return '';
}

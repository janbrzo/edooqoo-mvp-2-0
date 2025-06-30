
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

/**
 * Exports the current view as a standalone HTML file with all styles inlined
 */
export async function exportAsHTML(elementId: string, filename: string, exportViewMode: 'student' | 'teacher' = 'student', title: string = 'English Worksheet'): Promise<boolean> {
  try {
    console.log(`[HTML EXPORT] Starting HTML export of current view for "${filename}"`);
    
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('[HTML EXPORT] Element not found:', elementId);
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

    // Get all external stylesheets
    const externalStylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
    
    // Fetch and inline all external CSS
    const cssPromises = externalStylesheets.map(async (link) => {
      const href = link.href;
      console.log('[HTML EXPORT] Fetching CSS from:', href);
      
      try {
        const absoluteUrl = new URL(href, window.location.origin).href;
        const cssContent = await fetchCSSContent(absoluteUrl);
        
        if (cssContent) {
          return `/* CSS from ${href} */\n${cssContent}\n`;
        }
      } catch (error) {
        console.warn(`[HTML EXPORT] Failed to process CSS from ${href}:`, error);
      }
      return '';
    });

    // Wait for all CSS to be fetched
    const allCSS = await Promise.all(cssPromises);
    const combinedCSS = allCSS.filter(css => css.length > 0).join('\n');

    // Also collect CSS from existing <style> elements and document.styleSheets
    let inlineCSS = '';
    
    // Get CSS from existing <style> elements
    const styleElements = document.querySelectorAll('style');
    styleElements.forEach(style => {
      if (style.textContent) {
        inlineCSS += `/* Inline styles */\n${style.textContent}\n`;
      }
    });

    // Try to get CSS from document.styleSheets (for same-origin stylesheets)
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
          console.warn('[HTML EXPORT] Could not access stylesheet rules (likely CORS):', e);
        }
      });
    } catch (error) {
      console.warn('[HTML EXPORT] Error accessing document.styleSheets:', error);
    }

    // Add additional styles including scroll up button
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
      
      /* Scroll up button styles */
      .scroll-up-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #3d348b;
        color: white;
        border: none;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        z-index: 999;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .scroll-up-button:hover {
        background-color: #2d1b7b;
      }
      
      .scroll-up-button.visible {
        opacity: 1;
      }
      
      /* Hide elements not meant for export, like the rating section */
      [data-no-pdf="true"]:not([data-teacher-tip="true"]) {
        display: none !important;
      }
      
      /* Print styles */
      @media print {
        @page {
          margin: 0.5cm 1.5cm 0.5cm 1.5cm !important;
          size: A4 !important;
          
          @top-left { content: none !important; }
          @top-center { content: none !important; }
          @top-right { content: none !important; }
          @bottom-left { content: none !important; }
          @bottom-center { 
            content: counter(page) " / " counter(pages) !important;
            font-size: 10px !important;
            color: #666 !important;
          }
          @bottom-right { content: none !important; }
        }
        
        .print-button, .scroll-up-button {
          display: none !important;
        }
        
        html, body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
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

    // Create comprehensive CSS content
    const finalCSS = [
      combinedCSS,
      inlineCSS,
      additionalCSS
    ].filter(css => css.length > 0).join('\n');

    // Create a new style element with all CSS
    if (finalCSS) {
      const newStyleElement = docClone.createElement('style');
      newStyleElement.setAttribute('data-inline', 'true');
      newStyleElement.textContent = finalCSS;
      
      const head = docClone.querySelector('head');
      if (head) {
        head.insertBefore(newStyleElement, head.firstChild);
      }
    }

    // Remove external stylesheet links since we've inlined them
    const clonedLinks = docClone.querySelectorAll('link[rel="stylesheet"]');
    clonedLinks.forEach(link => link.remove());

    // Find the worksheet content in the cloned document
    const clonedElement = docClone.getElementById(elementId);
    if (!clonedElement) {
      console.error('[HTML EXPORT] Cloned element not found:', elementId);
      return false;
    }
    
    console.log(`[HTML EXPORT] Original DOM for #${elementId} has been cloned. Cleaning up for export.`);

    // Remove elements that should not be in the export, like feedback forms.
    // Teacher tips are handled correctly because the view is already set before calling this function.
    const elementsToRemove = clonedElement.querySelectorAll('[data-no-pdf="true"]:not([data-teacher-tip="true"])');
    console.log(`[HTML EXPORT] Removing ${elementsToRemove.length} non-exportable elements (e.g., rating section).`);
    elementsToRemove.forEach(el => el.remove());

    // Create header with actual worksheet title
    const versionHeader = docClone.createElement('div');
    versionHeader.style.textAlign = 'center';
    versionHeader.style.padding = '20px 0';
    versionHeader.style.borderBottom = '2px solid #3d348b';
    versionHeader.style.marginBottom = '20px';
    versionHeader.style.color = '#3d348b';
    versionHeader.style.fontSize = '18px';
    versionHeader.style.fontWeight = 'bold';
    versionHeader.innerHTML = `${title} - ${exportViewMode === 'teacher' ? 'Teacher' : 'Student'} Version`;

    // Create print button with new text
    const printButton = docClone.createElement('button');
    printButton.className = 'print-button';
    printButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6,9 6,2 18,2 18,9"></polyline>
        <path d="M6,18 L4,18 C2.9,18 2,17.1 2,16 L2,10 C2,8.9 2.9,8 4,8 L20,8 C21.1,8 22,8.9 22,10 L22,16 C22,17.1 21.1,18 20,18 L18,18"></path>
        <rect x="6" y="14" width="12" height="8"></rect>
      </svg>
      GET PDF
    `;
    printButton.setAttribute('onclick', 'window.print()');

    // Create scroll up button
    const scrollUpButton = docClone.createElement('button');
    scrollUpButton.className = 'scroll-up-button';
    scrollUpButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m18 15-6-6-6 6"/>
      </svg>
    `;
    scrollUpButton.setAttribute('onclick', 'window.scrollTo({top: 0, behavior: "smooth"})');

    // Add scroll event listener script
    const scrollScript = docClone.createElement('script');
    scrollScript.textContent = `
      window.addEventListener('scroll', function() {
        const scrollUpBtn = document.querySelector('.scroll-up-button');
        if (window.scrollY > 300) {
          scrollUpBtn.classList.add('visible');
        } else {
          scrollUpBtn.classList.remove('visible');
        }
      });
    `;

    // Create a minimal HTML structure with only the necessary content
    const minimalHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - ${exportViewMode === 'teacher' ? 'Teacher' : 'Student'} Version</title>
    <style>
${finalCSS}
    </style>
</head>
<body>
    ${printButton.outerHTML}
    ${scrollUpButton.outerHTML}
    <div class="container">
        ${versionHeader.outerHTML}
        ${clonedElement.outerHTML}
    </div>
    ${scrollScript.outerHTML}
</body>
</html>`;

    // Create and download the file
    const blob = new Blob([minimalHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
    
    console.log(`[HTML EXPORT] HTML export completed successfully.`);
    return true;
  } catch (error) {
    console.error('[HTML EXPORT] Error exporting HTML:', error);
    return false;
  }
}

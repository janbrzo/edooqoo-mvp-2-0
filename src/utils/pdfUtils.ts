
import html2pdf from 'html2pdf.js';

export const generatePDF = async (elementId: string, filename: string, isTeacherView: boolean = false, title: string = 'Worksheet'): Promise<boolean> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('Element not found for PDF generation');
      return false;
    }

    const options = {
      margin: [10, 10, 15, 10],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        putOnlyUsedFonts: true
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    await html2pdf().set(options).from(element).save();
    return true;
  } catch (error) {
    console.error('PDF generation failed:', error);
    return false;
  }
};

const fetchExternalCSS = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    if (response.ok) {
      return await response.text();
    }
  } catch (error) {
    console.warn(`Failed to fetch CSS from ${url}:`, error);
  }
  return '';
};

const inlineAllStyles = async (doc: Document): Promise<void> => {
  const head = doc.head;
  
  // Fetch external stylesheets
  const linkElements = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'));
  const externalCSSPromises = linkElements.map(async (link) => {
    const href = (link as HTMLLinkElement).href;
    if (href && !href.startsWith('blob:')) {
      const css = await fetchExternalCSS(href);
      if (css) {
        const style = doc.createElement('style');
        style.textContent = css;
        head.appendChild(style);
      }
    }
  });
  
  await Promise.all(externalCSSPromises);
  
  // Remove external link elements
  linkElements.forEach(link => link.remove());
  
  // Inline existing document styles
  try {
    for (let i = 0; i < document.styleSheets.length; i++) {
      const styleSheet = document.styleSheets[i];
      try {
        if (styleSheet.cssRules) {
          let css = '';
          for (let j = 0; j < styleSheet.cssRules.length; j++) {
            css += styleSheet.cssRules[j].cssText + '\n';
          }
          if (css) {
            const style = doc.createElement('style');
            style.textContent = css;
            head.appendChild(style);
          }
        }
      } catch (e) {
        console.warn('Could not access stylesheet rules:', e);
      }
    }
  } catch (error) {
    console.warn('Error inlining styles:', error);
  }
};

export const exportAsHTML = async (elementId: string, filename: string, viewMode?: "student" | "teacher"): Promise<boolean> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('Element not found for HTML export');
      return false;
    }

    // Clone the document
    const docClone = document.cloneNode(true) as Document;
    
    // Add version information at the top
    const worksheetContent = docClone.getElementById(elementId);
    if (worksheetContent && viewMode) {
      const versionInfo = docClone.createElement('div');
      versionInfo.className = 'text-center mb-4 p-2 bg-blue-50 border border-blue-200 rounded';
      versionInfo.innerHTML = `<strong>Version: ${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View</strong>`;
      worksheetContent.insertBefore(versionInfo, worksheetContent.firstChild);
    }
    
    // Remove all script tags
    const scripts = Array.from(docClone.querySelectorAll('script'));
    scripts.forEach(script => script.remove());
    
    // Inline all styles
    await inlineAllStyles(docClone);
    
    // Add centering styles
    const centeringStyle = docClone.createElement('style');
    centeringStyle.textContent = `
      body {
        margin: 0;
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background-color: #f5f5f5;
        display: flex;
        justify-content: center;
        min-height: 100vh;
      }
      .container {
        max-width: 1200px;
        width: 100%;
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      .worksheet-content {
        width: 100%;
      }
      @media print {
        body { background-color: white; }
        .container { box-shadow: none; padding: 0; }
      }
    `;
    docClone.head.appendChild(centeringStyle);
    
    // Wrap content in container for centering
    const bodyContent = docClone.body.innerHTML;
    docClone.body.innerHTML = `<div class="container">${bodyContent}</div>`;
    
    // Create the final HTML string
    const htmlString = '<!DOCTYPE html>\n' + docClone.documentElement.outerHTML;
    
    // Create and download the file
    const blob = new Blob([htmlString], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('HTML export failed:', error);
    return false;
  }
};

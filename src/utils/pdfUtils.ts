
export async function generatePDF(elementId: string, fileName: string, isTeacherVersion: boolean, documentTitle: string): Promise<boolean> {
  try {
    // Import dynamically
    const html2pdf = (await import('html2pdf.js')).default;
    
    const element = document.getElementById(elementId);
    if (!element) {
      console.error("Element not found:", elementId);
      return false;
    }
    
    // Clone the element to avoid modifying the original
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Add a header with version info
    const versionHeader = document.createElement('div');
    versionHeader.className = "text-lg font-semibold text-gray-700 text-center my-4 p-2 bg-gray-100 rounded";
    versionHeader.textContent = isTeacherVersion ? "TEACHER VERSION" : "STUDENT VERSION";
    
    // Insert the header as the first child
    clone.insertBefore(versionHeader, clone.firstChild);
    
    // Create invisible container
    const container = document.createElement('div');
    container.appendChild(clone);
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    document.body.appendChild(container);
    
    // Configure PDF options
    const options = {
      margin: [15, 15],
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        putOnlyUsedFonts: true,
        compress: true,
        precision: 16
      },
      pagebreak: { mode: 'avoid-all', before: '.page-break' }
    };

    // Generate PDF    
    await html2pdf().from(clone).set(options).save();
    
    // Clean up
    document.body.removeChild(container);
    
    return true;
  } catch (error) {
    console.error("PDF generation error:", error);
    return false;
  }
}

export async function exportAsHTML(elementId: string, fileName: string, viewMode: 'student' | 'teacher', documentTitle: string): Promise<boolean> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error("Element not found:", elementId);
      return false;
    }
    
    // Clone the element to avoid modifying the original
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Get all stylesheets
    const stylesheets = Array.from(document.styleSheets);
    
    // Create a new HTML document
    let html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n';
    html += `<meta charset="UTF-8">\n`;
    html += `<meta name="viewport" content="width=device-width, initial-scale=1.0">\n`;
    html += `<title>${documentTitle || 'Worksheet'} - ${viewMode === 'teacher' ? 'Teacher' : 'Student'} Version</title>\n`;
    
    // Add a style tag with all available styles
    html += '<style>\n';
    
    // Add version specific style
    html += `
    .version-header {
      font-size: 18px;
      font-weight: 600;
      color: #4B5563;
      text-align: center;
      margin: 16px 0;
      padding: 8px;
      background-color: #F3F4F6;
      border-radius: 4px;
    }
    
    body {
      font-family: Arial, sans-serif;
      line-height: 1.5;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .exercise {
      margin-bottom: 30px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .exercise-header {
      background-color: #f9fafb;
      padding: 12px 16px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .exercise-title {
      font-size: 18px;
      font-weight: 600;
      margin: 0;
    }
    
    .exercise-content {
      padding: 16px;
    }
    
    .exercise-instructions {
      font-style: italic;
      margin-bottom: 16px;
      color: #4b5563;
    }
    
    .reading-text {
      line-height: 1.6;
      margin-bottom: 20px;
    }
    
    .question {
      margin-bottom: 12px;
    }
    
    .answer {
      color: #1e40af;
      font-weight: 500;
    }
    
    .matching-items {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 16px;
    }
    
    .matching-item {
      padding: 8px;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
    }
    
    .vocabulary-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .vocabulary-table th,
    .vocabulary-table td {
      border: 1px solid #e5e7eb;
      padding: 8px 12px;
      text-align: left;
    }
    
    .vocabulary-table th {
      background-color: #f9fafb;
      font-weight: 600;
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      .exercise {
        page-break-inside: avoid;
      }
    }
    `;
    
    // Process and add all available stylesheets
    for (const stylesheet of stylesheets) {
      try {
        // Try to access the rules of the stylesheet
        const rules = stylesheet.cssRules || stylesheet.rules;
        if (rules) {
          for (let i = 0; i < rules.length; i++) {
            html += rules[i].cssText + '\n';
          }
        }
      } catch (e) {
        // For external stylesheets with CORS restrictions, we need to fetch them
        if (stylesheet.href) {
          try {
            const response = await fetch(stylesheet.href);
            const cssText = await response.text();
            html += cssText + '\n';
          } catch (fetchError) {
            console.warn(`Couldn't fetch external stylesheet: ${stylesheet.href}`, fetchError);
          }
        }
      }
    }
    
    // Add inline styles
    const inlineStyles = document.querySelectorAll('style');
    for (const style of inlineStyles) {
      html += style.textContent + '\n';
    }
    
    html += '</style>\n</head>\n<body>\n';
    
    // Add version header
    html += `<div class="version-header">${viewMode === 'teacher' ? 'TEACHER VERSION' : 'STUDENT VERSION'}</div>\n`;
    
    // Add the content
    html += clone.outerHTML;
    
    // Complete the HTML document
    html += '\n</body>\n</html>';
    
    // Create a blob and download it
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    return true;
  } catch (error) {
    console.error("HTML export error:", error);
    return false;
  }
}

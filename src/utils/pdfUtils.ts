
import html2pdf from 'html2pdf.js';

const getCurrentDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const extractKeywords = (title: string): string => {
  const words = title.split(' ')
    .filter(word => word.length > 3) // Filter out short words
    .slice(0, 3); // Take first 3 significant words
  
  return words.join('-').toLowerCase().replace(/[^a-z0-9-]/g, '');
};

export const generatePDF = async (elementId: string, filename: string = 'worksheet.pdf', isTeacherView: boolean = true, title: string = 'worksheet') => {
  const element = document.getElementById(elementId);
  
  if (!element) {
    throw new Error('Element not found');
  }
  
  const datePart = getCurrentDate();
  const viewPart = isTeacherView ? 'Teacher' : 'Student';
  const keywords = extractKeywords(title);
  
  const finalFilename = `${datePart}-${viewPart}-worksheet-${keywords}.pdf`;
  
  const clonedElement = element.cloneNode(true) as HTMLElement;

  // Remove elements with data-no-pdf attribute
  const noPdfElements = clonedElement.querySelectorAll('[data-no-pdf="true"]');
  noPdfElements.forEach(element => element.remove());

  // Usuwanie sekcji .rating-section (How would you rate...) z PDF
  const ratingSections = clonedElement.querySelectorAll('.rating-section');
  ratingSections.forEach(section => section.remove());

  // Usuwanie .teacher-notes jeśli potrzebne
  const elementsToRemove = clonedElement.querySelectorAll('.teacher-notes');
  elementsToRemove.forEach(section => section.remove());
  
  clonedElement.style.width = '100%';
  clonedElement.style.padding = '20px';
  clonedElement.style.boxSizing = 'border-box';
  
  // Fix exercise headers - problem #7
  const exerciseHeaders = clonedElement.querySelectorAll('.exercise-header');
  exerciseHeaders.forEach(header => {
    const headerEl = header as HTMLElement;
    headerEl.style.display = 'flex';
    headerEl.style.alignItems = 'center';
    headerEl.style.justifyContent = 'space-between';
    headerEl.style.height = '48px';
    headerEl.style.maxHeight = '48px';
    headerEl.style.minHeight = '48px';
    headerEl.style.overflow = 'visible';
    headerEl.style.padding = '10px 15px';
    headerEl.style.lineHeight = '1';
    // DODATKOWO resetujemy gapy, marginesy
    headerEl.style.gap = '12px';
  });
  
  // Fix vocabulary matching layout
  const vocabMatching = clonedElement.querySelectorAll('.vocabulary-matching-container');
  vocabMatching.forEach(container => {
    const containerEl = container as HTMLElement;
    containerEl.style.display = 'grid';
    containerEl.style.gridTemplateColumns = '1fr 1fr';
    containerEl.style.gap = '20px';
    containerEl.style.width = '100%';
  });
  
  // FIX: Word Bank - idealne centrowanie w boxie
  const wordBanks = clonedElement.querySelectorAll('.word-bank-container');
  wordBanks.forEach(bank => {
    const bankEl = bank as HTMLElement;
    bankEl.style.display = 'flex';
    bankEl.style.flexDirection = 'column';
    bankEl.style.justifyContent = 'center';
    bankEl.style.alignItems = 'center';
    bankEl.style.padding = '15px';
    bankEl.style.minHeight = '50px';
    bankEl.style.height = '100%';

    // Odpowiednie centrowanie tekstu
    const wordBank = bankEl.querySelector('.word-bank');
    if (wordBank) {
      (wordBank as HTMLElement).style.margin = '0';
      (wordBank as HTMLElement).style.padding = '0';
      (wordBank as HTMLElement).style.lineHeight = '1.5';
      (wordBank as HTMLElement).style.display = 'flex';
      (wordBank as HTMLElement).style.alignItems = 'center';
      (wordBank as HTMLElement).style.justifyContent = 'center';
      (wordBank as HTMLElement).style.width = '100%';
      (wordBank as HTMLElement).style.textAlign = 'center';
      (wordBank as HTMLElement).style.verticalAlign = 'middle';
      (wordBank as HTMLElement).style.height = '100%';
      (wordBank as HTMLElement).style.minHeight = '30px';
    }
  });
  
  // Fix fill-in-blanks
  const blanks = clonedElement.querySelectorAll('.fill-blank');
  blanks.forEach(blank => {
    const blankEl = blank as HTMLElement;
    blankEl.style.minWidth = '200px';
    blankEl.style.display = 'inline-block';
    blankEl.style.borderBottom = '1px solid #000';
  });
  
  // Fix word formation blanks
  const wordFormationBlanks = clonedElement.querySelectorAll('.word-formation-blank');
  wordFormationBlanks.forEach(blank => {
    const blankEl = blank as HTMLElement;
    blankEl.style.minWidth = '300px';
    blankEl.style.display = 'inline-block';
    blankEl.style.borderBottom = '1px solid #000';
  });
  
  // FIX: Multiple choice option icon alignment - stała pozycja i rozmiar
  const mcOptions = clonedElement.querySelectorAll('.multiple-choice-option');
  mcOptions.forEach(option => {
    const optionEl = option as HTMLElement;
    optionEl.style.display = 'flex';
    optionEl.style.alignItems = 'center';
    optionEl.style.gap = '10px';
    optionEl.style.marginBottom = '8px';
  });
  const checkmarks = clonedElement.querySelectorAll('.option-icon');
  checkmarks.forEach(icon => {
    const iconEl = icon as HTMLElement;
    iconEl.style.display = 'inline-flex';
    iconEl.style.alignItems = 'center';
    iconEl.style.justifyContent = 'center';
    iconEl.style.width = '24px';
    iconEl.style.height = '24px';
    iconEl.style.verticalAlign = 'middle';
    iconEl.style.position = 'static';
    iconEl.style.marginRight = '6px';
    // Stały padding dla idealnego wyrównania PDF
    iconEl.style.marginTop = '0';
    iconEl.style.marginBottom = '0';
  });
  
  // Make dialogue lines individual page-break-avoid elements
  const dialogueLines = clonedElement.querySelectorAll('.dialogue-line');
  dialogueLines.forEach(line => {
    (line as HTMLElement).style.pageBreakInside = 'avoid';
  });
  
  // Fix page breaks for other elements
  const avoidBreakElements = clonedElement.querySelectorAll('.exercise-item, .exercise-question, .sentence-item, .multiple-choice-question');
  avoidBreakElements.forEach(el => {
    (el as HTMLElement).style.pageBreakInside = 'avoid';
  });
  
  // Convert checkboxes to text characters for PDF
  const checkboxes = clonedElement.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    const span = document.createElement('span');
    span.textContent = (checkbox as HTMLInputElement).checked ? '✓' : '☐';
    checkbox.parentNode?.replaceChild(span, checkbox);
  });
  
  // Add Canva-like styling for PDF
  const style = document.createElement('style');
  style.textContent = `
    @media print {
      body {
        font-family: 'Arial', sans-serif;
        color: #333;
        line-height: 1.5;
      }
      
      h1, h2, h3, h4, h5, h6 {
        margin-top: 0;
        color: #333;
        page-break-after: avoid;
      }
      
      .exercise-header {
        display: flex !important;
        align-items: center !important;
        height: 48px !important;
        max-height: 48px !important;
        min-height: 48px !important;
        overflow: visible !important;
        padding: 10px 15px !important;
        line-height: 1 !important;
        page-break-after: avoid !important;
      }
      
      .fill-blank {
        min-width: 200px !important;
        display: inline-block !important;
        border-bottom: 1px solid #000 !important;
      }
      
      .word-formation-blank {
        min-width: 300px !important;
        display: inline-block !important;
        border-bottom: 1px solid #000 !important;
      }
      
      .word-bank-container {
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        align-items: center !important;
        padding: 15px !important;
        min-height: 50px !important;
        background-color: #f5f5f5 !important;
        border-radius: 4px !important;
        margin-bottom: 15px !important;
      }
      
      .word-bank {
        margin: 0 !important;
        padding: 0 !important;
        line-height: 1.5 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 100% !important;
        text-align: center !important;
        vertical-align: middle !important;
      }
      
      .multiple-choice-option {
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        margin-bottom: 8px !important;
        padding: 4px 0 !important;
      }
      
      .option-icon {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 24px !important;
        height: 24px !important;
        vertical-align: middle !important;
        position: static !important;
        margin-right: 6px !important;
      }
      
      [data-no-pdf="true"], .rating-section, .teacher-notes {
        display: none !important;
      }
      
      .dialogue-line {
        page-break-inside: avoid !important;
      }
      
      .exercise-item, .exercise-question, .sentence-item, .multiple-choice-question {
        page-break-inside: avoid !important;
      }
      
      /* Canva-like styling */
      .exercise-content {
        margin-bottom: 20px !important;
        page-break-inside: avoid !important;
      }
      
      img {
        max-width: 100% !important;
        height: auto !important;
      }
      
      table {
        width: 100% !important;
        border-collapse: collapse !important;
      }
      
      td, th {
        padding: 8px !important;
        border: 1px solid #ddd !important;
      }
      
      /* Add page numbers */
      @page {
        margin: 0.5in;
        @bottom-center {
          content: counter(page);
        }
      }
    }
  `;
  clonedElement.appendChild(style);
  
  // Set PDF options similar to Canva
  const options = {
    margin: [10, 10, 15, 10], // Top, right, bottom, left margins in mm
    filename: finalFilename,
    image: { type: 'jpeg', quality: 1.0 }, // Higher quality
    html2canvas: { 
      scale: 2, 
      useCORS: true,
      letterRendering: true,
      logging: false,
      dpi: 300, // Higher DPI for better quality
      imageTimeout: 0 // No timeout
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait',
      compress: true,
      precision: 16,
      hotfixes: ["px_scaling"] // Fix scaling issues
    }
  };
  
  try {
    // Show loading indicator (Canva-like behavior)
    const loadingIndicator = document.createElement('div');
    loadingIndicator.style.position = 'fixed';
    loadingIndicator.style.top = '0';
    loadingIndicator.style.left = '0';
    loadingIndicator.style.width = '100%';
    loadingIndicator.style.height = '100%';
    loadingIndicator.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    loadingIndicator.style.display = 'flex';
    loadingIndicator.style.alignItems = 'center';
    loadingIndicator.style.justifyContent = 'center';
    loadingIndicator.style.zIndex = '9999';
    loadingIndicator.innerHTML = `
      <div style="text-align: center; background: white; padding: 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <div style="margin-bottom: 16px; font-size: 18px; font-weight: bold; color: #3d348b;">Preparing your PDF...</div>
        <div style="width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #3d348b; border-radius: 50%; margin: 0 auto; animation: spin 1s linear infinite;"></div>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    document.body.appendChild(loadingIndicator);
    
    await html2pdf().from(clonedElement).set(options).save();
    
    // Remove loading indicator
    setTimeout(() => {
      document.body.removeChild(loadingIndicator);
    }, 500); // Give a slight delay to ensure PDF has started downloading
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Remove loading indicator if error
    const loadingIndicator = document.querySelector('[style*="position: fixed"]');
    if (loadingIndicator && loadingIndicator.parentNode) {
      loadingIndicator.parentNode.removeChild(loadingIndicator);
    }
    return false;
  }
};

export const exportAsHTML = (elementId: string, filename: string = 'worksheet.html', title: string = 'worksheet') => {
  const element = document.getElementById(elementId);
  
  if (!element) {
    throw new Error('Element not found');
  }
  
  const datePart = getCurrentDate();
  const keywords = extractKeywords(title);
  
  const clonedElement = element.cloneNode(true) as HTMLElement;
  
  // Don't remove buttons and interactive elements for HTML export - problem #10
  // This way the HTML will look identical to the web version, just without interactivity
  
  // We should still remove editable attributes
  const editableElements = clonedElement.querySelectorAll('[contenteditable="true"]');
  editableElements.forEach(el => {
    (el as HTMLElement).removeAttribute('contenteditable');
  });
  
  // Remove input parameters but keep the rest of the content
  const inputParams = clonedElement.querySelectorAll('.input-params');
  inputParams.forEach(param => param.remove());
  
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>English Worksheet - ${title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .exercise-header {
          background-color: #9b87f5;
          color: white;
          padding: 10px 15px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-radius: 5px;
          margin-bottom: 15px;
          height: 48px;
        }
        .exercise-content {
          margin-bottom: 30px;
        }
        .vocabulary-matching-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .matching-exercise .terms-column {
          width: 45%;
        }
        .matching-exercise .definitions-column {
          width: 55%;
        }
        .word-bank-container {
          background-color: #f5f5f5;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
        }
        .word-bank {
          margin: auto 0;
          line-height: 1.5;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          text-align: center;
        }
        .fill-blank {
          display: inline-block;
          min-width: 200px;
          border-bottom: 1px solid #000;
          text-align: center;
        }
        .word-formation-blank {
          display: inline-block;
          min-width: 300px;
          border-bottom: 1px solid #000;
          text-align: center;
        }
        .multiple-choice-option {
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .option-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
        }
        .student-answer-blank {
          display: inline-block;
          width: 30px;
          border-bottom: 1px solid #333;
          text-align: center;
          margin: 0 5px;
        }
        .teacher-answer {
          display: inline-block;
          font-weight: bold;
          margin: 0 5px;
        }
        .vocabulary-definition-label {
          font-weight: normal;
          font-size: 0.9rem;
          display: block;
          margin-top: 8px;
          color: #666;
        }
        .exercise-item, .exercise-question, .sentence-item, .multiple-choice-question, .dialogue-line {
          page-break-inside: avoid;
        }
        .teacher-notes {
          background-color: #FEF7CD;
          border: 1px solid #f7e3a1;
          border-radius: 5px;
          padding: 10px;
          margin: 10px 0;
        }
        .worksheet-title {
          color: white;
        }
        .rating-section {
          background-color: #f0f5ff;
          border-radius: 8px;
          padding: 20px;
          margin: 20px auto;
          text-align: center;
          max-width: 800px;
        }
        .rating-section h3 {
          color: #4338ca;
          margin-bottom: 10px;
        }
        .rating-section p {
          color: #6366f1;
          margin-bottom: 15px;
        }
      </style>
    </head>
    <body>
      ${clonedElement.outerHTML}
    </body>
    </html>
  `;
  
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${datePart}-worksheet-${keywords}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  return true;
};


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
  
  // Remove buttons, rating section, and other non-printable elements
  const buttons = clonedElement.querySelectorAll('button');
  buttons.forEach(button => button.remove());
  
  const editableElements = clonedElement.querySelectorAll('[contenteditable="true"]');
  editableElements.forEach(el => {
    (el as HTMLElement).removeAttribute('contenteditable');
  });
  
  const elementsToRemove = clonedElement.querySelectorAll('.rating-section, .teacher-notes, .input-parameters');
  elementsToRemove.forEach(section => section.remove());
  
  // Fix layout and styling for PDF
  clonedElement.style.width = '100%';
  clonedElement.style.padding = '20px';
  clonedElement.style.boxSizing = 'border-box';
  
  // Fix exercise headers
  const exerciseHeaders = clonedElement.querySelectorAll('.exercise-header');
  exerciseHeaders.forEach(header => {
    const headerEl = header as HTMLElement;
    headerEl.style.display = 'flex';
    headerEl.style.alignItems = 'center';
    headerEl.style.height = '60px';
    headerEl.style.maxHeight = '60px';
    headerEl.style.minHeight = '60px';
    headerEl.style.overflow = 'visible';
  });
  
  // Fix vocabulary matching
  const vocabMatching = clonedElement.querySelectorAll('.vocabulary-matching-container');
  vocabMatching.forEach(container => {
    const containerEl = container as HTMLElement;
    containerEl.style.display = 'grid';
    containerEl.style.gridTemplateColumns = '1fr 1fr';
    containerEl.style.gap = '20px';
    containerEl.style.width = '100%';
  });
  
  // Fix word banks
  const wordBanks = clonedElement.querySelectorAll('.word-bank-container');
  wordBanks.forEach(bank => {
    const bankEl = bank as HTMLElement;
    bankEl.style.display = 'flex';
    bankEl.style.alignItems = 'center';
    bankEl.style.justifyContent = 'center';
    bankEl.style.padding = '15px';
    
    // Fix vertical alignment of text
    const textNodes = bankEl.querySelectorAll('span');
    textNodes.forEach(node => {
      (node as HTMLElement).style.lineHeight = '1.6';
      (node as HTMLElement).style.display = 'inline-block';
      (node as HTMLElement).style.verticalAlign = 'middle';
    });
  });
  
  // Fix fill-in blanks
  const blanks = clonedElement.querySelectorAll('.fill-blank');
  blanks.forEach(blank => {
    const blankEl = blank as HTMLElement;
    blankEl.style.minWidth = '200px';
    blankEl.style.display = 'inline-block';
    blankEl.style.borderBottom = '1px solid #000';
  });
  
  // Fix multiple choice options alignment
  const mcOptions = clonedElement.querySelectorAll('.multiple-choice-option');
  mcOptions.forEach(option => {
    const optionEl = option as HTMLElement;
    optionEl.style.display = 'flex';
    optionEl.style.alignItems = 'center';
    optionEl.style.gap = '10px';
  });
  
  // Fix checkmark icons alignment
  const checkmarks = clonedElement.querySelectorAll('.option-icon');
  checkmarks.forEach(icon => {
    const iconEl = icon as HTMLElement;
    iconEl.style.display = 'inline-flex';
    iconEl.style.alignItems = 'center';
    iconEl.style.justifyContent = 'center';
    iconEl.style.width = '24px';
    iconEl.style.height = '24px';
    iconEl.style.verticalAlign = 'middle';
    iconEl.style.marginTop = '-2px';
  });
  
  // Fix error correction layout
  const errorCorrections = clonedElement.querySelectorAll('.error-correction-container');
  errorCorrections.forEach(container => {
    (container as HTMLElement).style.display = 'flex';
    (container as HTMLElement).style.flexDirection = 'row';
    (container as HTMLElement).style.gap = '10px';
    (container as HTMLElement).style.alignItems = 'flex-start';
    (container as HTMLElement).style.marginBottom = '10px';
  });
  
  // Fix dialogue spacing and page breaks
  const dialogueSections = clonedElement.querySelectorAll('.dialogue-section');
  dialogueSections.forEach(section => {
    (section as HTMLElement).style.pageBreakInside = 'avoid';
    (section as HTMLElement).style.marginTop = '10px';
  });
  
  // Prevent bad page breaks for exercise components
  const avoidBreakElements = clonedElement.querySelectorAll('.exercise-item, .exercise-question, .sentence-item, .multiple-choice-question, .dialogue-section');
  avoidBreakElements.forEach(el => {
    (el as HTMLElement).style.pageBreakInside = 'avoid';
  });
  
  // Fix exercise layout for better page usage
  const exercises = clonedElement.querySelectorAll('.exercise-container');
  exercises.forEach(exercise => {
    // Ensure exercise doesn't start at the very bottom of page
    (exercise as HTMLElement).style.pageBreakBefore = 'auto';
    (exercise as HTMLElement).style.margin = '15px 0';
  });
  
  // Fix checkboxes for PDF
  const checkboxes = clonedElement.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    const span = document.createElement('span');
    span.textContent = (checkbox as HTMLInputElement).checked ? '✓' : '☐';
    checkbox.parentNode?.replaceChild(span, checkbox);
  });
  
  // Add print styles
  const style = document.createElement('style');
  style.textContent = `
    @media print {
      .exercise-header {
        display: flex !important;
        align-items: center !important;
        height: 60px !important;
        max-height: 60px !important;
        min-height: 60px !important;
        overflow: visible !important;
      }
      
      .fill-blank {
        min-width: 200px !important;
        display: inline-block !important;
        border-bottom: 1px solid #000 !important;
      }
      
      .word-bank-container {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 15px !important;
      }
      
      .multiple-choice-option {
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
      }
      
      .option-icon {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 24px !important;
        height: 24px !important;
        vertical-align: middle !important;
        margin-top: -2px !important;
      }
      
      .rating-section, .teacher-notes, .input-parameters {
        display: none !important;
      }
      
      .exercise-item, .exercise-question, .sentence-item, .multiple-choice-question, .dialogue-section {
        page-break-inside: avoid !important;
      }
      
      .error-correction-container {
        display: flex !important;
        flex-direction: row !important;
        gap: 10px !important;
        align-items: flex-start !important;
        margin-bottom: 10px !important;
      }
      
      body {
        font-size: 12pt !important;
      }
      
      .vocabulary-definition-label {
        font-weight: normal !important;
        font-size: 0.9rem !important;
      }
      
      .matching-answer-space {
        display: inline-block !important;
        width: 25px !important;
        border-bottom: 1px solid #000 !important;
        margin-right: 5px !important;
        text-align: center !important;
      }
    }
  `;
  clonedElement.appendChild(style);
  
  const options = {
    margin: [15, 15, 15, 15],
    filename: finalFilename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2, 
      useCORS: true,
      letterRendering: true,
      // Fix exercise header height issues
      onclone: (clonedDoc) => {
        const headers = clonedDoc.querySelectorAll('.exercise-header');
        headers.forEach(header => {
          (header as HTMLElement).style.height = '60px';
          (header as HTMLElement).style.minHeight = '60px';
          (header as HTMLElement).style.maxHeight = '60px';
        });
      }
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  
  try {
    await html2pdf().from(clonedElement).set(options).save();
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
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
  
  // Remove buttons, rating section, and other elements not needed for HTML export
  const buttons = clonedElement.querySelectorAll('button');
  buttons.forEach(button => button.remove());
  
  const editableElements = clonedElement.querySelectorAll('[contenteditable="true"]');
  editableElements.forEach(el => {
    (el as HTMLElement).removeAttribute('contenteditable');
  });
  
  // Remove input parameters, top header, and action buttons
  const elementsToRemove = clonedElement.querySelectorAll('.rating-section, .input-parameters, .action-buttons, h1.rainbow-text, .worksheet-header');
  elementsToRemove.forEach(section => section.remove());
  
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
        .word-bank-container {
          background-color: #f5f5f5;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
        }
        .fill-blank {
          display: inline-block;
          min-width: 200px;
          border-bottom: 1px solid #000;
          text-align: center;
        }
        .multiple-choice-option {
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .exercise-item, .exercise-question, .sentence-item, .multiple-choice-question, .dialogue-section {
          page-break-inside: avoid;
        }
        .error-correction-container {
          display: flex;
          flex-direction: row;
          gap: 10px;
          align-items: flex-start;
          margin-bottom: 10px;
        }
        .matching-answer-space {
          display: inline-block;
          width: 25px;
          border-bottom: 1px solid #000;
          margin-right: 5px;
          text-align: center;
        }
        .vocabulary-definition-label {
          font-weight: normal;
          font-size: 0.9rem;
          display: block;
          margin-top: 8px;
          color: #666;
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

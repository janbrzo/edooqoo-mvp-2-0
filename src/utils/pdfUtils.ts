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
  
  // Remove buttons and unnecessary elements
  const buttons = clonedElement.querySelectorAll('button');
  buttons.forEach(button => button.remove());
  
  const editableElements = clonedElement.querySelectorAll('[contenteditable="true"]');
  editableElements.forEach(el => {
    (el as HTMLElement).removeAttribute('contenteditable');
  });
  
  // Remove rating section and teacher notes
  const elementsToRemove = clonedElement.querySelectorAll('.rating-section, .teacher-notes');
  elementsToRemove.forEach(section => section.remove());
  
  clonedElement.style.width = '100%';
  clonedElement.style.padding = '20px';
  clonedElement.style.boxSizing = 'border-box';
  
  // Fix exercise headers
  const exerciseHeaders = clonedElement.querySelectorAll('.exercise-header');
  exerciseHeaders.forEach(header => {
    const headerEl = header as HTMLElement;
    headerEl.style.display = 'flex';
    headerEl.style.alignItems = 'center';
    headerEl.style.height = '48px';
    headerEl.style.maxHeight = '48px';
    headerEl.style.minHeight = '48px';
    headerEl.style.overflow = 'visible';
    headerEl.style.padding = '10px 15px';
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
  
  // Fix word bank alignment
  const wordBanks = clonedElement.querySelectorAll('.word-bank-container');
  wordBanks.forEach(bank => {
    const bankEl = bank as HTMLElement;
    bankEl.style.display = 'flex';
    bankEl.style.alignItems = 'center';
    bankEl.style.justifyContent = 'center';
    bankEl.style.padding = '15px';
    
    // Center the text vertically
    const wordBank = bankEl.querySelector('.word-bank');
    if (wordBank) {
      (wordBank as HTMLElement).style.margin = 'auto 0';
      (wordBank as HTMLElement).style.lineHeight = '1.5';
      (wordBank as HTMLElement).style.display = 'flex';
      (wordBank as HTMLElement).style.alignItems = 'center';
      (wordBank as HTMLElement).style.justifyContent = 'center';
      (wordBank as HTMLElement).style.width = '100%';
      (wordBank as HTMLElement).style.textAlign = 'center';
      (wordBank as HTMLElement).style.verticalAlign = 'middle';
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
  
  // Fix multiple choice options alignment
  const mcOptions = clonedElement.querySelectorAll('.multiple-choice-option');
  mcOptions.forEach(option => {
    const optionEl = option as HTMLElement;
    optionEl.style.display = 'flex';
    optionEl.style.alignItems = 'center';
    optionEl.style.gap = '10px';
    optionEl.style.marginBottom = '8px';
  });
  
  // Fix checkmark alignment
  const checkmarks = clonedElement.querySelectorAll('.option-icon');
  checkmarks.forEach(icon => {
    const iconEl = icon as HTMLElement;
    iconEl.style.display = 'inline-flex';
    iconEl.style.alignItems = 'center';
    iconEl.style.justifyContent = 'center';
    iconEl.style.width = '24px';
    iconEl.style.height = '24px';
    iconEl.style.verticalAlign = 'middle';
    iconEl.style.position = 'relative';
    iconEl.style.top = '0';
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
  
  const style = document.createElement('style');
  style.textContent = `
    @media print {
      .exercise-header {
        display: flex !important;
        align-items: center !important;
        height: 48px !important;
        max-height: 48px !important;
        min-height: 48px !important;
        overflow: visible !important;
        padding: 10px 15px !important;
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
        align-items: center !important;
        justify-content: center !important;
        padding: 15px !important;
      }
      
      .word-bank {
        margin: auto 0 !important;
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
      }
      
      .option-icon {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 24px !important;
        height: 24px !important;
        vertical-align: middle !important;
        position: relative !important;
        top: 0 !important;
      }
      
      .rating-section, .teacher-notes {
        display: none !important;
      }
      
      .dialogue-line {
        page-break-inside: avoid !important;
      }
      
      .exercise-item, .exercise-question, .sentence-item, .multiple-choice-question {
        page-break-inside: avoid !important;
      }
    }
  `;
  clonedElement.appendChild(style);
  
  const options = {
    margin: [15, 15, 15, 15],
    filename: finalFilename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
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
  
  // Don't remove buttons and interactive elements for HTML export
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

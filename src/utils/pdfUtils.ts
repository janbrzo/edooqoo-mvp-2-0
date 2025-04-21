
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
  
  // Remove buttons and UI elements not needed in PDF
  const buttons = clonedElement.querySelectorAll('button');
  buttons.forEach(button => button.remove());
  
  const editableElements = clonedElement.querySelectorAll('[contenteditable="true"]');
  editableElements.forEach(el => {
    (el as HTMLElement).removeAttribute('contenteditable');
  });
  
  // Remove UI elements that shouldn't appear in PDF
  const elementsToRemove = clonedElement.querySelectorAll('.rating-section, .teacher-notes, .worksheet-actions, .input-params');
  elementsToRemove.forEach(section => section.remove());
  
  // Basic styling for PDF output
  clonedElement.style.width = '100%';
  clonedElement.style.padding = '20px';
  clonedElement.style.boxSizing = 'border-box';
  
  // Fix exercise headers in PDFs
  const exerciseHeaders = clonedElement.querySelectorAll('.exercise-header');
  exerciseHeaders.forEach(header => {
    const headerEl = header as HTMLElement;
    headerEl.style.display = 'flex';
    headerEl.style.alignItems = 'center';
    headerEl.style.height = '48px';
    headerEl.style.maxHeight = '48px';
    headerEl.style.minHeight = '48px';
    headerEl.style.overflow = 'visible';
  });
  
  // Fix vocabulary matching in PDFs
  const vocabMatching = clonedElement.querySelectorAll('.vocabulary-matching-container');
  vocabMatching.forEach(container => {
    const containerEl = container as HTMLElement;
    containerEl.style.display = 'grid';
    containerEl.style.gridTemplateColumns = '1fr 1fr';
    containerEl.style.gap = '20px';
    containerEl.style.width = '100%';
    
    // Remove answer columns that we don't want in the PDF
    const answerColumns = containerEl.querySelectorAll('.answer-column');
    answerColumns.forEach(col => col.remove());
  });
  
  // Fix word bank styling in PDFs
  const wordBanks = clonedElement.querySelectorAll('.word-bank-container');
  wordBanks.forEach(bank => {
    const bankEl = bank as HTMLElement;
    bankEl.style.display = 'flex';
    bankEl.style.alignItems = 'center';
    bankEl.style.justifyContent = 'center';
    bankEl.style.padding = '15px';
    
    // Center the text inside the word bank vertically
    const wordBank = bankEl.querySelector('.word-bank');
    if (wordBank) {
      (wordBank as HTMLElement).style.display = 'flex';
      (wordBank as HTMLElement).style.alignItems = 'center';
      (wordBank as HTMLElement).style.height = '100%';
    }
  });
  
  // Fix fill-in-the-blank styling in PDFs
  const blanks = clonedElement.querySelectorAll('.fill-blank');
  blanks.forEach(blank => {
    const blankEl = blank as HTMLElement;
    blankEl.style.minWidth = '150px';
    blankEl.style.display = 'inline-block';
    blankEl.style.borderBottom = '1px solid #000';
  });
  
  // Fix multiple choice option styling in PDFs
  const mcOptions = clonedElement.querySelectorAll('.multiple-choice-option');
  mcOptions.forEach(option => {
    const optionEl = option as HTMLElement;
    optionEl.style.display = 'flex';
    optionEl.style.alignItems = 'center';
    optionEl.style.gap = '10px';
  });
  
  // Fix checkmark icons in PDFs
  const checkmarks = clonedElement.querySelectorAll('.option-icon');
  checkmarks.forEach(icon => {
    const iconEl = icon as HTMLElement;
    iconEl.style.display = 'inline-flex';
    iconEl.style.alignItems = 'center';
    iconEl.style.justifyContent = 'center';
    iconEl.style.width = '24px';
    iconEl.style.height = '24px';
    iconEl.style.margin = '0';
    iconEl.style.marginTop = '0';
  });
  
  // Allow dialogue lines to break across pages but avoid breaking other elements
  const dialogueLines = clonedElement.querySelectorAll('.dialogue-line');
  dialogueLines.forEach(line => {
    (line as HTMLElement).style.pageBreakInside = 'auto';
  });
  
  // Avoid breaking these elements across pages
  const avoidBreakElements = clonedElement.querySelectorAll('.exercise-item, .exercise-question, .sentence-item, .multiple-choice-question');
  avoidBreakElements.forEach(el => {
    (el as HTMLElement).style.pageBreakInside = 'avoid';
  });
  
  // Replace checkboxes with symbols for PDF
  const checkboxes = clonedElement.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    const span = document.createElement('span');
    span.textContent = (checkbox as HTMLInputElement).checked ? '✓' : '☐';
    checkbox.parentNode?.replaceChild(span, checkbox);
  });
  
  // Add print-specific styles
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
      }
      
      .fill-blank {
        min-width: 150px !important;
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
        display: flex !important;
        align-items: center !important;
        height: 100% !important;
      }
      
      .multiple-choice-option {
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        margin-bottom: 5px !important;
      }
      
      .option-icon {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 24px !important;
        height: 24px !important;
        margin: 0 !important;
      }
      
      .dialogue-line {
        page-break-inside: auto !important;
      }
      
      .exercise-item, .exercise-question, .sentence-item, .multiple-choice-question {
        page-break-inside: avoid !important;
      }
      
      .rating-section, .teacher-notes, .worksheet-actions, .input-params {
        display: none !important;
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
  
  // Remove UI elements not needed in HTML export
  const elementsToRemove = clonedElement.querySelectorAll('.rating-section, .teacher-notes, .worksheet-actions, .input-params, button');
  elementsToRemove.forEach(element => element.remove());
  
  const editableElements = clonedElement.querySelectorAll('[contenteditable="true"]');
  editableElements.forEach(el => {
    (el as HTMLElement).removeAttribute('contenteditable');
  });
  
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
          min-width: 150px;
          border-bottom: 1px solid #000;
          text-align: center;
        }
        .multiple-choice-option {
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .exercise-item, .exercise-question, .sentence-item, .multiple-choice-question {
          page-break-inside: avoid;
        }
        .exercise-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 8px;
        }
        .exercise-item-question {
          flex: 1;
          text-align: left;
        }
        .exercise-item-answer {
          text-align: left;
          min-width: fit-content;
        }
        .matching-term-answer {
          display: inline-block;
          min-width: 30px;
          border-bottom: 1px solid #ccc;
          margin-right: 10px;
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

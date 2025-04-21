
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
  
  const buttons = clonedElement.querySelectorAll('button');
  buttons.forEach(button => button.remove());
  
  const editableElements = clonedElement.querySelectorAll('[contenteditable="true"]');
  editableElements.forEach(el => {
    (el as HTMLElement).removeAttribute('contenteditable');
  });
  
  const elementsToRemove = clonedElement.querySelectorAll('.rating-section, .teacher-notes');
  elementsToRemove.forEach(section => section.remove());
  
  clonedElement.style.width = '100%';
  clonedElement.style.padding = '20px';
  clonedElement.style.boxSizing = 'border-box';
  
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
  
  const vocabMatching = clonedElement.querySelectorAll('.vocabulary-matching-container');
  vocabMatching.forEach(container => {
    const containerEl = container as HTMLElement;
    containerEl.style.display = 'grid';
    containerEl.style.gridTemplateColumns = '1fr 1fr';
    containerEl.style.gap = '20px';
    containerEl.style.width = '100%';
    
    const answerColumns = containerEl.querySelectorAll('.answer-column');
    answerColumns.forEach(col => col.remove());
  });
  
  const wordBanks = clonedElement.querySelectorAll('.word-bank-container');
  wordBanks.forEach(bank => {
    const bankEl = bank as HTMLElement;
    bankEl.style.display = 'flex';
    bankEl.style.alignItems = 'center';
    bankEl.style.justifyContent = 'center';
    bankEl.style.padding = '15px';
  });
  
  const blanks = clonedElement.querySelectorAll('.fill-blank');
  blanks.forEach(blank => {
    const blankEl = blank as HTMLElement;
    blankEl.style.minWidth = '200px';
    blankEl.style.display = 'inline-block';
    blankEl.style.borderBottom = '1px solid #000';
  });
  
  const mcOptions = clonedElement.querySelectorAll('.multiple-choice-option');
  mcOptions.forEach(option => {
    const optionEl = option as HTMLElement;
    optionEl.style.display = 'flex';
    optionEl.style.alignItems = 'center';
    optionEl.style.gap = '10px';
  });
  
  const checkmarks = clonedElement.querySelectorAll('.option-icon');
  checkmarks.forEach(icon => {
    const iconEl = icon as HTMLElement;
    iconEl.style.display = 'inline-flex';
    iconEl.style.alignItems = 'center';
    iconEl.style.justifyContent = 'center';
    iconEl.style.width = '24px';
    iconEl.style.height = '24px';
  });
  
  const avoidBreakElements = clonedElement.querySelectorAll('.exercise-item, .exercise-question, .sentence-item, .multiple-choice-question, .dialogue-section');
  avoidBreakElements.forEach(el => {
    (el as HTMLElement).style.pageBreakInside = 'avoid';
  });
  
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
      }
      
      .rating-section, .teacher-notes {
        display: none !important;
      }
      
      .exercise-item, .exercise-question, .sentence-item, .multiple-choice-question, .dialogue-section {
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
  
  const buttons = clonedElement.querySelectorAll('button');
  buttons.forEach(button => button.remove());
  
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

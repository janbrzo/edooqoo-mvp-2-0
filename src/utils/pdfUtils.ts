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
  
  // REMOVE RATING SECTION AND TIPS BOXES FROM PDF:
  const ratingSection = clonedElement.querySelector('.rating-section');
  if (ratingSection) ratingSection.remove();

  const teacherTipBoxes = clonedElement.querySelectorAll('.teacher-tip-box');
  teacherTipBoxes.forEach(el => el.remove());

  // TIPS (li) dots: already none due to class, ensure no left dots
  const teacherTipLists = clonedElement.querySelectorAll(".teacher-tips-list");
  teacherTipLists.forEach(list => {
    (list as HTMLElement).style.listStyleType = "none";
    (list as HTMLElement).style.paddingLeft = "0";
    (list as HTMLElement).style.marginLeft = "0";
  });

  // Fix exercise headers height for PDF
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

  // Fix word bank vertical alignment for PDF
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
      (wordBank as HTMLElement).style.display = "flex";
      (wordBank as HTMLElement).style.alignItems = "center";
      (wordBank as HTMLElement).style.justifyContent = "center";
      (wordBank as HTMLElement).style.height = "calc(100% - 24px)";
    }
  });

  // Fix multiple choice option icon alignment for PDF
  const mcOptions = clonedElement.querySelectorAll('.multiple-choice-option');
  mcOptions.forEach(option => {
    const optionEl = option as HTMLElement;
    optionEl.style.display = 'flex';
    optionEl.style.alignItems = 'center';
    optionEl.style.gap = '10px';
    const icon = optionEl.querySelector('.option-icon');
    if (icon) {
      (icon as HTMLElement).style.display = 'inline-flex';
      (icon as HTMLElement).style.alignItems = 'center';
      (icon as HTMLElement).style.justifyContent = 'center';
      (icon as HTMLElement).style.width = '24px';
      (icon as HTMLElement).style.height = '24px';
      (icon as HTMLElement).style.verticalAlign = 'middle';
      (icon as HTMLElement).style.flexShrink = "0";
    }
  });
  
  // Fix exercise headers
  const exerciseHeadersOld = clonedElement.querySelectorAll('.exercise-header');
  exerciseHeadersOld.forEach(header => {
    const headerEl = header as HTMLElement;
    headerEl.style.display = 'flex';
    headerEl.style.alignItems = 'center';
    headerEl.style.height = '50px';
    headerEl.style.maxHeight = '50px';
    headerEl.style.minHeight = '50px';
    headerEl.style.overflow = 'visible';
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
  const wordBanksOld = clonedElement.querySelectorAll('.word-bank-container');
  wordBanksOld.forEach(bank => {
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
  const mcOptionsOld = clonedElement.querySelectorAll('.multiple-choice-option');
  mcOptionsOld.forEach(option => {
    const optionEl = option as HTMLElement;
    optionEl.style.display = 'flex';
    optionEl.style.alignItems = 'center';
    optionEl.style.gap = '10px';
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
        height: 50px !important;
        max-height: 50px !important;
        min-height: 50px !important;
        overflow: visible !important;
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

// HTML export updated: match real result page, remove rating and teacher tip sections
export const exportAsHTML = (elementId: string, filename: string = 'worksheet.html', title: string = 'worksheet') => {
  const element = document.getElementById(elementId);

  if (!element) {
    throw new Error('Element not found');
  }

  const datePart = getCurrentDate();
  const keywords = extractKeywords(title);
  
  const clonedElement = element.cloneNode(true) as HTMLElement;
  
  // Remove buttons
  const buttons = clonedElement.querySelectorAll('button');
  buttons.forEach(button => button.remove());
  
  // Remove editable attributes
  const editableElements = clonedElement.querySelectorAll('[contenteditable="true"]');
  editableElements.forEach(el => {
    (el as HTMLElement).removeAttribute('contenteditable');
  });
  
  // Remove rating section and teacher notes
  const elementsToRemove = clonedElement.querySelectorAll('.rating-section, .teacher-notes');
  elementsToRemove.forEach(section => section.remove());
  
  // Remove header and input parameters
  const headers = clonedElement.querySelectorAll('.worksheet-header');
  headers.forEach(header => header.remove());
  
  const inputParams = clonedElement.querySelectorAll('.input-params');
  inputParams.forEach(param => param.remove());
  
  // REMOVE RATING SECTION AND TEACHER TIP BOXES FROM HTML EXPORT
  const ratingSection = clonedElement.querySelector('.rating-section');
  if (ratingSection) ratingSection.remove();

  const teacherTipBoxes = clonedElement.querySelectorAll('.teacher-tip-box');
  teacherTipBoxes.forEach(el => el.remove());
  
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

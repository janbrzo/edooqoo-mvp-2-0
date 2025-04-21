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

  // CLONE ONLY THE MAIN WORKSHEET content, skip rating, headings, tips etc
  const worksheetMain = element.querySelector('.worksheet-main-content') || element;
  const clonedElement = worksheetMain.cloneNode(true) as HTMLElement;

  // Remove unneeded elements:
  const removeSelectors = [
    '.rating-card', '.tips-card', '.worksheet-params', '.worksheet-toolbar', 
    '.scroll-to-top', '.download-toolbar', '.worksheet-header' // and others
  ];
  removeSelectors.forEach(selector => {
    const els = clonedElement.querySelectorAll(selector);
    els.forEach(e => e.remove());
  });

  // Remove all buttons
  const buttons = clonedElement.querySelectorAll('button');
  buttons.forEach(button => button.remove());

  // Remove contenteditable
  const editableElements = clonedElement.querySelectorAll('[contenteditable="true"]');
  editableElements.forEach(el => (el as HTMLElement).removeAttribute('contenteditable'));

  // Exercise headers style (PDF fixes, consistent)
  const exerciseHeaders = clonedElement.querySelectorAll('.exercise-header');
  exerciseHeaders.forEach(header => {
    const headerEl = header as HTMLElement;
    headerEl.style.display = 'flex';
    headerEl.style.alignItems = 'center';
    headerEl.style.height = '50px';
    headerEl.style.maxHeight = '50px';
    headerEl.style.minHeight = '50px';
    headerEl.style.overflow = 'visible';
  });

  // Word bank fixes:
  const wordBanks = clonedElement.querySelectorAll('.word-bank-container');
  wordBanks.forEach(bank => {
    const bankEl = bank as HTMLElement;
    bankEl.style.display = 'flex';
    bankEl.style.alignItems = 'center';
    bankEl.style.justifyContent = 'center';
    bankEl.style.minHeight = '36px';
    bankEl.style.height = '36px';
    bankEl.style.fontSize = '1.08rem';
    bankEl.style.padding = '10px 0';
  });

  // Multiple choice icon vertical alignment
  const checkmarks = clonedElement.querySelectorAll('.option-icon');
  checkmarks.forEach(icon => {
    const iconEl = icon as HTMLElement;
    iconEl.style.verticalAlign = 'middle';
    iconEl.style.display = 'inline-block';
    iconEl.style.marginRight = '8px';
    iconEl.style.marginTop = '0';
    iconEl.style.width = '23px';
    iconEl.style.height = '23px';
  });
  const mcOptions = clonedElement.querySelectorAll('.multiple-choice-option');
  mcOptions.forEach(option => {
    const optionEl = option as HTMLElement;
    optionEl.style.display = 'flex';
    optionEl.style.alignItems = 'center';
    optionEl.style.minHeight = '32px';
    optionEl.style.gap = '10px';
  });

  // Dialogue: treat each line as its own item (not block)
  // So that lines move not whole dialogue
  const wholeDialogues = clonedElement.querySelectorAll('.dialogue-block, .dialogue-section');
  wholeDialogues.forEach(dialogue => {
    // nothing: each .dialogue-line is now properly tagged per below
  });
  // Each .dialogue-line: keep page-break-inside: avoid separately (see CSS)

  // Prevent break-inside for exercise line units, not entire block
  const avoidBreakElements = clonedElement.querySelectorAll('.exercise-item, .exercise-question, .sentence-item, .multiple-choice-question, .dialogue-line');
  avoidBreakElements.forEach(el => {
    (el as HTMLElement).style.pageBreakInside = 'avoid';
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
      .word-bank-container {
        align-items: center !important;
        display: flex !important;
        justify-content: center !important;
        min-height: 36px !important;
        height: 36px !important;
        font-size: 1.08rem;
        border: 1.4px solid #bdbbea !important;
        padding: 10px 0 !important;
      }
      .option-icon {
        vertical-align: middle !important;
        display: inline-block !important;
        margin-right: 8px !important;
        width: 23px !important;
        height: 23px !important;
      }
      .multiple-choice-option {
        align-items: center !important;
        gap: 10px !important;
        min-height: 32px !important;
        display: flex !important;
      }
      .dialogue-line {
        display: flex !important;
        align-items: flex-start !important;
        page-break-inside: avoid !important;
        margin-bottom: 4px !important;
        width: 100% !important;
      }
    }
  `;
  clonedElement.appendChild(style);

  const options = {
    margin: [15, 15, 15, 15],
    filename: filename,
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
  // Only export worksheet content, not header/buttons/etc
  const worksheetMain = element.querySelector('.worksheet-main-content') || element;
  const clonedElement = worksheetMain.cloneNode(true) as HTMLElement;

  // Remove unneeded elements:
  const removeSelectors = [
    '.rating-card', '.tips-card', '.worksheet-params', '.worksheet-toolbar', 
    '.scroll-to-top', '.download-toolbar', '.worksheet-header'
  ];
  removeSelectors.forEach(selector => {
    const els = clonedElement.querySelectorAll(selector);
    els.forEach(e => e.remove());
  });
  const buttons = clonedElement.querySelectorAll('button');
  buttons.forEach(button => button.remove());
  const editableElements = clonedElement.querySelectorAll('[contenteditable="true"]');
  editableElements.forEach(el => (el as HTMLElement).removeAttribute('contenteditable'));

  // Final HTML content:
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>English Worksheet - ${title}</title>
      <link rel="stylesheet" href="/index.css" />
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
  a.download = `${getCurrentDate()}-worksheet-${extractKeywords(title)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
};

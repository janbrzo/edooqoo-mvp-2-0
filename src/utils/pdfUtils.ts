
import html2pdf from 'html2pdf.js';

export const generatePDF = async (
  elementId: string,
  filename: string,
  isTeacherMode: boolean,
  title: string
) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) return false;

    // Remove elements that shouldn't be in PDF
    const noPdfElements = element.querySelectorAll('[data-no-pdf="true"]');
    noPdfElements.forEach(el => (el as HTMLElement).style.display = 'none');

    // Format the filename
    const date = new Date().toISOString().split('T')[0];
    const mode = isTeacherMode ? 'Teacher' : 'Student';
    const sanitizedTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const formattedFilename = `${date}-${mode}-${sanitizedTitle}.pdf`;

    const opt = {
      margin: [10, 10, 10, 10], // Reduced margins [top, right, bottom, left] in mm
      filename: formattedFilename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    await html2pdf().set(opt).from(element).save();

    // Restore visibility of no-pdf elements
    noPdfElements.forEach(el => (el as HTMLElement).style.display = '');

    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};

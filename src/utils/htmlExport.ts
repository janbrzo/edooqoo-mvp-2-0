
export async function exportAsHTML(elementId: string, filename: string, viewMode: string, worksheetTitle: string): Promise<boolean> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('Element not found:', elementId);
      return false;
    }

    // Clone the element to avoid modifying the original
    const clonedElement = element.cloneNode(true) as HTMLElement;
    
    // Remove any edit buttons and non-printable elements
    const editButtons = clonedElement.querySelectorAll('.editable-content, [contenteditable]');
    editButtons.forEach(btn => btn.remove());
    
    // Get current styles
    const allStyles = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n');
        } catch (e) {
          console.warn('Could not access stylesheet:', e);
          return '';
        }
      })
      .join('\n');

    // Create the full HTML document
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${worksheetTitle}</title>
    <style>
        ${allStyles}
        
        /* Print-specific styles */
        @media print {
            @page {
                margin: 0.5cm 1cm 1cm 1cm !important;
                size: A4;
                
                @bottom-right {
                    content: "Page " counter(page) " of " counter(pages);
                    font-size: 10pt;
                    color: #666;
                    margin-bottom: 0.5cm;
                }
            }
            
            body {
                margin: 0 !important;
                padding: 0 !important;
                font-size: 12pt;
                line-height: 1.4;
                color: #000;
                background: white;
            }
            
            .worksheet-content {
                margin: 0 !important;
                padding: 0 !important;
                max-width: 100% !important;
            }
            
            .container {
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            
            /* Hide scroll button in print */
            .scroll-to-top {
                display: none !important;
            }
            
            /* Ensure page breaks work properly */
            .exercise-section {
                break-inside: avoid;
                page-break-inside: avoid;
            }
            
            /* Hide browser's default header/footer but keep page numbers */
            @page {
                margin-top: 0.5cm;
                margin-bottom: 1cm;
            }
        }
        
        /* Screen styles */
        @media screen {
            body {
                font-family: system-ui, -apple-system, sans-serif;
                line-height: 1.6;
                margin: 20px;
                background: #f5f5f5;
            }
            
            .worksheet-content {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
        }
        
        /* Scroll to top button styles */
        .scroll-to-top {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #7c3aed;
            color: white;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            font-size: 18px;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 1000;
            display: none;
            transition: background-color 0.3s ease;
        }
        
        .scroll-to-top:hover {
            background: #6d28d9;
        }
        
        .scroll-to-top.visible {
            display: block;
        }
        
        /* Arrow icon for scroll button */
        .scroll-to-top::before {
            content: "↑";
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="worksheet-content">
        <div style="text-align: center; margin-bottom: 20px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
            <h1 style="margin: 0; color: #7c3aed; font-size: 24px;">${worksheetTitle}</h1>
        </div>
        ${clonedElement.innerHTML}
    </div>
    
    <!-- Scroll to top button -->
    <button class="scroll-to-top" id="scrollToTop" onclick="scrollToTop()" title="Scroll to top">
    </button>
    
    <script>
        // Scroll to top functionality
        function scrollToTop() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
        
        // Show/hide scroll button based on scroll position
        window.addEventListener('scroll', function() {
            const scrollButton = document.getElementById('scrollToTop');
            if (window.pageYOffset > 300) {
                scrollButton.classList.add('visible');
            } else {
                scrollButton.classList.remove('visible');
            }
        });
        
        // Print functionality
        function printWorksheet() {
            window.print();
        }
        
        // Add print button if not in print mode
        if (window.matchMedia && !window.matchMedia('print').matches) {
            document.addEventListener('DOMContentLoaded', function() {
                const printButton = document.createElement('button');
                printButton.innerHTML = 'Print Worksheet';
                printButton.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #7c3aed; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; z-index: 1000;';
                printButton.onclick = printWorksheet;
                document.body.appendChild(printButton);
            });
        }
    </script>
</body>
</html>`;

    // Create and download the file
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error exporting HTML:', error);
    return false;
  }
}

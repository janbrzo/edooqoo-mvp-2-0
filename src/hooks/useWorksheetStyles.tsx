
import { useEffect } from "react";

export const useWorksheetStyles = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        @page {
          margin: 10mm;
        }
        
        .page-number {
          position: fixed;
          bottom: 10mm;
          right: 10mm;
          font-size: 10pt;
          color: #666;
        }
        
        .page-number::before {
          content: "Page " counter(page) " of " counter(pages);
        }
      }
      
      /* Mobile responsive styles */
      @media (max-width: 767px) {
        .container {
          padding: 10px !important;
        }
        
        .worksheet-content {
          padding: 15px !important;
        }
        
        .grid.grid-cols-1.md\\:grid-cols-4 {
          grid-template-columns: 1fr !important;
        }
        
        .grid.grid-cols-1.md\\:grid-cols-3 {
          grid-template-columns: 1fr !important;
        }
        
        .text-3xl {
          font-size: 1.5rem !important;
          line-height: 2rem !important;
        }
        
        .text-xl {
          font-size: 1.125rem !important;
          line-height: 1.5rem !important;
        }
        
        .p-6 {
          padding: 1rem !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
};

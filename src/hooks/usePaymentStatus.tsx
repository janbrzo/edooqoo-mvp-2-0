
import { useState, useEffect } from 'react';

interface PaymentStatus {
  isPaid: boolean;
  sessionId?: string;
}

export const usePaymentStatus = (worksheetId: string) => {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ isPaid: false });

  useEffect(() => {
    // Check if payment was completed for this worksheet
    const checkPaymentStatus = () => {
      const paidWorksheets = JSON.parse(sessionStorage.getItem('paidWorksheets') || '{}');
      const worksheetPayment = paidWorksheets[worksheetId];
      
      if (worksheetPayment && worksheetPayment.isPaid) {
        setPaymentStatus({
          isPaid: true,
          sessionId: worksheetPayment.sessionId
        });
      }
    };

    checkPaymentStatus();
    
    // Listen for payment completion events
    const handlePaymentComplete = (event: CustomEvent) => {
      if (event.detail.worksheetId === worksheetId) {
        setPaymentStatus({
          isPaid: true,
          sessionId: event.detail.sessionId
        });
      }
    };

    window.addEventListener('paymentComplete', handlePaymentComplete as EventListener);
    
    return () => {
      window.removeEventListener('paymentComplete', handlePaymentComplete as EventListener);
    };
  }, [worksheetId]);

  const markAsPaid = (sessionId: string) => {
    const paidWorksheets = JSON.parse(sessionStorage.getItem('paidWorksheets') || '{}');
    paidWorksheets[worksheetId] = {
      isPaid: true,
      sessionId,
      timestamp: Date.now()
    };
    sessionStorage.setItem('paidWorksheets', JSON.stringify(paidWorksheets));
    
    setPaymentStatus({ isPaid: true, sessionId });
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('paymentComplete', {
      detail: { worksheetId, sessionId }
    }));
  };

  return { paymentStatus, markAsPaid };
};

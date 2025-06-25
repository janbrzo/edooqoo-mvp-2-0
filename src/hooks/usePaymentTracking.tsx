
import { useEventTracking } from './useEventTracking';

export const usePaymentTracking = (userId?: string) => {
  const { trackEvent } = useEventTracking(userId);

  const trackPaymentButtonClick = (worksheetId: string, amount: number) => {
    trackEvent({
      eventType: 'payment_button_click',
      eventData: {
        worksheetId,
        amount,
        timestamp: new Date().toISOString()
      }
    });
  };

  const trackStripePaymentSuccess = (worksheetId: string, paymentId: string, amount: number) => {
    trackEvent({
      eventType: 'stripe_payments_success',
      eventData: {
        worksheetId,
        paymentId,
        amount,
        timestamp: new Date().toISOString()
      }
    });
  };

  return {
    trackPaymentButtonClick,
    trackStripePaymentSuccess
  };
};

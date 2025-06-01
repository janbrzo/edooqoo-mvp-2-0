
import { isValidUUID, isValidURL } from './security.ts';

export interface PaymentRequest {
  worksheetId: string;
  userId: string;
  successUrl?: string;
  cancelUrl?: string;
}

export function validatePaymentRequest(data: any): { isValid: boolean; error?: string } {
  const { worksheetId, userId, successUrl, cancelUrl } = data;

  // Input validation
  if (!worksheetId || !userId) {
    return {
      isValid: false,
      error: 'Missing required parameters: worksheetId and userId are required'
    };
  }

  // Validate worksheetId as UUID only if it looks like a UUID (longer than 10 chars)
  if (worksheetId.length > 10 && !isValidUUID(worksheetId)) {
    return {
      isValid: false,
      error: 'Invalid worksheet ID format provided'
    };
  }

  // Validate URLs if provided
  if (successUrl && !isValidURL(successUrl)) {
    return {
      isValid: false,
      error: 'Invalid success URL provided'
    };
  }

  if (cancelUrl && !isValidURL(cancelUrl)) {
    return {
      isValid: false,
      error: 'Invalid cancel URL provided'
    };
  }

  return { isValid: true };
}


import { isValidUUID, isValidURL } from './security.ts';

export interface PaymentRequest {
  worksheetId: string;
  userId: string;
  successUrl?: string;
  cancelUrl?: string;
}

export function validatePaymentRequest(request: PaymentRequest): { valid: boolean; error?: string } {
  const { worksheetId, userId, successUrl, cancelUrl } = request;

  if (!worksheetId || !userId) {
    return { 
      valid: false, 
      error: 'Missing required parameters: worksheetId and userId are required' 
    };
  }

  // Validate worksheetId as UUID only if it looks like a UUID (longer than 10 chars)
  if (worksheetId.length > 10 && !isValidUUID(worksheetId)) {
    return { 
      valid: false, 
      error: 'Invalid worksheet ID format provided' 
    };
  }

  // Validate URLs if provided
  if (successUrl && !isValidURL(successUrl)) {
    return { 
      valid: false, 
      error: 'Invalid success URL provided' 
    };
  }

  if (cancelUrl && !isValidURL(cancelUrl)) {
    return { 
      valid: false, 
      error: 'Invalid cancel URL provided' 
    };
  }

  return { valid: true };
}

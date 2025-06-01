
/**
 * Security utilities for input validation and sanitization
 */

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates if a string is a valid UUID
 */
export function isValidUUID(uuid: string): boolean {
  return typeof uuid === 'string' && UUID_REGEX.test(uuid);
}

/**
 * Validates if a string is a valid email
 */
export function isValidEmail(email: string): boolean {
  return typeof email === 'string' && email.length <= 254 && EMAIL_REGEX.test(email);
}

/**
 * Sanitizes user input by removing potentially harmful characters
 */
export function sanitizeInput(input: string, maxLength: number = 10000): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove basic HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

/**
 * Validates prompt input
 */
export function validatePrompt(prompt: string): { isValid: boolean; error?: string } {
  if (!prompt || typeof prompt !== 'string') {
    return { isValid: false, error: 'Prompt is required and must be a string' };
  }
  
  if (prompt.length < 10) {
    return { isValid: false, error: 'Prompt must be at least 10 characters long' };
  }
  
  if (prompt.length > 5000) {
    return { isValid: false, error: 'Prompt must be less than 5000 characters' };
  }
  
  return { isValid: true };
}

/**
 * Validates rating input
 */
export function validateRating(rating: number): { isValid: boolean; error?: string } {
  if (typeof rating !== 'number' || isNaN(rating)) {
    return { isValid: false, error: 'Rating must be a number' };
  }
  
  if (rating < 1 || rating > 5) {
    return { isValid: false, error: 'Rating must be between 1 and 5' };
  }
  
  return { isValid: true };
}

/**
 * Validates comment input
 */
export function validateComment(comment: string): { isValid: boolean; error?: string } {
  if (typeof comment !== 'string') {
    return { isValid: false, error: 'Comment must be a string' };
  }
  
  if (comment.length > 2000) {
    return { isValid: false, error: 'Comment must be less than 2000 characters' };
  }
  
  return { isValid: true };
}

/**
 * Generates a cryptographically secure session token
 */
export function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const timestamp = Date.now().toString(36);
  const randomHex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  return `ds_${timestamp}_${randomHex}`;
}

/**
 * Rate limiting helper - simple in-memory store (for edge functions)
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  isAllowed(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }
}

export const rateLimiter = new RateLimiter();

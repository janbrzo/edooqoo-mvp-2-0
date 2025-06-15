// Input validation utilities

export interface SubmitFeedbackRequest {
  worksheetId: string;
  rating: number;
  comment: string;
  userId: string;
}

export function validateSubmitFeedbackRequest(data: any): { isValid: boolean; error?: string; validatedData?: SubmitFeedbackRequest } {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Request body is required' };
  }

  const { worksheetId, rating, comment, userId } = data;

  // Validate worksheetId
  if (!worksheetId || typeof worksheetId !== 'string' || worksheetId.trim().length === 0) {
    return { isValid: false, error: 'Worksheet ID is required' };
  }

  // Validate userId
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    return { isValid: false, error: 'User ID is required' };
  }

  // Validate rating
  if (typeof rating !== 'number' || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return { isValid: false, error: 'Rating must be an integer between 1 and 5' };
  }

  // Validate comment (optional)
  if (comment !== undefined && comment !== null && typeof comment !== 'string') {
    return { isValid: false, error: 'Comment must be a string' };
  }

  // Sanitize and limit comment length
  const sanitizedComment = comment ? String(comment).trim().slice(0, 1000) : '';

  return {
    isValid: true,
    validatedData: {
      worksheetId: worksheetId.trim(),
      rating,
      comment: sanitizedComment,
      userId: userId.trim()
    }
  };
}

export function isValidUUID(uuid: string): boolean {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof uuid === 'string' && UUID_REGEX.test(uuid);
}

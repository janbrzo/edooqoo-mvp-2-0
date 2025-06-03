
// Rate limiting functionality

export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  isAllowed(key: string, maxRequests: number = 5, windowMs: number = 300000): boolean { // 5 requests per 5 minutes
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }
}

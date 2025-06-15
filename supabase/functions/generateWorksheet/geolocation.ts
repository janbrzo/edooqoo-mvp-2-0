
// Geolocation utility

export async function getGeolocation(ip: string): Promise<{ country?: string; city?: string }> {
  try {
    // Use a simple IP geolocation service
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city`);
    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        country: data.country || null,
        city: data.city || null
      };
    }
  } catch (error) {
    console.warn('Failed to get geolocation:', error);
  }
  
  return {};
}

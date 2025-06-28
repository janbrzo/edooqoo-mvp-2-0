
// Enhanced geolocation utility for Edge Functions

export async function getGeolocation(ip: string): Promise<{ country?: string; city?: string }> {
  console.log(`🌍 Starting geolocation lookup for IP: ${ip}`);
  
  // Skip geolocation for localhost/private IPs
  if (!ip || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    console.log('🌍 Skipping geolocation for localhost/private IP');
    return {};
  }
  
  // Use ipapi.co which works better with Edge Functions
  const services = [
    {
      name: 'ipapi.co',
      url: `https://ipapi.co/${ip}/json/`,
      timeout: 8000
    },
    {
      name: 'ip-api.com', 
      url: `https://ip-api.com/json/${ip}?fields=status,country,city`,
      timeout: 8000
    }
  ];
  
  for (const service of services) {
    try {
      console.log(`🌍 Trying ${service.name} for IP: ${ip}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), service.timeout);
      
      const response = await fetch(service.url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Edooqoo-Analytics/1.0 (+https://edooqoo.com)',
          'Accept': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.warn(`🌍 ${service.name} returned status: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      console.log(`🌍 Raw response from ${service.name}:`, data);
      
      let country, city;
      
      if (service.name === 'ipapi.co') {
        country = data.country_name || data.country;
        city = data.city;
        
        // Check for errors in ipapi.co response
        if (data.error) {
          console.warn(`🌍 ${service.name} returned error: ${data.reason}`);
          continue;
        }
      } else if (service.name === 'ip-api.com') {
        if (data.status === 'success') {
          country = data.country;
          city = data.city;
        } else {
          console.warn(`🌍 ${service.name} returned status: ${data.status}`);
          continue;
        }
      }
      
      if (country || city) {
        console.log(`🌍 Successfully got geolocation from ${service.name}:`, { country, city });
        return { country, city };
      }
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn(`🌍 ${service.name} request timed out after ${service.timeout}ms`);
      } else {
        console.warn(`🌍 ${service.name} failed:`, error.message);
      }
      continue;
    }
  }
  
  console.warn('🌍 All geolocation services failed, returning empty location');
  return {};
}


// Enhanced geolocation utility with HTTPS, timeout, retry, and fallback

export async function getGeolocation(ip: string): Promise<{ country?: string; city?: string }> {
  console.log(`🌍 Starting geolocation lookup for IP: ${ip}`);
  
  // Skip geolocation for localhost/private IPs
  if (!ip || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    console.log('🌍 Skipping geolocation for localhost/private IP');
    return {};
  }
  
  // Primary service with HTTPS
  const services = [
    {
      name: 'ip-api.com',
      url: `https://ip-api.com/json/${ip}?fields=status,country,city`,
      timeout: 5000
    },
    {
      name: 'ipinfo.io', 
      url: `https://ipinfo.io/${ip}/json`,
      timeout: 5000
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
          'User-Agent': 'Edooqoo-Worksheet-Generator/1.0'
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
      
      if (service.name === 'ip-api.com') {
        if (data.status === 'success') {
          country = data.country;
          city = data.city;
        }
      } else if (service.name === 'ipinfo.io') {
        country = data.country;
        city = data.city;
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

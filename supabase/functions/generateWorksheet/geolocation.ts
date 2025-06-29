
// Enhanced geolocation utility with reliable services and proper IP handling

export async function getGeolocation(ip: string): Promise<{ country?: string; city?: string }> {
  console.log(`🌍 Starting geolocation lookup for IP: ${ip}`);
  
  // Clean and validate IP address
  let cleanedIp = ip;
  if (ip && ip.includes(',')) {
    // Take the first IP from comma-separated list
    cleanedIp = ip.split(',')[0].trim();
    console.log(`🌍 Cleaned IP from "${ip}" to "${cleanedIp}"`);
  }
  
  // Skip geolocation for localhost/private IPs
  if (!cleanedIp || cleanedIp === '127.0.0.1' || cleanedIp.startsWith('192.168.') || cleanedIp.startsWith('10.') || cleanedIp.startsWith('172.')) {
    console.log('🌍 Skipping geolocation for localhost/private IP');
    return {};
  }

  // Validate IP format (basic check)
  const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  if (!ipRegex.test(cleanedIp)) {
    console.log(`🌍 Invalid IP format: ${cleanedIp}`);
    return {};
  }
  
  // Use more reliable services with better error handling
  const services = [
    {
      name: 'ipapi.co',
      url: `https://ipapi.co/${cleanedIp}/json/`,
      timeout: 8000
    },
    {
      name: 'freegeoip.app',
      url: `https://freegeoip.app/json/${cleanedIp}`,
      timeout: 8000
    },
    {
      name: 'ip-api.com',
      url: `http://ip-api.com/json/${cleanedIp}?fields=status,country,city`,
      timeout: 8000
    }
  ];
  
  for (const service of services) {
    try {
      console.log(`🌍 Trying ${service.name} for IP: ${cleanedIp}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.log(`🌍 ${service.name} request timed out after ${service.timeout}ms`);
      }, service.timeout);
      
      const response = await fetch(service.url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Edooqoo-Worksheet-Generator/1.0 (Educational Tool)',
          'Accept': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.warn(`🌍 ${service.name} returned status: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      console.log(`🌍 Raw response from ${service.name}:`, JSON.stringify(data, null, 2));
      
      let country, city;
      
      if (service.name === 'ipapi.co') {
        if (!data.error && data.country_name && data.city) {
          country = data.country_name;
          city = data.city;
        } else if (data.error) {
          console.warn(`🌍 ${service.name} API error:`, data.error);
          continue;
        }
      } else if (service.name === 'freegeoip.app') {
        if (data.country_name && data.city) {
          country = data.country_name;
          city = data.city;
        }
      } else if (service.name === 'ip-api.com') {
        if (data.status === 'success' && data.country && data.city) {
          country = data.country;
          city = data.city;
        } else if (data.status === 'fail') {
          console.warn(`🌍 ${service.name} API failed:`, data.message);
          continue;
        }
      }
      
      if (country && city) {
        console.log(`🌍 ✅ Successfully got geolocation from ${service.name}:`, { country, city });
        return { country, city };
      } else {
        console.warn(`🌍 ${service.name} returned incomplete data:`, { country, city });
      }
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn(`🌍 ${service.name} request was aborted (timeout)`);
      } else {
        console.warn(`🌍 ${service.name} failed with error:`, error.message);
      }
      continue;
    }
  }
  
  console.warn('🌍 ❌ All geolocation services failed, returning empty location');
  return {};
}


import { useState, useEffect } from "react";

export function useDownloadStatus() {
  const [isDownloadUnlocked, setIsDownloadUnlocked] = useState(false);
  const [userIp, setUserIp] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserIp = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setUserIp(data.ip);
        console.log('User IP fetched:', data.ip);
      } catch (error) {
        console.error('Failed to fetch IP:', error);
        setUserIp(`browser_${navigator.userAgent.slice(0, 50)}_${Date.now()}`);
      }
    };
    
    fetchUserIp();
    checkDownloadStatus();
  }, []);

  const checkDownloadStatus = () => {
    const token = sessionStorage.getItem('downloadToken');
    const expiry = sessionStorage.getItem('downloadTokenExpiry');
    
    if (token && expiry) {
      const expiryTime = parseInt(expiry);
      if (Date.now() < expiryTime) {
        setIsDownloadUnlocked(true);
      } else {
        sessionStorage.removeItem('downloadToken');
        sessionStorage.removeItem('downloadTokenExpiry');
        setIsDownloadUnlocked(false);
      }
    }
  };

  const handleDownloadUnlock = (token: string) => {
    setIsDownloadUnlocked(true);
  };

  return {
    isDownloadUnlocked,
    userIp,
    handleDownloadUnlock
  };
}


import { useState, useEffect } from "react";
import { downloadSessionService } from "@/services/downloadSessionService";

export function useDownloadStatus() {
  const [isDownloadUnlocked, setIsDownloadUnlocked] = useState(false);
  const [userIp, setUserIp] = useState<string | null>(null);
  const [downloadStats, setDownloadStats] = useState<{ downloads_count: number; expires_at: string } | null>(null);

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

  const checkDownloadStatus = async () => {
    const token = sessionStorage.getItem('downloadToken');
    const expiry = sessionStorage.getItem('downloadTokenExpiry');
    
    console.log('Checking download status with token:', token);
    
    if (token && expiry) {
      const expiryTime = parseInt(expiry);
      if (Date.now() < expiryTime) {
        // Check with database as well
        const isValid = await downloadSessionService.isSessionValid(token);
        if (isValid) {
          setIsDownloadUnlocked(true);
          // Get download stats
          const stats = await downloadSessionService.getSessionStats(token);
          setDownloadStats(stats);
          console.log('Download unlocked with stats:', stats);
        } else {
          // Session expired in database, clean up
          sessionStorage.removeItem('downloadToken');
          sessionStorage.removeItem('downloadTokenExpiry');
          setIsDownloadUnlocked(false);
        }
      } else {
        sessionStorage.removeItem('downloadToken');
        sessionStorage.removeItem('downloadTokenExpiry');
        setIsDownloadUnlocked(false);
      }
    }
  };

  const handleDownloadUnlock = async (token: string) => {
    console.log('Unlocking downloads with token:', token);
    setIsDownloadUnlocked(true);
    
    // Create session in database if it doesn't exist
    const existingSession = await downloadSessionService.getSessionByToken(token);
    if (!existingSession) {
      console.log('Creating new download session...');
      await downloadSessionService.createSession(token);
    }
    
    // Get updated stats
    const stats = await downloadSessionService.getSessionStats(token);
    setDownloadStats(stats);
    console.log('Download unlock completed with stats:', stats);
  };

  const trackDownload = async () => {
    const token = sessionStorage.getItem('downloadToken');
    console.log('Tracking download with token:', token);
    
    if (token) {
      const success = await downloadSessionService.incrementDownloadCount(token);
      if (success) {
        console.log('Download tracked successfully');
        // Update local stats
        const stats = await downloadSessionService.getSessionStats(token);
        setDownloadStats(stats);
        console.log('Updated stats after download:', stats);
      } else {
        console.error('Failed to track download');
      }
    } else {
      console.error('No download token found for tracking');
    }
  };

  // NEW: Auto-unlock for token-generated worksheets
  const checkTokenGeneratedWorksheet = (worksheetId: string, userId?: string) => {
    // If user is logged in and worksheet exists, auto-unlock
    if (userId && worksheetId && worksheetId !== 'unknown') {
      console.log('🔓 Auto-unlocking download for token-generated worksheet');
      const autoToken = `token_${worksheetId}_${userId}_${Date.now()}`;
      
      // Set a long-lasting token for token-generated worksheets
      const expiryTime = Date.now() + (365 * 24 * 60 * 60 * 1000); // 1 year
      sessionStorage.setItem('downloadToken', autoToken);
      sessionStorage.setItem('downloadTokenExpiry', expiryTime.toString());
      
      setIsDownloadUnlocked(true);
      setDownloadStats({ downloads_count: 0, expires_at: new Date(expiryTime).toISOString() });
      
      console.log('✅ Auto-unlock completed for token-generated worksheet');
    }
  };

  return {
    isDownloadUnlocked,
    userIp,
    downloadStats,
    handleDownloadUnlock,
    trackDownload,
    checkTokenGeneratedWorksheet
  };
}

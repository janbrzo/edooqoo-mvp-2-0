
import { useState, useEffect } from "react";
import { downloadSessionService } from "@/services/downloadSessionService";

export type UserType = 'authenticated' | 'anonymous' | 'unknown';

export function useDownloadStatus() {
  const [isDownloadUnlocked, setIsDownloadUnlocked] = useState(false);
  const [userIp, setUserIp] = useState<string | null>(null);
  const [downloadStats, setDownloadStats] = useState<{ downloads_count: number; expires_at: string } | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

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
  }, []);

  // Determine user type based on session data
  const determineUserType = (userId?: string, isAnonymous?: boolean): UserType => {
    if (!userId) {
      return 'unknown';
    }
    if (isAnonymous === true) {
      return 'anonymous';
    }
    return 'authenticated';
  };

  // Check if user has a valid download token in sessionStorage
  const hasValidDownloadToken = () => {
    const token = sessionStorage.getItem('downloadToken');
    const expiry = sessionStorage.getItem('downloadTokenExpiry');
    
    if (!token || !expiry) {
      return false;
    }
    
    const expiryTime = parseInt(expiry);
    const isValid = Date.now() < expiryTime;
    
    return isValid;
  };

  // Initialize download state based on user type and payment status
  const initializeDownloadState = (userId?: string, isAnonymous?: boolean, worksheetId?: string) => {
    if (isInitialized) {
      return; // Prevent re-initialization
    }

    const userType = determineUserType(userId, isAnonymous);
    console.log('🚀 Initializing download state for user type:', userType);

    switch (userType) {
      case 'authenticated':
        console.log('✅ Authenticated user - auto-unlocking downloads');
        setIsDownloadUnlocked(true);
        // Create auto-unlock token for authenticated users
        if (worksheetId) {
          const autoToken = `token_${worksheetId}_${userId}_${Date.now()}`;
          const expiryTime = Date.now() + (365 * 24 * 60 * 60 * 1000); // 1 year
          sessionStorage.setItem('downloadToken', autoToken);
          sessionStorage.setItem('downloadTokenExpiry', expiryTime.toString());
          setDownloadStats({ downloads_count: 0, expires_at: new Date(expiryTime).toISOString() });
        }
        break;

      case 'anonymous':
        const hasValidToken = hasValidDownloadToken();
        if (hasValidToken) {
          console.log('💰 Anonymous user has valid payment token - unlocking downloads');
          setIsDownloadUnlocked(true);
          checkDownloadStatus();
        } else {
          console.log('🔒 Anonymous user without payment - downloads locked');
          setIsDownloadUnlocked(false);
          clearSessionStorage();
        }
        break;

      case 'unknown':
        console.log('❓ Unknown user type - downloads locked');
        setIsDownloadUnlocked(false);
        clearSessionStorage();
        break;
    }

    setIsInitialized(true);
  };

  const clearSessionStorage = () => {
    sessionStorage.removeItem('downloadToken');
    sessionStorage.removeItem('downloadTokenExpiry');
    setDownloadStats(null);
  };

  const checkDownloadStatus = async () => {
    const token = sessionStorage.getItem('downloadToken');
    const expiry = sessionStorage.getItem('downloadTokenExpiry');
    
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
        } else {
          // Session expired in database, clean up
          clearSessionStorage();
          setIsDownloadUnlocked(false);
        }
      } else {
        clearSessionStorage();
        setIsDownloadUnlocked(false);
      }
    }
  };

  const handleDownloadUnlock = async (token: string) => {
    console.log('💳 Processing payment unlock with token:', token.substring(0, 20) + '...');
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
    console.log('✅ Download unlock completed');
  };

  const trackDownload = async () => {
    const token = sessionStorage.getItem('downloadToken');
    
    if (token) {
      const success = await downloadSessionService.incrementDownloadCount(token);
      if (success) {
        console.log('📥 Download tracked successfully');
        // Update local stats
        const stats = await downloadSessionService.getSessionStats(token);
        setDownloadStats(stats);
      } else {
        console.error('Failed to track download');
      }
    } else {
      console.error('No download token found for tracking');
    }
  };

  // Reset initialization flag when user changes
  const resetInitialization = () => {
    setIsInitialized(false);
  };

  return {
    isDownloadUnlocked,
    userIp,
    downloadStats,
    handleDownloadUnlock,
    trackDownload,
    determineUserType,
    initializeDownloadState,
    hasValidDownloadToken,
    resetInitialization,
    isInitialized
  };
}

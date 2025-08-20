
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ShareInfo {
  isShared: boolean;
  shareToken: string | null;
  expiresAt: string | null;
  shareUrl: string | null;
}

export const useWorksheetSharing = (worksheetId: string | null) => {
  const [shareInfo, setShareInfo] = useState<ShareInfo>({
    isShared: false,
    shareToken: null,
    expiresAt: null,
    shareUrl: null
  });
  const [loading, setLoading] = useState(false);

  const checkShareStatus = async () => {
    if (!worksheetId) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('worksheets')
        .select('share_token, share_expires_at')
        .eq('id', worksheetId)
        .eq('teacher_id', user.id)
        .single();

      if (error) {
        console.error('Error checking share status:', error);
        return;
      }

      if (data?.share_token) {
        const isExpired = data.share_expires_at && new Date(data.share_expires_at) <= new Date();
        
        if (!isExpired) {
          setShareInfo({
            isShared: true,
            shareToken: data.share_token,
            expiresAt: data.share_expires_at,
            shareUrl: `${window.location.origin}/shared/${data.share_token}`
          });
        } else {
          setShareInfo({
            isShared: false,
            shareToken: null,
            expiresAt: null,
            shareUrl: null
          });
        }
      } else {
        setShareInfo({
          isShared: false,
          shareToken: null,
          expiresAt: null,
          shareUrl: null
        });
      }
    } catch (error) {
      console.error('Error checking worksheet share status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkShareStatus();
  }, [worksheetId]);

  const refreshShareStatus = () => {
    checkShareStatus();
  };

  return {
    shareInfo,
    loading,
    refreshShareStatus
  };
};

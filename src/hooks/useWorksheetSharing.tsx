
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useWorksheetSharing = () => {
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const { toast } = useToast();

  const generateShareLink = async (worksheetId: string, expiresHours: number = 168) => {
    try {
      setIsGeneratingLink(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .rpc('generate_worksheet_share_token', {
          p_worksheet_id: worksheetId,
          p_teacher_id: user.id,
          p_expires_hours: expiresHours
        });

      if (error) throw error;
      
      if (data) {
        const shareUrl = `${window.location.origin}/worksheet/shared/${data}`;
        
        // Copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        
        toast({
          title: "Share link generated!",
          description: "Link has been copied to your clipboard. It will expire in 7 days.",
          className: "bg-green-50 border-green-200"
        });
        
        return shareUrl;
      }
      
      throw new Error('Failed to generate share token');
    } catch (error: any) {
      console.error('Error generating share link:', error);
      toast({
        title: "Failed to generate share link",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const getSharedWorksheet = async (shareToken: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_worksheet_by_share_token', {
          p_share_token: shareToken
        });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error('Worksheet not found or link has expired');
      }

      return data[0];
    } catch (error: any) {
      console.error('Error fetching shared worksheet:', error);
      throw error;
    }
  };

  return {
    generateShareLink,
    getSharedWorksheet,
    isGeneratingLink
  };
};

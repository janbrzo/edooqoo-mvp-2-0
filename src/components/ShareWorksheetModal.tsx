
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Copy, Share2, ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ShareWorksheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  worksheetId: string;
  worksheetTitle: string;
}

const ShareWorksheetModal = ({ isOpen, onClose, worksheetId, worksheetTitle }: ShareWorksheetModalProps) => {
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateShareLink = async () => {
    setIsGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Call the existing RPC function
      const { data: shareToken, error } = await supabase.rpc('generate_worksheet_share_token' as any, {
        p_worksheet_id: worksheetId,
        p_teacher_id: user.id,
        p_expires_hours: 168 // 7 days
      });

      if (error) throw error;

      if (shareToken) {
        const url = `${window.location.origin}/shared/${shareToken}`;
        setShareUrl(url);
        
        toast({
          title: "Share link generated",
          description: "Your worksheet share link is ready (expires in 7 days)",
          className: "bg-green-50 border-green-200"
        });
      }
    } catch (error) {
      console.error('Error generating share link:', error);
      toast({
        title: "Failed to generate share link", 
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Share link has been copied to clipboard",
        className: "bg-green-50 border-green-200"
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please copy the link manually",
        variant: "destructive"
      });
    }
  };

  const openInNewTab = () => {
    window.open(shareUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Worksheet
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Worksheet:</p>
            <p className="font-medium">{worksheetTitle}</p>
          </div>

          {!shareUrl && (
            <Button 
              onClick={generateShareLink}
              disabled={isGenerating}
              className="w-full bg-worksheet-purple hover:bg-worksheet-purpleDark"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Link...
                </>
              ) : (
                <>
                  <Share2 className="mr-2 h-4 w-4" />
                  Generate Share Link
                </>
              )}
            </Button>
          )}

          {shareUrl && (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-2">Share this link:</p>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border">
                  <input 
                    type="text" 
                    value={shareUrl}
                    readOnly
                    className="flex-1 bg-transparent text-sm outline-none"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyToClipboard}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={openInNewTab}
                  variant="outline"
                  className="flex-1"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button
                  onClick={copyToClipboard}
                  className="flex-1 bg-worksheet-purple hover:bg-worksheet-purpleDark"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Link expires in 7 days • Recipients can view but not edit
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareWorksheetModal;

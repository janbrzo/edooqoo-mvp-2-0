
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Share2, X, ExternalLink } from 'lucide-react';

interface ShareWorksheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  worksheetId: string;
  worksheetTitle: string;
}

const ShareWorksheetModal = ({ 
  isOpen, 
  onClose, 
  worksheetId, 
  worksheetTitle 
}: ShareWorksheetModalProps) => {
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const { toast } = useToast();

  // Load existing share token when modal opens
  useEffect(() => {
    if (isOpen && worksheetId) {
      loadExistingToken();
    }
  }, [isOpen, worksheetId]);

  const loadExistingToken = async () => {
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
        console.error('Error loading share token:', error);
        return;
      }

      if (data?.share_token && (!data.share_expires_at || new Date(data.share_expires_at) > new Date())) {
        setShareToken(data.share_token);
        setExpiresAt(data.share_expires_at);
      }
    } catch (error) {
      console.error('Error loading existing token:', error);
    }
  };

  const generateShareLink = async (expiryHours: number | null = 168) => {
    setIsGenerating(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "You must be logged in to share worksheets.",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase.rpc('generate_worksheet_share_token', {
        p_worksheet_id: worksheetId,
        p_teacher_id: user.id,
        p_expires_hours: expiryHours
      });

      if (error) {
        throw error;
      }

      if (data) {
        setShareToken(data);
        // Calculate expiry date
        if (expiryHours) {
          const expiryDate = new Date();
          expiryDate.setHours(expiryDate.getHours() + expiryHours);
          setExpiresAt(expiryDate.toISOString());
        } else {
          setExpiresAt(null);
        }

        toast({
          title: "Share link generated",
          description: "Your worksheet can now be shared with others.",
          className: "bg-green-50 border-green-200"
        });
      }
    } catch (error) {
      console.error('Error generating share link:', error);
      toast({
        title: "Failed to generate share link",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const revokeShareLink = async () => {
    setIsRevoking(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('worksheets')
        .update({ 
          share_token: null, 
          share_expires_at: null 
        })
        .eq('id', worksheetId)
        .eq('teacher_id', user.id);

      if (error) {
        throw error;
      }

      setShareToken(null);
      setExpiresAt(null);

      toast({
        title: "Share link revoked",
        description: "The worksheet is no longer publicly accessible.",
        className: "bg-green-50 border-green-200"
      });
    } catch (error) {
      console.error('Error revoking share link:', error);
      toast({
        title: "Failed to revoke share link",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsRevoking(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Share link has been copied to your clipboard.",
        className: "bg-green-50 border-green-200"
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive"
      });
    }
  };

  const getShareUrl = () => {
    if (!shareToken) return '';
    return `${window.location.origin}/shared/${shareToken}`;
  };

  const formatExpiryDate = () => {
    if (!expiresAt) return 'Never expires';
    const date = new Date(expiresAt);
    return `Expires: ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
  };

  const isExpired = () => {
    if (!expiresAt) return false;
    return new Date(expiresAt) <= new Date();
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
            <h4 className="font-medium text-sm text-gray-600 mb-1">Worksheet Title</h4>
            <p className="text-sm bg-gray-50 p-2 rounded">{worksheetTitle}</p>
          </div>

          {shareToken && !isExpired() ? (
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm text-gray-600 mb-2">Share Link</h4>
                <div className="flex gap-2">
                  <Input 
                    value={getShareUrl()} 
                    readOnly 
                    className="text-sm"
                  />
                  <Button
                    onClick={() => copyToClipboard(getShareUrl())}
                    size="sm"
                    variant="outline"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => window.open(getShareUrl(), '_blank')}
                    size="sm"
                    variant="outline"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="text-xs text-gray-500">
                {formatExpiryDate()}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => generateShareLink(168)}
                  disabled={isGenerating}
                  size="sm"
                  variant="outline"
                >
                  Generate New Link
                </Button>
                <Button
                  onClick={revokeShareLink}
                  disabled={isRevoking}
                  size="sm"
                  variant="destructive"
                >
                  Revoke Access
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Generate a secure link to share this worksheet publicly. 
                Anyone with the link will be able to view the worksheet.
              </p>

              <div>
                <label className="block text-sm font-medium mb-2">Link Expiry</label>
                <Select defaultValue="168" onValueChange={(value) => {
                  const hours = value === 'never' ? null : parseInt(value);
                  generateShareLink(hours);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select expiry time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24 hours</SelectItem>
                    <SelectItem value="168">1 week</SelectItem>
                    <SelectItem value="720">1 month</SelectItem>
                    <SelectItem value="never">Never expires</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => generateShareLink(168)}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Generating...' : 'Generate Share Link'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareWorksheetModal;

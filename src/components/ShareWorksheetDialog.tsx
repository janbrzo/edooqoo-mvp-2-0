
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, ExternalLink, Share } from "lucide-react";
import { useWorksheetSharing } from "@/hooks/useWorksheetSharing";

interface ShareWorksheetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  worksheetId: string;
  worksheetTitle: string;
}

export const ShareWorksheetDialog = ({ 
  isOpen, 
  onClose, 
  worksheetId, 
  worksheetTitle 
}: ShareWorksheetDialogProps) => {
  const [shareLink, setShareLink] = useState<string>("");
  const [expiresHours, setExpiresHours] = useState("168"); // 7 days default
  const { generateShareLink, isGeneratingLink } = useWorksheetSharing();

  const handleGenerateLink = async () => {
    try {
      const link = await generateShareLink(worksheetId, parseInt(expiresHours));
      setShareLink(link);
    } catch (error) {
      console.error('Failed to generate share link:', error);
    }
  };

  const handleCopyLink = async () => {
    if (shareLink) {
      await navigator.clipboard.writeText(shareLink);
    }
  };

  const handleOpenLink = () => {
    if (shareLink) {
      window.open(shareLink, '_blank');
    }
  };

  const handleClose = () => {
    setShareLink("");
    onClose();
  };

  const expirationOptions = [
    { value: "24", label: "24 hours" },
    { value: "72", label: "3 days" },
    { value: "168", label: "7 days" },
    { value: "720", label: "30 days" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share className="h-5 w-5" />
            Share Worksheet with Student
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Worksheet</Label>
            <p className="text-sm text-muted-foreground truncate">{worksheetTitle}</p>
          </div>

          <div>
            <Label htmlFor="expiration" className="text-sm font-medium">
              Link expires in
            </Label>
            <Select value={expiresHours} onValueChange={setExpiresHours}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {expirationOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!shareLink ? (
            <Button 
              onClick={handleGenerateLink} 
              disabled={isGeneratingLink}
              className="w-full"
            >
              {isGeneratingLink ? "Generating..." : "Generate Share Link"}
            </Button>
          ) : (
            <div className="space-y-3">
              <div>
                <Label htmlFor="share-link" className="text-sm font-medium">
                  Share Link
                </Label>
                <Input 
                  id="share-link"
                  value={shareLink} 
                  readOnly 
                  className="bg-muted"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleCopyLink}
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
                <Button 
                  onClick={handleOpenLink}
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                This link will expire in {expirationOptions.find(o => o.value === expiresHours)?.label.toLowerCase()}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};


import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, CreditCard, Download, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaymentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  exportType: 'html' | 'pdf';
  worksheetTitle: string;
}

const PaymentPopup = ({ isOpen, onClose, onSuccess, exportType, worksheetTitle }: PaymentPopupProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-export-payment', {
        body: { 
          exportType, 
          worksheetTitle,
          allowPromotionCodes: true 
        }
      });

      if (error) {
        console.error('Payment creation error:', error);
        toast({
          title: "Payment Error",
          description: "Failed to create payment session. Please try again.",
          variant: "destructive"
        });
        return;
      }

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
        
        // Close the popup and show waiting message
        onClose();
        toast({
          title: "Payment Window Opened",
          description: "Complete your payment in the new tab. Your download will start automatically upon successful payment.",
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkipPayment = () => {
    toast({
      title: "Payment Skipped",
      description: "Proceeding with free download for testing purposes.",
    });
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-worksheet-purple" />
            Export {exportType.toUpperCase()} - Premium Feature
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-800 mb-1">Premium Export</p>
              <p className="text-blue-700">
                Export your worksheet as {exportType.toUpperCase()} for <strong>$2.99</strong>. 
                This includes professional formatting and unlimited downloads of this worksheet.
              </p>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p className="font-medium mb-1">What you get:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>High-quality {exportType.toUpperCase()} export</li>
              <li>Professional formatting</li>
              <li>Unlimited re-downloads</li>
              <li>Student and teacher versions</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full bg-worksheet-purple hover:bg-worksheet-purpleDark"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {isProcessing ? 'Processing...' : `Pay $2.99 & Export ${exportType.toUpperCase()}`}
            </Button>
            
            {/* Temporary skip button for testing */}
            <Button
              onClick={handleSkipPayment}
              variant="outline"
              className="w-full border-2 border-dashed border-amber-400 text-amber-700 hover:bg-amber-50"
            >
              Skip Payment (Testing Only)
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            Secure payment powered by Stripe. You can use coupon code "free" for testing.
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="absolute right-4 top-4"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentPopup;


import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, CreditCard, Download, SkipForward } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  worksheetId: string;
  exportType: 'pdf' | 'html';
  onPaymentSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  worksheetId,
  exportType,
  onPaymentSuccess
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { markAsPaid } = usePaymentStatus(worksheetId);

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      console.log('Creating payment session for worksheet:', worksheetId);
      
      const { data, error } = await supabase.functions.invoke('create-export-payment', {
        body: {
          worksheetId,
          exportType,
          amount: 100, // $1.00 in cents
        }
      });

      if (error) {
        console.error('Payment creation error:', error);
        throw new Error(error.message || 'Failed to create payment session');
      }

      if (!data?.url) {
        throw new Error('No payment URL received');
      }

      console.log('Redirecting to payment:', data.url);
      
      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
      
      // Close modal after opening payment
      onClose();
      
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkipPayment = () => {
    // Mark as paid for testing purposes
    markAsPaid('test-session-' + Date.now());
    
    toast({
      title: "Payment Skipped (Test Mode)",
      description: "Download access granted for testing purposes.",
    });
    
    onPaymentSuccess();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download {exportType.toUpperCase()} - $1.00
          </DialogTitle>
          <DialogDescription>
            To download your worksheet, a one-time payment of $1.00 is required. 
            After payment, you'll be able to download both PDF and HTML versions.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">What you get:</h4>
            <ul className="text-sm space-y-1">
              <li>• Professional PDF worksheet</li>
              <li>• Editable HTML version</li>
              <li>• Both student and teacher versions</li>
              <li>• Instant download access</li>
            </ul>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="flex-1 bg-worksheet-purple hover:bg-worksheet-purpleDark"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay $1.00
                </>
              )}
            </Button>
          </div>
          
          {/* Test mode skip button */}
          <div className="border-t pt-3">
            <Button
              onClick={handleSkipPayment}
              variant="outline"
              className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
              disabled={isProcessing}
            >
              <SkipForward className="mr-2 h-4 w-4" />
              Skip Payment (Test Mode)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;

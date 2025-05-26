
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Download, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const sessionId = searchParams.get('session_id');
      
      if (!sessionId) {
        toast({
          title: "Invalid Payment",
          description: "No payment session found",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      try {
        console.log('Verifying payment session:', sessionId);
        
        const { data, error } = await supabase.functions.invoke('verify-export-payment', {
          body: { sessionId }
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data.status === 'paid') {
          // Mark worksheet as paid in session storage
          const paidWorksheets = JSON.parse(sessionStorage.getItem('paidWorksheets') || '{}');
          paidWorksheets[data.worksheetId] = {
            isPaid: true,
            sessionId,
            timestamp: Date.now()
          };
          sessionStorage.setItem('paidWorksheets', JSON.stringify(paidWorksheets));
          
          setPaymentData(data);
          
          // Dispatch payment complete event
          window.dispatchEvent(new CustomEvent('paymentComplete', {
            detail: { worksheetId: data.worksheetId, sessionId }
          }));
          
          toast({
            title: "Payment Successful!",
            description: "You can now download your worksheet files.",
            className: "bg-green-50 border-green-200"
          });
        } else {
          throw new Error('Payment not completed');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        toast({
          title: "Payment Verification Failed",
          description: error instanceof Error ? error.message : "Could not verify payment",
          variant: "destructive"
        });
        navigate('/');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, navigate, toast]);

  const handleBackToWorksheet = () => {
    if (paymentData?.worksheetId) {
      // Navigate back to the main page - the worksheet should still be in memory
      navigate('/');
    } else {
      navigate('/');
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm max-w-md w-full mx-4">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-worksheet-purple mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
            <p className="text-gray-600">Please wait while we confirm your payment...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-sm max-w-md w-full mx-4">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your $1.00 payment. You can now download your worksheet files.
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-green-800 mb-2">What's Available:</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Professional PDF worksheet</li>
              <li>• Editable HTML version</li>
              <li>• Both student and teacher versions</li>
            </ul>
          </div>
          
          <Button 
            onClick={handleBackToWorksheet}
            className="w-full bg-worksheet-purple hover:bg-worksheet-purpleDark"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Worksheet
          </Button>
          
          <p className="text-xs text-gray-500 mt-4">
            Download access is available for this browser session only.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;

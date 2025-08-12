
import React, { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import WorksheetForm, { FormData } from "@/components/WorksheetForm";
import TrackingFormWrapper from "@/components/WorksheetForm/TrackingFormWrapper";
import IsometricBackground from "@/components/IsometricBackground";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { User, GraduationCap, AlertTriangle, X } from "lucide-react";

interface FormViewProps {
  onSubmit: (data: FormData) => void;
  userId?: string;
  onStudentChange?: (studentId: string | null) => void;
  preSelectedStudent?: { id: string; name: string } | null;
  isRegisteredUser?: boolean;
  generationError?: string | null;
  onClearError?: () => void;
}

const FormView: React.FC<FormViewProps> = ({ 
  onSubmit, 
  userId, 
  onStudentChange, 
  preSelectedStudent,
  isRegisteredUser = false,
  generationError,
  onClearError
}) => {
  const isMobile = useIsMobile();
  const [couponCode, setCouponCode] = useState("");
  const [showCouponDialog, setShowCouponDialog] = useState(false);

  const handleSubscriptionWithCoupon = async (planType: string, monthlyLimit: number, price: number, planName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          planType,
          monthlyLimit,
          price,
          planName,
          couponCode: couponCode.trim() || undefined
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Subscription error:', error);
    }
  };

  return (
    <TrackingFormWrapper userId={userId}>
      <div className={`${isMobile ? 'w-full min-h-screen' : 'container mx-auto'} flex main-container relative`}>
        {/* Izometryczne tło - tylko na desktop */}
        {!isMobile && <IsometricBackground />}
        
        {!isMobile && (
          <div className="w-1/5 mx-0 py-[48px] relative z-10">
            <Sidebar />
          </div>
        )}
        <div className={`${isMobile ? 'w-full px-2 py-2' : 'w-4/5 px-6 py-6'} form-container relative z-10`}>
          {/* Error Banner */}
          {generationError && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 flex justify-between items-center">
                <span>
                  <strong>Generation Error:</strong> {generationError}
                  <br />
                  <em>Please check your input and try again.</em>
                </span>
                {onClearError && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearError}
                    className="text-red-600 hover:text-red-800 hover:bg-red-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          <WorksheetForm 
            onSubmit={onSubmit} 
            onStudentChange={onStudentChange} 
            preSelectedStudent={preSelectedStudent}
          />
        </div>
      </div>

      {/* Dialog for coupon code input */}
      <Dialog open={showCouponDialog} onOpenChange={setShowCouponDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Coupon Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Enter coupon code (optional)"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={() => setShowCouponDialog(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={() => {
                // This would be called with actual plan details
                setShowCouponDialog(false);
              }}>
                Apply & Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TrackingFormWrapper>
  );
};

export default FormView;

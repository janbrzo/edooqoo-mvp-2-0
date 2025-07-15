
import React, { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import WorksheetForm, { FormData } from "@/components/WorksheetForm";
import TrackingFormWrapper from "@/components/WorksheetForm/TrackingFormWrapper";
import IsometricBackground from "@/components/IsometricBackground";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { useAnonymousAuth } from "@/hooks/useAnonymousAuth";
import { useTokenSystem } from "@/hooks/useTokenSystem";
import { TokenPaywall } from "@/components/TokenPaywall";

interface FormViewProps {
  onSubmit: (data: FormData) => void;
  userId?: string;
  onStudentSelect?: (studentId: string | null) => void;
  selectedStudentId?: string | null;
}

const FormView: React.FC<FormViewProps> = ({ onSubmit, userId, onStudentSelect, selectedStudentId }) => {
  const isMobile = useIsMobile();
  const { userId: authUserId } = useAnonymousAuth();
  const { hasTokens, isDemo } = useTokenSystem(authUserId);
  const [showTokenPaywall, setShowTokenPaywall] = useState(false);
  const isAuthenticated = !!authUserId;

  const handleSubmit = async (data: FormData) => {
    console.log('Form submitted with data:', data);
    
    // Check token requirements for authenticated users before generation
    if (!isDemo && !hasTokens) {
      setShowTokenPaywall(true);
      return;
    }
    
    await onSubmit(data);
  };

  // Show token paywall modal instead of full page
  if (showTokenPaywall) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-background rounded-lg p-6 max-w-md w-full">
          <TokenPaywall />
          <Button 
            variant="outline" 
            className="w-full mt-4"
            onClick={() => setShowTokenPaywall(false)}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <IsometricBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row justify-end items-end mb-8">
          <div className="flex gap-2">
            {isAuthenticated ? (
              <>
                <Button asChild variant="outline">
                  <Link to="/profile">Profile</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
              </>
            ) : (
              <Button asChild variant="outline">
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {!isMobile && (
            <div className="lg:w-1/4">
              <Sidebar />
            </div>
          )}
          
          <div className="flex-1">
            <WorksheetForm 
              onSubmit={handleSubmit} 
              onStudentSelect={onStudentSelect}
              selectedStudentId={selectedStudentId}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormView;

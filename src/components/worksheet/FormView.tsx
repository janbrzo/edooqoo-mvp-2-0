
import React from "react";
import { Link } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import WorksheetForm, { FormData } from "@/components/WorksheetForm";
import TrackingFormWrapper from "@/components/WorksheetForm/TrackingFormWrapper";
import IsometricBackground from "@/components/IsometricBackground";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { useWorksheetState } from "@/hooks/useWorksheetState";
import { useWorksheetGeneration } from "@/hooks/useWorksheetGeneration";

interface FormViewProps {
  onSubmit: (data: FormData) => void;
  userId?: string;
}

const FormView: React.FC<FormViewProps> = ({ onSubmit, userId }) => {
  const isMobile = useIsMobile();
  const worksheetState = useWorksheetState(false);
  
  const handleSubmit = (data: FormData) => {
    const hook = useWorksheetGeneration(userId, worksheetState, data.studentId);
    hook.generateWorksheetHandler(data);
  };

  return (
    <TrackingFormWrapper userId={userId}>
      {/* Header with auth buttons */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <Button asChild variant="outline">
          <Link to="/auth">Sign In</Link>
        </Button>
        <Button asChild>
          <Link to="/dashboard">Dashboard</Link>
        </Button>
      </div>
      
      <div className={`${isMobile ? 'w-full min-h-screen' : 'container mx-auto'} flex main-container relative`}>
        {/* Izometryczne tło - tylko na desktop */}
        {!isMobile && <IsometricBackground />}
        
        {!isMobile && (
          <div className="w-1/5 mx-0 py-[48px] relative z-10">
            <Sidebar />
          </div>
        )}
        <div className={`${isMobile ? 'w-full px-2 py-2' : 'w-4/5 px-6 py-6'} form-container relative z-10`}>
          <WorksheetForm onSubmit={handleSubmit} />
        </div>
      </div>
    </TrackingFormWrapper>
  );
};

export default FormView;

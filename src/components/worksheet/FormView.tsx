
import React from "react";
import Sidebar from "@/components/Sidebar";
import WorksheetForm from "@/components/WorksheetForm";
import { FormData } from "@/components/WorksheetForm/types";
import TrackingFormWrapper from "@/components/WorksheetForm/TrackingFormWrapper";
import IsometricBackground from "@/components/IsometricBackground";
import { useIsMobile } from "@/hooks/use-mobile";

interface FormViewProps {
  onSubmit: (data: FormData) => void;
  userId?: string;
}

const FormView: React.FC<FormViewProps> = ({ onSubmit, userId }) => {
  const isMobile = useIsMobile();

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
          <WorksheetForm onSubmit={onSubmit} isLoading={false} />
        </div>
      </div>
    </TrackingFormWrapper>
  );
};

export default FormView;


import React from "react";
import { Link } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import WorksheetForm, { FormData } from "@/components/WorksheetForm";
import TrackingFormWrapper from "@/components/WorksheetForm/TrackingFormWrapper";
import IsometricBackground from "@/components/IsometricBackground";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { User, GraduationCap } from "lucide-react";

interface FormViewProps {
  onSubmit: (data: FormData) => void;
  userId?: string;
  onStudentChange?: (studentId: string | null) => void;
  preSelectedStudent?: { id: string; name: string } | null;
  isRegisteredUser?: boolean;
}

const FormView: React.FC<FormViewProps> = ({ 
  onSubmit, 
  userId, 
  onStudentChange, 
  preSelectedStudent,
  isRegisteredUser = false
}) => {
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
          <WorksheetForm 
            onSubmit={onSubmit} 
            onStudentChange={onStudentChange} 
            preSelectedStudent={preSelectedStudent}
          />
        </div>
      </div>
    </TrackingFormWrapper>
  );
};

export default FormView;

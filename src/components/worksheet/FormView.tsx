
import React from "react";
import Sidebar from "@/components/Sidebar";
import WorksheetForm, { FormData } from "@/components/WorksheetForm";
import { useIsMobile } from "@/hooks/use-mobile";

interface FormViewProps {
  onSubmit: (data: FormData) => void;
}

const FormView: React.FC<FormViewProps> = ({ onSubmit }) => {
  const isMobile = useIsMobile();

  return (
    <div className={`${isMobile ? 'w-full min-h-screen' : 'container mx-auto'} flex main-container`}>
      {!isMobile && (
        <div className="w-1/5 mx-0 py-[48px]">
          <Sidebar />
        </div>
      )}
      <div className={`${isMobile ? 'w-full px-2 py-2' : 'w-4/5 px-6 py-6'} form-container`}>
        <WorksheetForm onSubmit={onSubmit} />
      </div>
    </div>
  );
};

export default FormView;

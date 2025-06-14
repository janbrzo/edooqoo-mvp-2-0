
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
    <div className="container mx-auto flex main-container">
      <div className="w-1/5 mx-0 py-[48px]">
        <Sidebar />
      </div>
      <div className="w-4/5 px-6 py-6 form-container">
        <WorksheetForm onSubmit={onSubmit} />
      </div>
    </div>
  );
};

export default FormView;

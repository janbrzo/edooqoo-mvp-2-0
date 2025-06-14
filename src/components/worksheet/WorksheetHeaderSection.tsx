
import React from "react";
import WorksheetHeader from "./WorksheetHeader";
import InputParamsCard from "./InputParamsCard";

interface WorksheetHeaderSectionProps {
  onBack: () => void;
  generationTime: number;
  sourceCount: number;
  inputParams: any;
  isMobile: boolean;
}

const WorksheetHeaderSection: React.FC<WorksheetHeaderSectionProps> = ({
  onBack,
  generationTime,
  sourceCount,
  inputParams,
  isMobile
}) => {
  return (
    <div className={`mb-6 ${isMobile ? 'px-2' : ''}`}>
      <WorksheetHeader
        onBack={onBack}
        generationTime={generationTime}
        sourceCount={sourceCount}
        inputParams={inputParams}
      />
      <InputParamsCard inputParams={inputParams} />
    </div>
  );
};

export default WorksheetHeaderSection;

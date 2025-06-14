
import React from 'react';
import { WorksheetContent } from './WorksheetContent';
import { WorksheetToolbar } from './WorksheetToolbar';
import WorksheetRating from '../WorksheetRating';

interface WorksheetContainerProps {
  worksheetData: any;
  onSubmitRating?: (rating: number, feedback: string) => void;
  worksheetId?: string | null;
}

export const WorksheetContainer: React.FC<WorksheetContainerProps> = ({
  worksheetData,
  onSubmitRating,
  worksheetId
}) => {
  return (
    <div className="worksheet-container">
      <WorksheetToolbar 
        worksheetData={worksheetData} 
        worksheetId={worksheetId}
      />
      
      <WorksheetContent worksheetData={worksheetData} />
      
      <WorksheetRating 
        onSubmitRating={onSubmitRating}
        worksheetId={worksheetId}
      />
    </div>
  );
};

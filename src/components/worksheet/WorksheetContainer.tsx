
import React from 'react';
import WorksheetContent from './WorksheetContent';
import WorksheetToolbar from './WorksheetToolbar';
import WorksheetRating from '../WorksheetRating';

interface WorksheetContainerProps {
  worksheetData: any;
  onSubmitRating?: (rating: number, feedback: string) => void;
  worksheetId?: string | null;
  children?: React.ReactNode;
}

export const WorksheetContainer: React.FC<WorksheetContainerProps> = ({
  worksheetData,
  onSubmitRating,
  worksheetId,
  children
}) => {
  return (
    <div className="worksheet-container">
      {children}
      
      <WorksheetRating 
        onSubmitRating={onSubmitRating}
        worksheetId={worksheetId}
      />
    </div>
  );
};

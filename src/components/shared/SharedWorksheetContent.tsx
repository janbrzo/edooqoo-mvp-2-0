
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface SharedWorksheetContentProps {
  worksheet: {
    html_content: string;
    ai_response: string;
    title: string;
  };
}

const SharedWorksheetContent: React.FC<SharedWorksheetContentProps> = ({ worksheet }) => {
  // If we have html_content, use it directly (this is the formatted version)
  if (worksheet.html_content && worksheet.html_content.trim()) {
    return (
      <div 
        id="shared-worksheet-content"
        dangerouslySetInnerHTML={{ __html: worksheet.html_content }}
        className="prose max-w-none"
      />
    );
  }

  // Fallback: try to parse ai_response for older worksheets
  let parsedWorksheet;
  try {
    parsedWorksheet = JSON.parse(worksheet.ai_response);
  } catch (error) {
    console.error('Error parsing worksheet data:', error);
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Unable to display worksheet content</p>
      </div>
    );
  }

  if (!parsedWorksheet) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No worksheet data available</p>
      </div>
    );
  }

  // Fallback rendering using React components (for older worksheets)
  return (
    <div id="shared-worksheet-content">
      <h2 className="text-xl font-bold mb-4">{parsedWorksheet.title}</h2>
      {parsedWorksheet.subtitle && (
        <p className="text-gray-600 mb-4">{parsedWorksheet.subtitle}</p>
      )}
      {parsedWorksheet.introduction && (
        <p className="mb-6">{parsedWorksheet.introduction}</p>
      )}
      
      {parsedWorksheet.exercises?.map((exercise: any, index: number) => (
        <div key={index} className="mb-8 p-4 border rounded-lg">
          <h3 className="font-semibold text-lg mb-2">
            Exercise {index + 1}: {exercise.title}
          </h3>
          <p className="text-gray-600 mb-3">{exercise.instructions}</p>
          
          {exercise.content && (
            <div className="mb-3">
              <p>{exercise.content}</p>
            </div>
          )}
          
          {exercise.questions?.map((question: any, qIndex: number) => (
            <div key={qIndex} className="mb-2">
              <p><strong>{qIndex + 1}.</strong> {question.question || question}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default SharedWorksheetContent;


import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, Clock, BarChart3 } from 'lucide-react';

interface WorksheetHeaderProps {
  formData: any;
  createdAt: string;
  generationTime?: number;
  studentId?: string;
  studentName?: string;
}

export const WorksheetHeader: React.FC<WorksheetHeaderProps> = ({
  formData,
  createdAt,
  generationTime,
  studentId,
  studentName
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStudentName = () => {
    if (!studentName) return null;
    
    if (studentId) {
      return (
        <Link 
          to={`/student/${studentId}`} 
          className="text-primary hover:text-primary/80 underline font-medium"
        >
          {studentName}
        </Link>
      );
    }
    
    return <span className="font-medium">{studentName}</span>;
  };

  return (
    <div className="border-b pb-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              {formData.englishLevel || 'General'}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {formData.lessonTime || '60 min'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(createdAt)}
            </div>
            
            {generationTime && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {generationTime}s
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {studentName && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              {renderStudentName()}
            </div>
          )}
          
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            Worksheet
          </div>
        </div>
      </div>
    </div>
  );
};

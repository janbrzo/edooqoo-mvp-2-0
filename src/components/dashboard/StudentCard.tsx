
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteWorksheetDialog } from "@/components/worksheet/DeleteWorksheetDialog";
import { useWorksheetHistory } from '@/hooks/useWorksheetHistory';
import { User, Calendar, FileText, Eye, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface Student {
  id: string;
  name: string;
  english_level: string;
  main_goal: string;
  teacher_id: string;
  teacher_email?: string;
  created_at: string;
  updated_at: string;
}

interface StudentCardProps {
  student: Student;
}

export const StudentCard = ({ student }: StudentCardProps) => {
  const navigate = useNavigate();
  const { worksheets, getRecentWorksheets, deleteWorksheet } = useWorksheetHistory(student.id);
  const recentWorksheets = getRecentWorksheets(3);
  
  const handleViewStudent = () => {
    navigate(`/student/${student.id}`);
  };

  const handleViewWorksheet = (worksheetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to worksheet view or open modal
  };

  // Get initials from name
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`;
    }
    return `${parts[0]?.charAt(0) || ''}${parts[0]?.charAt(1) || ''}`;
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group" onClick={handleViewStudent}>
      <CardContent className="p-6">
        {/* Student Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
              {getInitials(student.name)}
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                {student.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Badge variant="secondary" className="text-xs">
                  {student.english_level}
                </Badge>
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {worksheets.length} worksheets
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Worksheets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Recent Worksheets</h4>
            {worksheets.length > 3 && (
              <span className="text-xs text-gray-500">+{worksheets.length - 3} more</span>
            )}
          </div>
          
          {recentWorksheets.length === 0 ? (
            <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
              <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No worksheets yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentWorksheets.map((worksheet) => (
                <div 
                  key={worksheet.id} 
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group/worksheet"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {worksheet.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(worksheet.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2 opacity-0 group-hover/worksheet:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={(e) => handleViewWorksheet(worksheet.id, e)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <DeleteWorksheetDialog
                      worksheetId={worksheet.id}
                      worksheetTitle={worksheet.title}
                      onDelete={deleteWorksheet}
                      variant="icon"
                      size="sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Student Stats */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Added {formatDistanceToNow(new Date(student.created_at), { addSuffix: true })}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

import { useParams, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWorksheetHistory } from '@/hooks/useWorksheetHistory';
import { useStudents } from '@/hooks/useStudents';
import { Sidebar } from '@/components/Sidebar';
import { WorksheetDisplay } from '@/components/WorksheetDisplay';
import { StudentEditDialog } from '@/components/StudentEditDialog';
import { DeleteWorksheetDialog } from '@/components/worksheet/DeleteWorksheetDialog';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { Calendar, Clock, FileText, User, Edit, Eye, Download } from 'lucide-react';

export default function StudentPage() {
  const { studentId } = useParams();
  const { students } = useStudents();
  const { worksheets, loading, deleteWorksheet } = useWorksheetHistory(studentId);
  const [selectedWorksheet, setSelectedWorksheet] = useState<any>(null);
  
  const student = students.find(s => s.id === studentId);
  
  if (!student) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleViewWorksheet = (worksheet: any) => {
    setSelectedWorksheet(worksheet);
  };

  const handleCloseWorksheet = () => {
    setSelectedWorksheet(null);
  };

  if (selectedWorksheet) {
    return (
      <WorksheetDisplay 
        worksheet={selectedWorksheet} 
        onClose={handleCloseWorksheet}
        showToolbar={true}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Sidebar />
      <div className="pl-64">
        <div className="container mx-auto px-6 py-8">
          {/* Student Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {student.first_name} {student.last_name}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Level: {student.english_level}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span>{worksheets.length} worksheets</span>
                    </div>
                  </div>
                </div>
              </div>
              <StudentEditDialog student={student} />
            </div>
            
            {student.notes && (
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="pt-4">
                  <p className="text-sm text-amber-800">{student.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Worksheets Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Student Worksheets</h2>
              <Badge variant="secondary" className="px-3 py-1">
                {worksheets.length} total
              </Badge>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading worksheets...</p>
              </div>
            ) : worksheets.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No worksheets yet</h3>
                  <p className="text-gray-600 mb-4">Create the first worksheet for this student</p>
                  <Button onClick={() => window.location.href = '/'}>
                    Create Worksheet
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {worksheets.map((worksheet) => (
                  <Card key={worksheet.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">{worksheet.title}</CardTitle>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatDistanceToNow(new Date(worksheet.created_at), { addSuffix: true })}</span>
                            </div>
                            {worksheet.generation_time_seconds && (
                              <div className="flex items-center gap-1">
                                <span>Generated in {worksheet.generation_time_seconds}s</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewWorksheet(worksheet)}
                            className="gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <DeleteWorksheetDialog
                            worksheetId={worksheet.id}
                            worksheetTitle={worksheet.title}
                            onDelete={deleteWorksheet}
                            variant="icon"
                          />
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
